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


$db->exec("BEGIN IMMEDIATE");

$row = $db->querySingle("SELECT name, bversion, balance, currency FROM account WHERE name = ".dbMakeSafe($_POST['account'])." ;",true);
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

?><xactions>
<?php
$result = $db->query("SELECT * FROM xaction WHERE ( src = ".dbMakeSafe($_POST['account']).
                " AND srcclear = 1 ) OR (dst = ".dbMakeSafe($_POST['account'])." AND dstclear = 1) ;");
while($row = $result->fetchArray(SQLITE3_ASSOC)) {
    if($row['src'] == $_POST['account']) {
        if($row['currency'] == $_POST['currency']) {
            $balance -= $row['amount'];
        } else {
            $balance -= $row['srcamount'];
        }
        if (is_null($row['dst'])) {
            $db->exec("DELETE FROM xaction WHERE id = ".$row['id']." ;");
        } else {
            $db->exec("UPDATE xaction SET version = version + 1, src = NULL, srcamount = NULL, srcclear = 0 WHERE id = ".$row['id']." ;");
        }
    } else {
        if($row['currency'] == $_POST['currency']) {
            $balance += $row['amount'];
        } else {        
            $balance += $row['dstamount'];
        }
        if (is_null($row['src'])) {
            $db->exec("DELETE FROM xaction WHERE id = ".$row['id']." ;");
        } else {
            $db->exec("UPDATE xaction SET version = version + 1, dst = NULL, dstamount = NULL, dstclear = 0 WHERE id = ".$row['id']." ;");
        }
    }
?><xaction tid="<?php echo $row['id']; ?>"></xaction>
<?php
}
$result->finalize();

$db->exec("UPDATE account SET bversion = $version, balance = ".$balance.
    " WHERE name = ".dbMakeSafe($_POST['account']).";");
?></xactions><balance version="<?php echo $version; ?>"><?php echo fmtAmount($balance) ; ?></balance>
<?php
$db->exec("COMMIT");
?>
