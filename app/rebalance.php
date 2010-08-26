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
require_once('./inc/db.inc');
if($_SESSION['key'] != $_POST['key']) die('Protection Key Not Correct');

$astmt = $db->prepare("SELECT bversion, balance, currency FROM account WHERE name = ? ;");
$astmt->bindValue(1,$_POST['account']);

$dstmt = $db->prepare("DELETE FROM xaction WHERE id = ? ;");
$dstmt->bindParam(1,$tid,PDO::PARAM_INT);

$tstmt = $db->prepare("SELECT * FROM xaction WHERE ( src = ? AND srcclear = 1 ) OR (dst = ? AND dstclear = 1) ;");
$tstmt->bindValue(1,$_POST['account']);
$tstmt->bindValue(2,$_POST['account']);

$ustmt = $db->prepare("UPDATE account SET bversion = ?, balance = ? WHERE name = ? ;");
$ustmt->bindParam(1,$version,PDO::PARAM_INT);
$ustmt->bindParam(2,$balance,PDO::PARAM_INT);
$ustmt->bindValue(3,$_POST['account']);

$uxs = $db->prepare("UPDATE xaction SET version = version + 1, src = NULL, srcamount = NULL, srcclear = 0 WHERE id = ? ;");
$uxs->bindParam(1,$tid,PDO::PARAM_INT);
$uxd = $db->prepare("UPDATE xaction SET version = version + 1, dst = NULL, dstamount = NULL, dstclear = 0 WHERE id = ? ;");
$uxd->bindParam(1,$tid,PDO::PARAM_INT);

$db->exec("BEGIN IMMEDIATE");
$astmt->execute();
$row = $astmt->fetch(PDO::FETCH_ASSOC);

if (!isset($row['bversion']) || $row['bversion'] != $_POST['bversion'] || $row['currency'] != $_POST['currency'] ) {
?><error>It appears someone has updated the details of this account in parallel to you working on it.  We will reload the page to 
ensure you have the correct version</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['bversion'] + 1;
$balance = $row['balance'];
$currency = $row['currency'];
$oldbalance = $balance;
$astmt->closeCursor();
?><xactions>
<?php
$tstmt->execute();
while($row = $tstmt->fetch(PDO::FETCH_ASSOC)) {
    $tid = $row['id'];
    if($row['src'] == $_POST['account']) {
        if($row['currency'] == $_POST['currency']) {
            $balance -= $row['amount'];
        } else {
            $balance -= $row['srcamount'];
        }
        if (is_null($row['dst'])) {
            $dstmt->execute();
            $dstmt->closeCursor();
        } else {
            $uxs->execute();
            $uxs->closeCursor();
        }
    } else {
        if($row['currency'] == $_POST['currency']) {
            $balance += $row['amount'];
        } else {        
            $balance += $row['dstamount'];
        }
        if (is_null($row['src'])) {
            $dstmt->execute();
            $dstmt->closeCursor();
        } else {
            $uxd->execute();
            $uxd->closeCursor();
         }
    }
?><xaction tid="<?php echo $row['id']; ?>"></xaction>
<?php
}
$tstmt->closeCursor();

$ustmt->execute();
$ustmt->closeCursor();

?></xactions><balance version="<?php echo $version; ?>"><?php echo fmtAmount($balance) ; ?></balance>
<?php
$db->exec("COMMIT");
?>
