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

$row=$db->querySingle("SELECT id, version, amount, src , srcamount, dst, dstamount FROM xaction WHERE id=".dbMakeSafe($_POST['tid']).";",true);

if (!isset($row['version']) || $row['version'] != $_POST['version'] ) {
?><error>It appears that someone else has been editing this transaction in parallel to you.  In order to ensure you have consistent
information we are going to reload the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] + 1;

$amount = (int)($_POST['amount']*100); //convert amount back to be a big int.
$sql = "UPDATE xaction SET version = $version ,";
if($_POST['account'] == $row['src']) {
    $amount = -$amount;
}
/* if either srcamount or dstamount are not null, we need to scale them to represent the change in value of amount.  It
    should be noted that this routine is only called where one of src or dst is the same currency as the transaction, but that
    does not imply that the other account (dst or src) is also of the same currency - so it might need updating and here we check */
if ($row['amount'] != 0) { 
    $scaling = $amount/$row['amount'];
    if (!is_null($row['srcamount'])) {
        $sql .= ' srcamount = '.(round($scaling*$row['srcamount']));
    }
    if (!is_null($row['dstamount'])) {
        $sql .= ' dstamount = '.(round($scaling*$row['dstamount']));
    }
}


$sql .= ' amount = '.$amount.' WHERE id = '.dbPostSafe($_POST['tid']).';';
$db->exec($sql);
$db->exec("COMMIT");

?><xaction tid="<?php echo $_POST['tid']; ?>" version="<?php echo $version ?>" ></xaction>
