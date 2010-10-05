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
define('DB_DIR','/var/www/money/db/'); //coordinate with install.php and login.php
define('PRIVATE_KEY','AKCmPrivateKey');  /*Need to coordinate this value with doLogin.php and db.inc */

if(!(isset($_POST['db']) && isset($_POST['user']) && isset($_POST['pass']) && isset($_POST['rem']) && 
        isset($_POST['timestamp']) )) die('Invalid Parameters');

$db = new PDO('sqlite:'.DB_DIR.$_POST['db'].'.db');

$db->exec("BEGIN EXCLUSIVE");
$stmt = $db->query("SELECT count(*) FROM user;");
if($stmt->fetchColumn() > 0) {
    $stmt->closeCursor();
    $db->exec("ROLLBACK");
    die('Users Exist - To late to do install');
}
$stmt->closeCursor();
$stmt = $db->query("SELECT creation_date FROM config;");
if(abs($stmt->fetchColumn() - $_POST['timestamp']) > 15) {
    $stmt->closeCursor();
    $db->exec("ROLLBACK");
    die('Response too slow');
} 
$stmt = $db->prepare("INSERT INTO user (uid,name,version,password,isAdmin,account) VALUES (1,?,1,?,1,'Cash');");
$stmt->bindValue(1,$_POST['user']);
$stmt->bindValue(2,$_POST['pass']);
$stmt->execute();
$stmt->closeCursor();

if(isset($_POST['demo'])) {
	$db->exec("UPDATE config SET demo = 1");
}
$db->exec("COMMIT");
$timestamp = time();
$user = array(
	'db' => $_POST['db'],
    'uid' => 1,
    'version' => 1,
    'isAdmin' => true,
    'timestamp' => $timestamp,
    'key' => sha1(PRIVATE_KEY.$timestamp.'1'),
    'account' => 'Cash',
    'demo' => isset($_POST['demo']),
    'temp' => ($_POST['rem'] != 'true')
);
if($user['temp']) {
    setcookie('akcmoney',base64_encode(serialize($user)),0); //Expire when browser closes
} else {
    setcookie('akcmoney',base64_encode(serialize($user)),$user['timestamp']+2600000); //Just over 30 days
}
echo '{status:true}';
?>

