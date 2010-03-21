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

if(!(isset($_POST['key']) && isset($_POST['tid']) && isset($_POST['clear']) && isset($_POST['issrc']) && isset($_POST['version']))) 
    die('Hacking attempt - wrong parameters');
if($_POST['key'] != $_SESSION['key']) die('Hacking attempt - wrong key');
define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");
$result=dbQuery("SELECT id, version FROM transaction WHERE id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
dbFree($result);
if ($row['version'] != $_POST['version'] ) {
    echo '{"newversion" : true}';
    dbQuery("ROLLBACK;");
    exit;
}
$sql = "UPDATE transaction SET version = DEFAULT, ";
if($_POST['issrc'] == 'true') {
    $sql .= "srcclear = ";
} else {
    $sql .= "dstclear = ";
}
$sql .= ($_POST['clear'] == 'true')? 'TRUE' : 'FALSE' ;
$sql .= ' WHERE id = '.dbPostSafe($_POST['tid']).';';
dbQuery($sql);
$result=dbQuery("SELECT id, version FROM transaction WHERE id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
dbFree($result);

dbQuery("COMMIT;");
echo '{"tid":'.$_POST['tid'].',"clear":'.$_POST['clear'].',"version":'.$row['version'].'}';
?>

