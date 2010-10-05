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

if(!(isset($_POST['db']) && isset($_POST['user']) && isset($_POST['pass']) && isset($_POST['rem']))) die('Invalid Parameters');



$db = new PDO('sqlite:'.DB_DIR.$_POST['db'].'.db');

$getuser=$db->prepare("SELECT uid,version,password,isAdmin,domain,account FROM user WHERE name= ?");
$getuser->bindValue(1,strtolower($_POST['user']));
$purgelog = $db->prepare("DELETE FROM login_log WHERE time < ? ");
$getcap = $db->prepare("SELECT domain FROM capability WHERE uid = ?");
$writelog = $db->prepare("INSERT INTO login_log (ipaddress,username,issuccess) VALUES(?,?,?)");

$writelog->bindValue(1,$_SERVER['REMOTE_ADDR']);
$writelog->bindValue(2,strtolower($_POST['user']));

$getconfig = $db->prepare("SELECT demo FROM config LIMIT 1");

$db->exec("BEGIN IMMEDIATE");

$purgelog->bindValue(1,time() - 2600000,PDO::PARAM_INT);  //purge log entries after 30 days
$purgelog->execute();
$purgelog->closeCursor();
//Find out how many failures against this ip address we had since a last success
$checklog = $db->prepare("SELECT count(*) FROM login_log WHERE issuccess = 0 AND ipaddress = ? AND time > ifnull((
SELECT max(time) FROM login_log WHERE ipaddress= ? AND issuccess = 1),0)");

$checklog->bindValue(1,$_SERVER['REMOTE_ADDR']);
$checklog->bindValue(2,$_SERVER['REMOTE_ADDR']);
$checklog->execute();
if($checklog->fetchColumn() > 6) {//too many failures and we will just exit
	$checklog->closeCursor();
	$writelog->bindValue(3,0,PDO::PARAM_INT); //Say that this log entry was a failure
	$writelog->execute();
	$writelog->closeCursor();
	echo '{status:false,retry:false}';
	$db->exec("COMMIT");
	exit;
}
$checklog->closeCursor();

$getuser->execute(); //See if we can find the user
if( $user= $getuser->fetch(PDO::FETCH_ASSOC)) {
    if($user['password'] == $_POST['pass']) {
        $getuser->closeCursor();
        unset($user['password']);
        //successfully matched username and password
        if($user['isAdmin'] == 1) {
            $user['isAdmin'] = true;
        } else {
            $user['isAdmin'] = false;
        }
        if(is_null($user['domain'])) unset($user['domain']);
        if(is_null($user['account'])) unset($user['account']);

		$writelog->bindValue(3,1,PDO::PARAM_INT); //Say that this log entry was a success
		$writelog->execute();
		$writelog->closeCursor();
		
		$getconfig->execute();
		if ($getconfig->fetchColumn() == 1) {
			$user['demo'] = true;
		} else {
			$user['demo'] = false;
		}
		$getconfig->closeCursor();

        $db->exec("COMMIT");
	
	//now make the cookie
		$user['db'] = $_POST['db'];
        $user['timestamp'] = time();
        $user['key'] = sha1(PRIVATE_KEY.$user['timestamp'].$user['uid']);
        $user['temp'] = ($_POST['rem'] != 'true');
        if($user['temp']) {
            setcookie('akcmoney',base64_encode(serialize($user)),0); //Expire when browser closes
        } else {
            setcookie('akcmoney',base64_encode(serialize($user)),$user['timestamp']+2600000); //Just over 30 days
        }
        echo '{status:true}';
	exit;
    }
}
//We have failed, so we log it, and find out if retry is still allowed
$getuser->closeCursor();
$writelog->bindValue(3,0,PDO::PARAM_INT); //Say that this log entry was a failure
$writelog->execute();
$writelog->closeCursor();

//Find out how many failures against this ip address we had since a last success
$checklog = $db->prepare("SELECT count(*) FROM login_log WHERE issuccess = 0 AND ipaddress = ? AND time > coalesce((
SELECT max(time) FROM login_log WHERE ipaddress= ? AND issuccess = 1),0)");

$checklog->bindValue(1,$_SERVER['REMOTE_ADDR']);
$checklog->bindValue(2,$_SERVER['REMOTE_ADDR']);
$checklog->execute();
if($checklog->fetchColumn() > 3) {
	echo '{status:false,retry:false}'; //say retry not allowed
} else {
	echo '{status:false,retry:true}'; //say can retry if you want
}
$checklog->closeCursor();
$db->exec("COMMIT");
?>

