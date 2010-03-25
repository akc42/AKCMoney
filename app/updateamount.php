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

if(!(isset($_POST['key']) && isset($_POST['tid']) && isset($_POST['amount']) && isset($_POST['issrc']) && isset($_POST['version']))) 
    die('Hacking attempt - wrong parameters');
if($_POST['key'] != $_SESSION['key']) die('Hacking attempt - wrong key');
define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");

$result=dbQuery("SELECT id, version, amount, dstamount, srcamount FROM transaction WHERE id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
if ($row['version'] != $_POST['version'] ) {
    echo '{"newversion" : true , "postversion":'.$_POST['version'].',"dbversion":'.$row['version'].'}';
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}
$amount = (int)($_POST['amount']*100);
$sql = "UPDATE transaction SET version = DEFAULT,";
if($_POST['issrc'] == 'true') {
    $amount = -$amount;
}
$scaling = $amount/$row['amount'];
if (!is_null($row['srcamount'])) {
    $sql .= ' srcamount = '.dbPostSafe($scaling*$row['srcamount']);
}
if (!is_null($row['dstamount'])) {
    $sql .= ' dstamount = '.dbPostSafe($scaling*$row['dstamount']);
}
dbFree($result);

$sql .= ' amount = '.dbPostSafe($amount).' WHERE id = '.dbPostSafe($_POST['tid']).';';
dbQuery($sql);
$result=dbQuery("SELECT id, version FROM transaction WHERE id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
echo '{"tid":'.$row['id'].',"version":'.$row['version'].'}';
dbFree($result);
dbQuery("COMMIT;");
?>
