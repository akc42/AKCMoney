<?php
/*
 	Copyright (c) 2009 Alan Chandler
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

session_start();

if(!isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] ) die('Hacking attempt - wrong key');

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");
$result=dbQuery("SELECT transaction.version, transaction.currency, ct.rate AS trate, ".
    "transaction.src, srcacc.currency AS srccurrency, cs.rate AS srate, ".
    "transaction.dst, dstacc.currency AS dstcurrency, cd.rate AS drate FROM transaction ".
    "LEFT JOIN currency AS ct ON transaction.currency = ct.name ".
    "LEFT JOIN account AS srcacc ON transaction.src = srcacc.name LEFT JOIN currency AS cs ON srcacc.currency = cs.name ".
    "LEFT JOIN account AS dstacc ON transaction.dst = dstacc.name LEFT JOIN currency AS cd ON dstacc.currency = cd.name ".
    "WHERE transaction.id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
if ($row['version'] != $_POST['version'] ) {
?><error>Someone else has changed this transaction in parallel with you.  In order to ensure consistent data, we have not updated the transaction
with your updates, and we are about to reload the page.  Sorry it has been necessary to do this.</error>
<?php
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}

$cleared = (isset($_POST['cleared']))?"TRUE":"FALSE";

$accounttype = $_POST['accounttype'];
$amount = (int)($_POST['amount']*100);
if($amount < 0 ) { //if the amount is negative, we are going to switch over
   $amount = -$amount;
   $accounttype = ($accounttype == "src")?"dst":"src";
} 

$sql = "UPDATE transaction SET version = DEFAULT, date = ".dbPostSafe($_POST['xdate']);
$sql .= ", amount = ".$amount.", currency = ".dbPostSafe($_POST['currency']) ;
$sql .= ", rno = ".dbPostSafe($_POST['rno']).", description = ".dbPostSafe($_POST['desc']);

if($accounttype == "src") {
    if($_POST['accountname'] == $row['src']) {
    //account name is the same as before so we can rely on $row data for src information
        $acurrency = $row['srccurrency'];
    } else {
        //We have mostlikely switched accounts (it HAS to be one or the other)
        $acurrency = $row['dstcurrency'];
    }
    if($_POST['currency'] == $acurrency) {
        $sql .= ",srcamount = NULL";
        $aamount = -$amount;
    } else {
        $aamount = round(100*$_POST['aamount']);
        $sql .= ",srcamount = ".dbPostSafe($aamount);
    }
    $sql .= ", src = ".dbPostSafe($_POST['accountname']);
    if($_POST['repeat'] == "0") {
        $sql .= ", srcclear = ".$cleared.", repeat = 0";
    } else {
        $sql .= ",srcclear = false, repeat = ".dbPostSafe($_POST['repeat']);
    }
    if($_POST['account'] != '') {
        $sql .= ", dst = ".dbPostSafe($_POST['account']);
        if(isset($row['dst']) && $_POST['account'] == $row['dst']) {
            $arate = $row['drate'];
            if($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ", dstamount = NULL";
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['srccurrency']) {
                $sql .= ". dstamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                $row2 = dbFetch($result2);
                $sql .= ". dstamount = ".dbPostSafe(round($amount*$arate/$row2['rate']));
                dbFree($result2);
            }
        } elseif (isset($row['src']) && $_POST['account'] == $row['src']) {
            $arate = $row['srate'];
            if($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", dstamount = NULL";
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ". dstamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                $row2 = dbFetch($result2);
                $sql .= ". dstamount = ".dbPostSafe(round($amount*$arate/$row2['rate']));
                dbFree($result2);
            }
        } else {
            $result2 = dbQuery("SELECT account.name,account.currency,currency.rate FROM account, currency".
                " WHERE currency.name = account.currency AND account.name = ".dbMakeSafe($_POST['account'])." ;");
            $row2 = dbFetch($result2);
            $arate = $row2['rate'];
            $bcurrency = $row2['currency'];
            dbFree($result2);
            if ($_POST['currency'] == $bcurrency) {
                $sql .= ", dstamount = NULL";
            } elseif($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ". dstamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                $row2 = dbFetch($result2);
                $sql .= ". dstamount = ".dbPostSafe(round($amount*$arate/$row2['rate']));
                dbFree($result2);
            }
       }      
    } else {
        $sql .= ", dst = NULL, dstclear = false, dstamount = NULL";
    }
    
} else {
    if($_POST['accountname'] == $row['dst']) {
    //account name is the same as before so we can rely on $row data for src information
        $acurrency = $row['dstcurrency'];
    } else {
        //We have mostlikely switched accounts
        $acurrency = $row['srccurrency'];
    }
    if($_POST['currency'] == $acurrency) {
        $sql .= ",dstamount = NULL";
        $aamount = $amount;
    } else {
        $aamount = round(100*$_POST['aamount']);
        $sql .= ",dstamount = ".dbPostSafe($aamount);
    }
    $sql .= ", dst = ".dbPostSafe($_POST['accountname']);
    if($_POST['repeat'] == "0") {
        $sql .= ", dstclear = ".$cleared.", repeat = 0";
    } else {
        $sql .= ",dstclear = false, repeat = ".dbPostSafe($_POST['repeat']);
    }
    if($_POST['account'] != '') {
        $sql .= ", src = ".dbPostSafe($_POST['account']);
        if(isset($row['src']) && $_POST['account'] == $row['src']) {
            $arate = $row['srate'];
            if($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", srcamount = NULL";
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ". srcamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                $row2 = dbFetch($result2);
                $sql .= ". srcamount = ".dbPostSafe(round($amount*$arate/$row2['rate']));
                dbFree($result2);
            }
        } elseif (isset($row['src']) && $_POST['account'] == $row['dst']) {
            $arate = $row['drate'];
            if($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ", srcamount = NULL";
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['srccurrency']) {
                $sql .= ". srcamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                $row2 = dbFetch($result2);
                $sql .= ". srcamount = ".dbPostSafe(round($amount*$arate/$row2['rate']));
                dbFree($result2);
            }
        } else {
            $result2 = dbQuery("SELECT account.name,account.currency,currency.rate FROM account, currency".
                " WHERE currency.name = account.currency AND account.name = ".dbMakeSafe($_POST['account'])." ;");
            $row2 = dbFetch($result2);
            $arate = $row2['rate'];
            $bcurrency = $row2['currency'];
            dbFree($result2);
            if ($_POST['currency'] == $bcurrency) {
                $sql .= ", srcamount = NULL";
            } elseif($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ". srcamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                $row2 = dbFetch($result2);
                $sql .= ". srcamount = ".dbPostSafe(round($amount*$arate/$row2['rate']));
                dbFree($result2);
            }
       }      
    } else {
        $sql .= ", src = NULL, srcclear = false, srcamount = NULL";
    }
}
$sql .= " WHERE id = ".dbMakeSafe($_POST['tid'])." RETURNING version, date, repeat,";
if($accounttype == "src") {
    $sql .= " srcclear AS clear;";
} else {
    $sql .= " dstclear AS clear;";
}
dbFree($result);    
$result = dbQuery($sql);
$row = dbFetch($result);
$version = $row['version'];
$date = $row['date'];
$repeat = $row['repeat'];
$clear = $row['clear'];
dbFree($result);

if($_POST['acchange'] == "2" && $_POST['currency'] != $acurrency) { //only if we requested to set the currencies and they are not the same
    if($amount != 0 && $aamount != 0) { //can only do this if neither value is 0
        //we asked to set the rate from the current transaction.
        $ratio = $aamount/$amount;
        
        $result = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
        $row = dbFetch($result);
        $brate = $row['rate'];
        dbFree($result);
       
        if($_POST['currency'] == $_SESSION['default_currency']) {
            //we need to change the rate of the account currency
            dbQuery("UPDATE currency SET version = DEFAULT, rate = ".dbPostSafe($ratio).
                " WHERE name = ".dbMakeSafe($acurrency)." ;"); 
        } else {
            //we are changing the rate of the transaction currency
            dbQuery("UPDATE currency SET version = DEFAULT, rate = ".dbPostSafe($brate/$ratio).
                " WHERE name = ".dbMakeSafe($_POST['currency'])." ;"); 
        }
    }
}


dbQuery("COMMIT;");
?><xaction tid="<?php echo $_POST['tid']; ?>" 
    version="<?php echo $version ?>" 
    date="<?php echo $date; ?>" repeat="<?php echo $repeat; ?>" 
    clear="<?php echo $clear ; ?>">
    <amount dual="<?php echo ($_POST['account'] != '')?'true':'false'; ?>" ><?php echo fmtAmount($aamount); ?></amount>
</xaction>

