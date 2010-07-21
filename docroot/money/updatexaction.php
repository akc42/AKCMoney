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

session_start();
require_once($_SESSION['inc_dir'].'db.inc');


$db->exec("BEGIN IMMEDIATE");

$row=$db->querySingle("SELECT xaction.*,  ct.rate AS trate, srcacc.currency AS srccurrency, cs.rate AS srate, dstacc.currency AS dstcurrency, ".
     "cd.rate AS drate, srcacode.description AS sacdesc, dstacode.description AS dacdesc FROM xaction ".
     "LEFT JOIN currency AS ct ON xaction.currency = ct.name ".
    "LEFT JOIN account AS srcacc ON xaction.src = srcacc.name LEFT JOIN currency AS cs ON srcacc.currency = cs.name ".
    "LEFT JOIN account AS dstacc ON xaction.dst = dstacc.name LEFT JOIN currency AS cd ON dstacc.currency = cd.name ".
    "LEFT JOIN account_code AS srcacode ON xaction.srccode = srcacode.id ".
    "LEFT JOIN account_code AS dstacode ON xaction.dstcode = dstacode.id ".
    "WHERE xaction.id=".dbMakeSafe($_POST['tid']).";",true);
if (!isset($row['version']) || $row['version'] != $_POST['version'] ) {
?><error>Someone else is editing this transaction in parallel to you.  In order to ensure you are working with consistent
data we will reload the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] + 1;

$cleared = (isset($_POST['cleared']))?1:0;

$accounttype = $_POST['accounttype'];
$amount = round($_POST['amount']*100);

$sql = "UPDATE xaction SET version = $version, date = ".dbPostSafe($_POST['xdate']);
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
        $sql .= ",srcclear = 0, repeat = ".dbPostSafe($_POST['repeat']);
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
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $rate = $db->querySingle("SELECT rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency']));
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$rate));
            }
        } elseif (isset($row['src']) && $_POST['account'] == $row['src']) {
            $arate = $row['srate'];
            if($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", dstamount = NULL";
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $rate = $db->querySingle("SELECT rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency']));
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$rate));
            }
        } else {
            $row2 = $db->querySingle("SELECT account.name,account.currency,currency.rate FROM account, currency".
                " WHERE currency.name = account.currency AND account.name = ".dbMakeSafe($_POST['account'])." ;",true);
            $arate = $row2['rate'];
            $bcurrency = $row2['currency'];
            if ($_POST['currency'] == $bcurrency) {
                $sql .= ", dstamount = NULL";
            } elseif($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $rate = $db->querySingle("SELECT rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency']));
                $sql .= ", dstamount = ".dbPostSafe(round($amount*$arate/$rate));
            }
       }      
    } else {
        $sql .= ", dst = NULL, dstclear = 0, dstamount = NULL";
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
        $sql .= ",dstclear = 0, repeat = ".dbPostSafe($_POST['repeat']);
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
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $rate = $db->querySingle("SELECT rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency']));
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$rate));
            }
        } elseif (isset($row['src']) && $_POST['account'] == $row['dst']) {
            $arate = $row['drate'];
            if($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ", srcamount = NULL";
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $rate = $db->querySingle("SELECT rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency']));
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$rate));
            }
        } else {
            $row2 = $db->querySingle("SELECT account.name,account.currency,currency.rate FROM account, currency".
                " WHERE currency.name = account.currency AND account.name = ".dbMakeSafe($_POST['account'])." ;",true);
            $arate = $row2['rate'];
            $bcurrency = $row2['currency'];
            if ($_POST['currency'] == $bcurrency) {
                $sql .= ", srcamount = NULL";
            } elseif($_POST['currency'] == $row['srccurrency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['srate']));
            } elseif ($_POST['currency'] == $row['currency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['trate']));
            } elseif ($_POST['currency'] == $row['dstcurrency']) {
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$row['drate']));
            } else {
                // not any of the currencies we know about - we will have to go read it to find the rate
                $rate = $db->querySingle("SELECT rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency']));
                $sql .= ", srcamount = ".dbPostSafe(round($amount*$arate/$rate));
            }
       }      
    } else {
        $sql .= ", src = NULL, srcclear = 0, srcamount = NULL";
    }
}
$sql .= " WHERE id = ".dbMakeSafe($_POST['tid']).";";

$db->exec($sql);


$date = $_POST['xdate'];
$repeat = $_POST['repeat'];
$clear = ($repeat == '0')? (($cleared == 0)?'f':'t'):'f';


if($_POST['acchange'] == "2" && $_POST['currency'] != $acurrency) { //only if we requested to set the currencies and they are not the same
    if($amount != 0 && $aamount != 0) { //can only do this if neither value is 0
        //we asked to set the rate from the current transaction.
        $ratio = abs($aamount/$amount);
        
        $brate = $db->query("SELECT  rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency']));
       
        if($_POST['currency'] == $_SESSION['default_currency']) {
            //we need to change the rate of the account currency
            $db->exec("UPDATE currency SET version = version + 1, rate = ".dbPostSafe($ratio).
                " WHERE name = ".dbMakeSafe($acurrency)." ;"); 
        } else {
            //we are changing the rate of the transaction currency
            $db->exec("UPDATE currency SET version = version + 1, rate = ".dbPostSafe($brate/$ratio).
                " WHERE name = ".dbMakeSafe($_POST['currency'])." ;"); 
        }
    }
}


$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" 
    version="<?php echo $version ?>" 
    date="<?php echo $date; ?>" repeat="<?php echo $repeat; ?>" 
    clear="<?php echo $clear ; ?>">
    <amount dual="<?php echo ($_POST['account'] != '')?'true':'false'; ?>" ><?php echo fmtAmount($aamount); ?></amount>
</xaction>

