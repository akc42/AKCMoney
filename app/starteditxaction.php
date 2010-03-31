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

if(!isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] ) die('Hacking attempt - wrong key');;

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");

$result=dbQuery("SELECT transaction.id, transaction.version, transaction.currency, ct.rate AS trate, transaction.repeat, transaction.amount,".
    "transaction.src, transaction.srcclear, transaction.srcamount, srcacc.currency AS srccurrency, cs.rate AS srate, ".
    "transaction.dst, transaction.dstclear, transaction.dstamount, dstacc.currency AS dstcurrency, cd.rate AS drate FROM transaction ".
    "LEFT JOIN currency AS ct ON transaction.currency = ct.name ".
    "LEFT JOIN account AS srcacc ON transaction.src = srcacc.name LEFT JOIN currency AS cs ON srcacc.currency = cs.name ".
    "LEFT JOIN account AS dstacc ON transaction.dst = dstacc.name LEFT JOIN currency AS cd ON dstacc.currency = cd.name ".
    "WHERE transaction.id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
if ($row['version'] != $_POST['version'] ) {
?><error>Someone else is editing this transaction in parallel to you.  In order to ensure you are working with consistent
data we will reload the page</error>
<?php
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}

?><xaction tid="<?php echo $row['id'] ; ?>"
    version="<?php echo $row['version'] ?>"
    repeat="<?php echo $row['repeat']; ?>"
    accounttype="<?php echo (($_POST['account'] == $row['src'])? "src" : "dst"); ?>">
    <amount currency="<?php echo $row['currency']; ?>" 
        rate="<?php echo $row['trate']; ?>"
        zero="<?php echo ((((int)$row['amount']) == 0 )?"true" : "false"); ?>"><?php echo fmtAmount($row['amount']); ?></amount>
<?php 
if($_POST['account'] == $row['src']) {
    if($row['currency'] == $row['srccurrency']) {
        $aamount = -$row['amount'];
    } else {
        $aamount = $row['srcamount'];
    }
?>  <account name="<?php echo $row['src']; ?>" cleared="<?php echo $row['srcclear']; ?>">
        <amount currency="<?php echo $row['srccurrency']; ?>" rate="<?php echo $row['srate']; ?>"><?php echo fmtAmount($aamount); ?></amount>
    </account>
<?php
    if(isset($row['dst'])) {
?>  <account name="<?php echo $row['dst']; ?>" cleared="<?php echo $row['dstclear']; ?>"></account>
<?php
    }
} else {
    if($row['currency'] == $row['dstcurrency']) {
        $aamount = $row['amount'];
    } else {
        $aamount = $row['dstamount'];
    }
?>  <account name="<?php echo $row['dst']; ?>" cleared="<?php echo $row['dstclear']; ?>">
        <amount currency="<?php echo $row['dstcurrency']; ?>" rate="<?php echo $row['drate']; ?>"><?php echo fmtAmount($aamount); ?></amount>
    </account>
<?php
    if(isset($row['src'])) {
?>  <account name="<?php echo $row['src']; ?>" cleared="<?php echo $row['srcclear']; ?>"></account>
<?php
    }
}
?></xaction>
<?php
dbFree($result);
dbQuery("COMMIT;");
?>

