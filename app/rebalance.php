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

$account = $_POST['account'];

$astmt = $db->prepare("SELECT bversion, balance, currency FROM account WHERE name = ? ;");
$astmt->bindValue(1,$account);


$tstmt = $db->prepare("SELECT * FROM xaction WHERE id = ?");

$ustmt = $db->prepare("UPDATE account SET bversion = ?, balance = ? , date = (strftime('%s','now')) WHERE name = ? ;");
$ustmt->bindParam(1,$version,PDO::PARAM_INT);
$ustmt->bindParam(2,$balance,PDO::PARAM_INT);
$ustmt->bindValue(3,$account);

$uxs = $db->prepare("UPDATE xaction SET version = version + 1, srcclear = 1 WHERE id = ? ;");
$uxs->bindParam(1,$tid,PDO::PARAM_INT);
$uxd = $db->prepare("UPDATE xaction SET version = version + 1, dstclear = 1 WHERE id = ? ;");
$uxd->bindParam(1,$tid,PDO::PARAM_INT);

$db->exec("BEGIN IMMEDIATE");
$astmt->execute();
$row = $astmt->fetch(PDO::FETCH_ASSOC);

if (!isset($row['bversion']) || $row['bversion'] != $_POST['bversion'] || $row['currency'] != $_POST['currency'] ) {
?><error>It appears someone has updated the details of this account in parallel to you working on it.  We will reload the page to 
ensure you have the correct version</error>
<?php
    $astmt->closeCursor();
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['bversion'] + 1;
$balance = $row['balance'];
$currency = $row['currency'];
$oldbalance = $balance;
$astmt->closeCursor();

$transactions = $_POST['transactions'];

foreach($transactions as $transaction) {
    list($tid,$tversion) = explode(":",$transaction,2);
    $tstmt->bindValue(1,$tid,PDO::PARAM_INT);
    $tstmt->execute();
    $row = $tstmt->fetch(PDO::FETCH_ASSOC);
    if($row['version'] <> $tversion || ( $row['src'] == $account && $row['srcclear'] == 1) || ($row['dst'] == $account && $row['dstclear'] == 1) || ( $row['src'] <> $account && $row['dst'] <> $account)) {
?><error>One of the transactions in the account has been updated in parallel to you working on it.  We will reload the page to
ensure you have the correct versions</error>
<?php
        $tstmt->closeCursor();
        $db->exec("ROLLBACK");
        exit;
    }
    $tstmt->closeCursor();
}
?><xactions>
<?php
foreach($transactions as $transaction) {
    list($tid,$tversion) = split(":",$transaction,2);
    $tstmt->bindValue(1,$tid,PDO::PARAM_INT);
    $tstmt->execute();
    $row = $tstmt->fetch(PDO::FETCH_ASSOC);

    if($row['src'] == $account) {
        if($row['currency'] == $_POST['currency']) {
            $balance -= $row['amount'];
        } else {
            $balance -= $row['srcamount'];
        }
        $uxs->execute();
        $uxs->closeCursor();
    } else {
        if($row['currency'] == $_POST['currency']) {
            $balance += $row['amount'];
        } else {        
            $balance += $row['dstamount'];
        }
        $uxd->execute();
        $uxd->closeCursor();
    }
    $tversion = $tversion + 1; //We increment the version so it can be corrected for the transaction on the page
?><xaction tid="<?php echo $tid; ?>" version="<?php echo $tversion; ?>"></xaction>
<?php

    $tstmt->closeCursor();
}

$ustmt->execute();
$ustmt->closeCursor();

?></xactions><balance version="<?php echo $version; ?>"><?php echo fmtAmount($balance) ; ?></balance>
<?php
$db->exec("COMMIT");
?>
