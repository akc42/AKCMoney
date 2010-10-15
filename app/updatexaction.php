<?php
/*
 	Copyright (c) 2009,2010 Alan Chandler
    This file is part of AKCMoney.

    AKCMoney is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    AKCMoney is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with AKCMoney (file COPYING.txt).  If not, see <http://www.gnu.org/licenses/>.

*/
error_reporting(E_ALL);

require_once('./inc/db.inc');
if(!$user['isAdmin']) die('insufficient permissions');

$sstmt = $db->prepare("
    SELECT 
        xaction.*,  
        ct.rate AS trate, 
        srcacc.currency AS srccurrency,
        cs.rate AS srate,
        dstacc.currency AS dstcurrency,
        cd.rate AS drate,
        srcacc.domain AS srcdom,
        dstacc.domain AS dstdom 
    FROM xaction 
    JOIN currency AS ct ON xaction.currency = ct.name
    LEFT JOIN account AS srcacc ON xaction.src = srcacc.name
    LEFT JOIN currency AS cs ON srcacc.currency = cs.name
    LEFT JOIN account AS dstacc ON xaction.dst = dstacc.name
    LEFT JOIN currency AS cd ON dstacc.currency = cd.name
    WHERE xaction.id= ?;
");
$sstmt->bindValue(1,$_POST['tid']);

$cleared = (isset($_POST['cleared']))?1:0;
$accounttype = $_POST['accounttype'];
$amount = round($_POST['amount']*100);


$ustmt = $db->prepare("
    UPDATE xaction SET 
        version = version + 1,
        date = ? ,
        amount = ?,
        currency = ?,
        rno = ?,
        description = ?,
        src = ?,
        srcamount = ?,
        srcclear = ?,
        srccode = ?,
        dst = ?,
        dstamount = ?,
        dstclear = ?,
        dstcode = ?,
        repeat = ?
    WHERE id = ?
");
$ustmt->bindValue(1,$_POST['xdate'],PDO::PARAM_INT);
$ustmt->bindValue(2,$amount,PDO::PARAM_INT);
$ustmt->bindValue(3,$_POST['currency']);
$ustmt->bindValue(4,$_POST['rno']);
$ustmt->bindValue(5,$_POST['desc']);

$ustmt->bindValue(15,$_POST['tid'],PDO::PARAM_INT);

$cstmt = $db->prepare("SELECT rate FROM currency WHERE name = ? ;");
$cstmt->bindValue(1,$_POST['currency']);


$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();
$row = $sstmt->fetch(PDO::FETCH_ASSOC);
$sstmt->closeCursor();
if (!isset($row['version']) || $row['version'] != $_POST['version'] ) {
?><error>Someone else is editing this transaction in parallel to you.  In order to ensure you are working with consistent
data we will reload the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] + 1;

if($row['amount'] == $amount  && $row['currency'] == $_POST['currency']) {
	$amountNotChanged = true;
} else {
	$amountNotChanged = false;
}


if($accounttype == "src") {
    $ustmt->bindValue(9,($_POST['code'] != '0')?$_POST['code']:NULL,($_POST['code'] != '0')?PDO::PARAM_INT:PDO::PARAM_NULL);
    if($_POST['accountname'] == $row['src']) {
    //account name is the same as before so we can rely on $row data for src information
        $acurrency = $row['srccurrency'];
        $arate = $row['srate'];
    } else {
        //We have mostlikely switched accounts (it HAS to be one or the other)
        $acurrency = $row['dstcurrency'];
        $arate = $row['drate'];        
    }
    if($_POST['currency'] == $acurrency) {
        $ustmt->bindValue(7,NULL,PDO::PARAM_NULL);
        $aamount = $amount;
    } else {
        $aamount = round(100*$_POST['aamount']);
        $ustmt->bindValue(7,$aamount,PDO::PARAM_INT);
    }
    $aamount = -$aamount; //We need it negative if this is a source account
    if($_POST['repeat'] == "0") {
        $ustmt->bindValue(8,$cleared,PDO::PARAM_INT);
        $ustmt->bindValue(14,0,PDO::PARAM_INT);
    } else {
        $ustmt->bindValue(8,0,PDO::PARAM_INT);
        $ustmt->bindValue(14,$_POST['repeat'],PDO::PARAM_INT);
    }
    if($_POST['move'] == '1' && is_null($row['dst']) && $_POST['account'] != '') {
        $ustmt->bindValue(6,$_POST['account']);
        $ustmt->bindValue(10,NULL,PDO::PARAM_NULL);
        $ustmt->bindValue(11,NULL,PDO::PARAM_NULL);
        $ustmt->bindValue(12,0,PDO::PARAM_INT);
        $ustmt->bindValue(13,NULL,PDO::PARAM_NULL);
    } else {
        $ustmt->bindValue(6,$_POST['accountname']);
        if($_POST['account'] != '') {
            // We had a second account selected
            $ustmt->bindValue(10,$_POST['account']);
            if(isset($row['dst']) && $_POST['account'] == $row['dst']) {
            //We have not changed it
                $brate = $row['drate'];
                if($_POST['currency'] == $row['dstcurrency']) {
                    $ustmt->bindValue(11,NULL,PDO::PARAM_NULL);
                } elseif ($amountNotChanged) { //if amount not changed just use original amount in transaction
                	$ustmt->bindValue(11,$row['dstamount'],PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['currency']) {
                    $ustmt->bindValue(11,round($amount*$brate/$row['trate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['srccurrency']) {
                    $ustmt->bindValue(11,round($amount*$brate/$row['srate']),PDO::PARAM_INT);
                } else {
                    // not any of the currencies we know about - we will have to go read it to find the rate
                    $cstmt->execute();
                    $rate = $cstmt->fetchColumn();
                    $cstmt->closeCursor();
                    $ustmt->bindValue(11,round($amount*$brate/$rate),PDO::PARAM_INT);
                }
                $ustmt->bindValue(12,$row['dstclear'],PDO::PARAM_INT);
                if ($row['srcdom'] == $row['dstdom']) {
                    $ustmt->bindValue(13,NULL,PDO::PARAM_NULL);
                } else {
                    $ustmt->bindValue(13,$row['dstcode'],PDO::PARAM_INT);
                }
            } elseif (isset($row['src']) && $_POST['account'] == $row['src']) {
            // Must have swapped source and destination
                $brate = $row['srate'];
                if($_POST['currency'] == $row['srccurrency']) {
                    $ustmt->bindValue(11,NULL,PDO::PARAM_NULL);
                } elseif ($amountNotChanged) { //if amount not changed just use original amount in transaction
                	$ustmt->bindValue(11,$row['srcamount'],PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['currency']) {
                    $ustmt->bindValue(11,round($amount*$brate/$row['trate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['dstcurrency']) {
                    $ustmt->bindValue(11,round($amount*$brate/$row['drate']),PDO::PARAM_INT);
                } else {
                    // not any of the currencies we know about - we will have to go read it to find the rate
                    $cstmt->execute();
                    $rate = $cstmt->fetchColumn();
                    $cstmt->closeCursor();
                    $ustmt->bindValue(11,round($amount*$brate/$rate));
                }
                $ustmt->bindValue(12,$row['srcclear'],PDO::PARAM_INT);
                if ($row['srcdom'] == $row['dstdom']) {
                    $ustmt->bindValue(13,NULL,PDO::PARAM_NULL);
                } else {
                    $ustmt->bindValue(13,$row['dstcode'],PDO::PARAM_INT);
                }
            } else {
                $rstmt = $db->prepare("
                    SELECT
                        account.currency AS currency,
                        currency.rate AS rate
                    FROM account, currency
                    WHERE currency.name = account.currency AND account.name = ? ;
                ");
                $rstmt->bindValue(1,$_POST['account']);
                $rstmt->execute();
                $rstmt->bindColumn(1,$bcurrency);
                $rstmt->bindColumn(2,$brate);
                $rstmt->fetch(PDO::FETCH_BOUND);
                if ($_POST['currency'] == $bcurrency) {
                    $ustmt->bindValue(11,NULL,PDO::PARAM_NULL);
                } elseif($_POST['currency'] == $row['srccurrency']) {
                    $ustmt->bindValue(11,round($amount*$brate/$row['srate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['currency']) {
                    $ustmt->bindValue(11,round($amount*$brate/$row['trate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['dstcurrency']) {
                    $ustmt->bindValue(11,round($amount*$brate/$row['drate']),PDO::PARAM_INT);
                } else {
                    // not any of the currencies we know about - we will have to go read it to find the rate
                    $cstmt->execute();
                    $rate = $cstmt->fetchColumn();
                    $cstmt->closeCursor();
                    $ustmt->bindValue(11,round($amount*$brate/$rate),PDO::PARAM_INT);
                }
                $ustmt->bindValue(12,0,PDO::PARAM_INT);
                $ustmt->bindValue(13,NULL,PDO::PARAM_NULL);
            } 
        } else {
            $ustmt->bindValue(10,NULL,PDO::PARAM_NULL);
            $ustmt->bindValue(11,NULL,PDO::PARAM_NULL);
            $ustmt->bindValue(12,0,PDO::PARAM_INT);
            $ustmt->bindValue(13,NULL,PDO::PARAM_NULL);
        }
    }
    
} else {
    $ustmt->bindValue(13,($_POST['code'] != '0')?$_POST['code']:NULL,($_POST['code'] != '0')?PDO::PARAM_INT:PDO::PARAM_NULL);
    if($_POST['accountname'] == $row['dst']) {
    //account name is the same as before so we can rely on $row data for src information
        $acurrency = $row['dstcurrency'];
        $arate = $row['drate'];
    } else {
        //We have mostlikely switched accounts
        $acurrency = $row['srccurrency'];
        $arate = $row['srate'];
    }
    if($_POST['currency'] == $acurrency) {
        $ustmt->bindValue(11,NULL,PDO::PARAM_NULL);
        $aamount = $amount;
    } else {
        $aamount = round(100*$_POST['aamount']);
        $ustmt->bindValue(11,$aamount,PDO::PARAM_INT);
    }
    if($_POST['repeat'] == "0") {
        $ustmt->bindValue(12,$cleared,PDO::PARAM_INT);
        $ustmt->bindValue(14,0,PDO::PARAM_INT);
    } else {
        $ustmt->bindValue(12,0,PDO::PARAM_INT);
        $ustmt->bindValue(14,$_POST['repeat'],PDO::PARAM_INT);
    }
    if($_POST['move'] == '1' && is_null($row['src']) && $_POST['account'] != '') {
        $ustmt->bindValue(10,$_POST['account']);
        $ustmt->bindValue(6,NULL,PDO::PARAM_NULL);
        $ustmt->bindValue(7,NULL,PDO::PARAM_NULL);
        $ustmt->bindValue(8,0,PDO::PARAM_INT);
        $ustmt->bindValue(9,NULL,PDO::PARAM_NULL);
    } else {
        $ustmt->bindValue(10,$_POST['accountname']);
        if($_POST['account'] != '') {
            $ustmt->bindValue(6,$_POST['account']);
            if(isset($row['src']) && $_POST['account'] == $row['src']) {
            // The other account has not changed
                $brate = $row['srate'];
                if($_POST['currency'] == $row['srccurrency']) {
                    $ustmt->bindValue(7,NULL,PDO::PARAM_NULL);
                } elseif ($amountNotChanged) { //if amount not changed just use original amount in transaction
                	$ustmt->bindValue(7,$row['srcamount'],PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['currency']) {
                    $ustmt->bindValue(7,round($amount*$brate/$row['trate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['dstcurrency']) {
                    $ustmt->bindValue(7,round($amount*$brate/$row['drate']),PDO::PARAM_INT);
                } else {
                    // not any of the currencies we know about - we will have to go read it to find the rate
                    $cstmt->execute();
                    $rate = $cstmt->fetchColumn();
                    $cstmt->closeCursor();
                    $ustmt->bindValue(7,round($amount*$brate/$rate),PDO::PARAM_INT);
                }
                $ustmt->bindValue(8,$row['srcclear'],PDO::PARAM_INT);
                if ($row['srcdom'] == $row['dstdom']) {
                    $ustmt->bindValue(9,NULL,PDO::PARAM_NULL);
                } else {
                    $ustmt->bindValue(9,$row['srccode'],PDO::PARAM_INT);
                }
            } elseif (isset($row['src']) && $_POST['account'] == $row['dst']) {
            //We must have swapped source and destinations
                $brate = $row['drate'];
                if($_POST['currency'] == $row['dstcurrency']) {
                    $ustmt->bindValue(7,NULL,PDO::PARAM_NULL);
                } elseif ($amountNotChanged) { //if amount not changed just use original amount in transaction
                	$ustmt->bindValue(7,$row['dstamount'],PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['currency']) {
                    $ustmt->bindValue(7,round($amount*$brate/$row['trate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['srccurrency']) {
                    $ustmt->bindValue(7,round($amount*$brate/$row['srate']),PDO::PARAM_INT);
                } else {
                    // not any of the currencies we know about - we will have to go read it to find the rate
                    $cstmt->execute();
                    $rate = $cstmt->fetchColumn();
                    $cstmt->closeCursor();
                    $ustmt->bindValue(7,round($amount*$brate/$rate),PDO::PARAM_INT);
                }
                $ustmt->bindValue(8,$row['dstclear'],PDO::PARAM_INT);
                if ($row['srcdom'] == $row['dstdom']) {
                    $ustmt->bindValue(9,NULL,PDO::PARAM_NULL);
                } else {
                    $ustmt->bindValue(9,$row['srccode'],PDO::PARAM_INT);
                }
            } else {
                $rstmt = $db->prepare("
                    SELECT
                        account.currency AS currency,
                        currency.rate AS rate
                    FROM account, currency
                    WHERE currency.name = account.currency AND account.name = ? ;
                ");
                $rstmt->bindValue(1,$_POST['account']);
                $rstmt->execute();
                $rstmt->bindColumn(1,$bcurrency);
                $rstmt->bindColumn(2,$brate);
                $rstmt->fetch(PDO::FETCH_BOUND);
               if ($_POST['currency'] == $bcurrency) {
                    $ustmt->bindValue(7,NULL,PDO::PARAM_NULL);
                } elseif($_POST['currency'] == $row['srccurrency']) {
                    $ustmt->bindValue(7,round($amount*$barate/$row['srate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['currency']) {
                    $ustmt->bindValue(7,round($amount*$brate/$row['trate']),PDO::PARAM_INT);
                } elseif ($_POST['currency'] == $row['dstcurrency']) {
                    $ustmt->bindValue(7,round($amount*$brate/$row['drate']),PDO::PARAM_INT);
                } else {
                    // not any of the currencies we know about - we will have to go read it to find the rate
                    $cstmt->execute();
                    $rate = $cstmt->fetchColumn();
                    $cstmt->closeCursor();
                    $ustmt->bindValue(7,round($amount*$brate/$rate),PDO::PARAM_INT);
                }
                $ustmt->bindValue(8,0,PDO::PARAM_INT);
                $ustmt->bindValue(9,NULL,PDO::PARAM_NULL);
            } 
        } else {
            $ustmt->bindValue(6,NULL,PDO::PARAM_NULL);
            $ustmt->bindValue(7,NULL,PDO::PARAM_NULL);
            $ustmt->bindValue(8,0,PDO::PARAM_INT);
            $ustmt->bindValue(9,NULL,PDO::PARAM_NULL);
        }
    }
}
$ustmt->execute();
$ustmt->closeCursor();

$date = $_POST['xdate'];
$repeat = $_POST['repeat'];
$clear = ($repeat == '0')? (($cleared == 0)?'f':'t'):'f';


if($_POST['acchange'] == "2" && $_POST['currency'] != $acurrency) { //only if we requested to set the currencies and they are not the same
    if($amount != 0 && $aamount != 0) { //can only do this if neither value is 0
        //we asked to set the rate from the current transaction.
        $ratio = abs($amount/$aamount);
        $dstmt = $db->query("SELECT name FROM currency WHERE priority = 0;");
        $default_currency = $dstmt->fetchColumn();
        $dstmt->closeCursor();

        $ustmt = $db->prepare("UPDATE currency SET version = version+1, rate = ? WHERE name = ? ;");
        
        if($_POST['currency'] == $default_currency) {
            $ustmt->bindValue(1,1/$ratio);
            $ustmt->bindValue(2,$acurrency);//we need to change the rate of the account currency
        } elseif ($acurrency == $default_currency) {
        	$ustmt->bindValue(1,$ratio);
        	$ustmt->bindValue(2,$_POST['currency']); //updating the rate of the transaction currency
        } else {
           $ustmt->bindValue(1,$arate*$ratio);
            $ustmt->bindValue(2,$_POST['currency']);//we are changing the rate of the transaction currency
        }
        $ustmt->execute();
        $ustmt->closeCursor();
    }
}
$codetype = '';
$codedesc = '';
if($_POST['code'] != 0) {
    $cstmt = $db->prepare("SELECT type,description FROM code WHERE id = ? ;");
    $cstmt->bindValue(1,$_POST['code']);
    $cstmt->execute();
    $cstmt->bindColumn(1,$codetype);
    $cstmt->bindColumn(2,$codedesc);
    $cstmt->fetch(PDO::FETCH_BOUND);
    $cstmt->closeCursor();
}

$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" 
    version="<?php echo $version ?>" 
    date="<?php echo $date; ?>" repeat="<?php echo $repeat; ?>" 
    clear="<?php echo $clear ; ?>">
    <amount dual="<?php echo ($_POST['account'] != '')?'true':'false'; ?>" ><?php echo fmtAmount($aamount); ?></amount>
    <code codeid="<?php echo $_POST['code'];?>" codetype="<?php echo $codetype; ?>"><?php echo $codedesc; ?></code>
</xaction>

