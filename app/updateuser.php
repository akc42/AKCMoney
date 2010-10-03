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

$sstmt = $db->prepare("SELECT name,version,password FROM user WHERE uid = ? ;");
$sstmt->bindValue(1,$_POST['uid']);

$ustmt = $db->prepare("
    UPDATE user SET
        name = ? ,
        version = version + 1,
        password = ?,
        isAdmin = ?,
        domain = ?, 
        account = ?
    WHERE uid = ? ;
");
$ustmt->bindValue(1,$_POST['user']);

$ustmt->bindValue(3,($_POST['admin'] == 'yes')?1:0,PDO::PARAM_INT);
if($_POST['domain'] != '') {
	$ustmt->bindValue(4,$_POST['domain']);
} else {
	$ustmt->bindValue(4,null,PDO::PARAM_NULL);
}
if($_POST['account'] != '') {
	$ustmt->bindValue(5,$_POST['account']);
} else {
	$ustmt->bindValue(5,null,PDO::PARAM_NULL);
}

$ustmt->bindValue(6,$_POST['uid']);

$dstmt = $db->prepare("DELETE FROM capability WHERE uid = ? ;");
$dstmt->bindValue(1,$_POST['uid'],PDO::PARAM_INT);

if($_POST['admin'] != 'yes') {
	$cstmt = $db->prepare("INSERT INTO capability (uid,domain) VALUES (?,?);");
	$cstmt->bindValue(1,$_POST['uid'],PDO::PARAM_INT);
} 


$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();
$sstmt->bindColumn(1,$name);
$sstmt->bindColumn(2,$version,PDO::PARAM_INT);
$sstmt->bindColumn(3,$passwd);
$sstmt->fetch(PDO::FETCH_BOUND);
$sstmt->closeCursor();
if ( $version != $_POST['version']) {
    //version is wrong
?><error>It appears someone else is editing users in parallel.  We need to reload the page to ensure you are working with consistent data</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}

if($name != $_POST['user']) {
    //planning on changing the name - just check the new name has not been created in the meantime
    $sstmt = $db->prepare("SELECT COUNT(*) FROM user WHERE name = ? ;");
    $sstmt->bindValue(1,$_POST['user']);
    $sstmt->execute();
    $count = $sstmt->fetchColumn();
    $sstmt->closeCursor();
    if($count > 0) {
    //its there - this must mean someone just put it there
?><error>You have attempted to rename the user to one that already exists.  We will reload the page in case someone else created it in parallel with you</error>
<?php
        $db->exec("ROLLBACK");
        exit;
    }

}
$version++;
if($_POST['passwd'] == '') {
	$ustmt->bindValue(2,$passwd);
} else {
	$ustmt->bindValue(2,$_POST['passwd']);
}

$ustmt->execute();
$ustmt->closeCursor();

// Deal with capabilities - first delete them all
$dstmt->execute();
$dstmt->closeCursor();
if($_POST['admin'] != 'yes') {
	//Only create more capabilities if we are not admin
	foreach($_POST['domains'] as $domain) {
		$cstmt->bindValue(2,$domain);
		$cstmt->execute();
		$cstmt->closeCursor();
	}
}
?><user uid="<?php echo $_POST['uid']; ?>" version="<?php echo $version; ?>" ></user> 
<?php

$db->exec("COMMIT");
?>
