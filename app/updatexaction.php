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


$amount = (int)($_POST['amount']*100);
$sql = "UPDATE transaction SET version = DEFAULT, date = ".dbPostSafe($_POST['xdate']);
$sql .= ", amount = ".dbPostSafe($amount).", currency = ".dbPostSafe($_POST['currency']) ;


if($_POST['accounttype'] == "src") {
    if($_POST['accountname'] == $row['src']) {
    //account name is the same as before so we can rely on $row data for src information
        $acurrency = $row['srccurrency'];
        $arate = $row['srate'];
        if(isset($row['dst'])) {
            $bcurrency = $row['dstcurrency'];
            $brate = $row['drate'];
        }
    } else {
        //We have mostlikely switched accounts
        $acurrency = $row['dstcurrency'];
        $arate = $row['drate'];
        if(isset($row['src'])) {
            $bcurrency = $row['srccurrency'];
            $brate = $row['srate'];
        }
    }
    if($_POST['currency'] == $acurrency) {
        $sq1 .= ",srcamount = NULL";
        $aamount = -$amount;
    } else {
        if($_POST['acchange'] != "0") {
            $aamount = (int)(100*$_POST['aamount']);
            $sql .= ",srcamount = ".dbPostSafe($aamount);
        } else {
            if ($_POST['currency'] == $row['currency']) {
                if(is_null($row['srcamount'])) {
                    $aamount = -$amount*$row['trate']/$arate
                    $sql .= ",srcamount = ".dbPostSafe($aamount);
                }
            } else {
                if($_POST['currency'] != $bcurrency) {            
                    $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                    $row2 = dbFetch($result2);
                    $brate = $row2['rate'];
                    dbFree($result2);
                }
                if(is_null($row['srcamount'])) {
                    $aamount = -$amount*$brate/$arate
                    $sql .= ",srcamount = ".dbPostSafe($aamount);
                } else {
                    $aamount = $row['srcamount']*$brate/$row['trate']
                    $sql .= ",srcamount = ".dbPostSafe($aamount);
                }
                if(isset($_POST['account']) {
                    if(is_null($row['dst']) {
                        $sql .= ",dstamount = ".dbPostSafe(($amount*$brate/$arate));
                    } else {
                        $sql .= ",dstamount = ".($row['dstamount']*$brate/$row['trate']);
                    }   
                } 
            }
        }
    }
    $sql .= ", src = ".dbPostSafe($_POST['accountname']);
    if($_POST['repeat'] == "0") {
        $sql .= ", srcclear = ".dbPostSafe($_POST['cleared']).", repeat = 0";
    } else {
        $sql .= ",srcclear = false, repeat = ".dbPostSafe($_POST['repeat']);
    }
    if(isset($_POST['account'])) {
        $sql .= ", dst = ".dbPostSafe($_POST['account']);
    } else {
        $sql .= ", dst = NULL, dstclear = false, dstamount = NULL";
    }
    
} else {
    if($_POST['accountname'] == $row['dst']) {
    //account name is the same as before so we can rely on $row data for src information
        $acurrency = $row['dstcurrency'];
        $arate = $row['drate'];
        if(isset($row['src'])) {
            $bcurrency = $row['srccurrency'];
            $brate = $row['srate'];
        }
    } else {
        //We have mostlikely switched accounts
        $acurrency = $row['srccurrency'];
        $arate = $row['srate'];
        if(isset($row['dst'])) {
            $bcurrency = $row['dstcurrency'];
            $brate = $row['drate'];
        }
    }
    if($_POST['currency'] == $acurrency) {
        $aamount = $amount;
        $sq1 .= ",dstamount = NULL";
    } else {
        if($_POST['acchange'] != "0") {
            $aamount = $(int)(100*$_POST['aamount']);
            $sql .= ",dstamount = ".dbPostSafe($aamount);
        } else {
            if ($_POST['currency'] == $row['currency']) {
                if(is_null($row['dstamount'])) {
                    $aamount = $amount*$row['trate']/$arate;
                    $sql .= ",dstcamount = ".dbPostSafe($aamount);
                }
            } else {
                if($_POST['currency'] != $bcurrency) {            
                    $result2 = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
                    $row2 = dbFetch($result2);
                    $brate = $row2['rate'];
                    dbFree($result2);
                }
                if(is_null($row['dstamount'])) {
                    $aamount = $amount*$brate/$arate;
                    $sql .= ",dstamount = ".dbPostSafe($aamount);
                } else {
                    $aamount = $row['srcamount']*$brate/$row['trate']
                    $sql .= ",dstamount = ".$aamount;
                }
                if(isset($_POST['account']) {
                    if(is_null($row['src']) {
                        $aamount = $amount*$brate/$arate;
                        $sql .= ",srcamount = ".dbPostSafe($aamount);
                    } else {
                        $aamount = row['srcamount']*$brate/$row['trate']
                        $sql .= ",srcamount = ".$aamount;
                    }   
                } 
            }
        }
    }
    $sql .= ", dst = ".dbPostSafe($_POST['accountname']);
    if($_POST['repeat'] == "0") {
        $sql .= ", dstclear = ".dbPostSafe($_POST['cleared']).", repeat = 0";
    } else {
        $sql .= ",dstclear = false, repeat = ".dbPostSafe($_POST['repeat']);
    }
    if(isset($_POST['account'])) {
        $sql .= ", src = ".dbPostSafe($_POST['account']);
    } else {
        $sql .= ", src = NULL, srcclear = false, srcamount = NULL";
    }
}
dbFree($result);    
$result = dbQuery($sql." WHERE id = ".dbMakeSafe($_POST['tid'])." RETURNING version, date, repeat;");
$row = dbFetch($result);
$version = $row['version'];
$date = $row['date'];
$repeat = $row['repeat'];
dbFree($result);

if($_POST['acchange'] == "2" && $_POST['currency'] != $acurrency) { //only if we requested to set the currencies and they are not the same
    if($amount != 0 && $aamount != 0) { //can only do this if neither value is 0
        //we asked to set the rate from the current transaction.
        $ratio = $amount/$aamount;
        //bcurrency will possibly have transaction currency in it
        if($_POST['currency'] != $bcurrency) {            
            $result = dbQuery("SELECT name, rate FROM currency WHERE name = ".dbMakeSafe($_POST['currency'])." ;");
            $row = dbFetch($result);
            $brate = $row['rate'];
            dbFree($result);
        }
        if($_POST['currency'] == $_SESSION['default_currency']) {
            //we need to change the rate of the account currency
            dbQuery("UPDATE currency SET version = DEFAULT, rate = ".dbPostSafe($ratio)." WHERE currency = ".dbMakeSafe($acurrency)." ;"); 
        } else {
            //we are changing the rate of the transaction currency
            dbQuery("UPDATE currency SET version = DEFAULT, rate = ".dbPostSafe($ratio/$brate).
                " WHERE currency = ".dbMakeSafe($_POST['currency']." ;"); 
        }
    }
}


dbQuery("COMMIT;");
?><xaction tid="<?php echo $_POST['tid']; ?>" version="<?php echo $version ?>" date="<?php echo $date; ?>" repeat="<?php echo $repeat; ?>">
    <amount><?php echo fmtAmount($aamount); ?></amount>
</xaction>

