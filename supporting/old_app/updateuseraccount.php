<?php
/*
 	Copyright (c) 2010 Alan Chandler
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

$sstmt = $db->prepare("SELECT version,password FROM user WHERE uid = ? ;");
$sstmt->bindValue(1,$_POST['uid']);

$ustmt = $db->prepare("
    UPDATE user SET
        version = version + 1,
        password = ?,
        domain = ?, 
        account = ?
    WHERE uid = ? ;
");
if($_POST['domain'] != '') {
	$ustmt->bindValue(2,$_POST['domain']);
} else {
	$ustmt->bindValue(2,null,PDO::PARAM_NULL);
}
if($_POST['account'] != '') {
	$ustmt->bindValue(3,$_POST['account']);
} else {
	$ustmt->bindValue(3,null,PDO::PARAM_NULL);
}

$ustmt->bindValue(4,$_POST['uid']);

$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();
$sstmt->bindColumn(1,$version,PDO::PARAM_INT);
$sstmt->bindColumn(2,$passwd);
$sstmt->fetch(PDO::FETCH_BOUND);
$sstmt->closeCursor();
if ( $version != $_POST['version']) {
    //version is wrong
	echo '{"status":false}';
    $db->exec("ROLLBACK");
    exit;
}

$version++;
if($_POST['pass'] == '') {
	$ustmt->bindValue(1,$passwd);
} else {
	$ustmt->bindValue(1,$_POST['pass']);
}

$ustmt->execute();
$ustmt->closeCursor();

echo '{"status":true}';

$db->exec("COMMIT");

