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

define('DB_DIR','/home/alan/dev/money/db/'); //coordinate with doLogin.php and install.php and doInstall.php
define('PRIVATE_KEY','AKCmPrivateKey');  /*Need to coordinate this value with doLogin.php and doInstall (which creates the Cookie values) */
//This is a convenient place to force everything we output to not be cached 
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past
if(!isset($_GET['db'])) {
    if(!isset($_COOKIE['akcmoney'])) {
        header('Location: error.php?err='.urlencode("No database specified"));  //don't know which database, so exit
        exit;
    }
    $user = unserialize(base64_decode($_COOKIE['akcmoney']));
    if(!is_array($user) || $user['key'] != sha1(PRIVATE_KEY.$user['timestamp'].$user['uid'])) die('Hacking attempt');
    $db = new PDO('sqlite:'.DB_DIR.$user['db'].'.db');
} else {
    if (!file_exists(DB_DIR.$_GET['db'].'.db')) {
        header('Location:error.php?err='.urlencode("Database file not found"));  //a database file must at least have been created by the sqlite3 command line utility
        exit;
    }
    $db = new PDO('sqlite:'.DB_DIR.$_GET['db'].'.db');
    $result = $db->query("SELECT count(*) FROM sqlite_master WHERE name = 'config' ;");
    if(!($result && ($present = $result->fetchColumn()) && $present == '1')) {
        header('Location:install.php?db='.urlencode($_GET['db']).'&url='. urlencode($_SERVER['PHP_SELF'])); //No database in file yet, so go and create it
        exit;
    }
    $result->closeCursor();
    $result = $db->query("SELECT demo,db_version FROM config LIMIT 1;");
    $row = $result->fetch(PDO::FETCH_ASSOC);
    if($row['db_version'] < 2) { //update to version 2
        $result->closeCursor();
        $db->exec(file_get_contents('./inc/update1.sql'));
        $result = $db->query('SELECT * FROM config;');
        $row = $result->fetch(PDO::FETCH_ASSOC);
    }

    if($row['db_version'] < 3) { //update to version 3
        $result->closeCursor();
        $db->exec(file_get_contents('./inc/update2.sql'));
        $result = $db->query('SELECT * FROM config;');
        $row = $result->fetch(PDO::FETCH_ASSOC);
    }

/*
       // TO BE ADDED WHEN THERE IS A NEXT UPDATE
    if($row['db_version'] < 4) { //update to version 4
        $result->closeCursor();
        $db->exec(file_get_contents('./inc/update3.sql'));
        $result = $db->query('SELECT * FROM config;');
        $row = $result->fetch(PDO::FETCH_ASSOC);
    }
*/ 
    if($row['demo'] != '0') {
        //Its a demo - so we are going to force our user to be admin
        $result->closeCursor();
        $result = $db->query("SELECT uid,domain, account FROM user WHERE uid = 1;");
        $user = $result->fetch(PDO::FETCH_ASSOC);
        $user['db'] = $_GET['db']; 
        $user['isAdmin'] = 1;
        $user['temp'] = true;
        $user['demo'] = true;
        updateUser();
    } else {
        if(!isset($_COOKIE['akcmoney'])) {
            header('Location:login.php?db='.urlencode($_GET['db']).'&url='. urlencode($_SERVER['PHP_SELF']));
            exit;       
        }
        $user = unserialize(base64_decode($_COOKIE['akcmoney']));
        if(!is_array($user) || $user['key'] != sha1(PRIVATE_KEY.$user['timestamp'].$user['uid'])) die('Hacking attempt');
        if($user['db'] != $_GET['db']) {
            header('Location:login.php?db='.urlencode($_GET['db']).'&url='. urlencode($_SERVER['PHP_SELF']));
            exit;
        }
    }
    $result->closeCursor();
}                

$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);  // We might as well know about any problems asap (for debugging, drop for production)
$db->setAttribute(PDO::ATTR_TIMEOUT,25);  //set 25 second timeout on obtaining a lock
$db->exec("PRAGMA foreign_keys = ON");

/* Converts from the standard bigint value that is being used for internal working to
  an apparent floating point number with two digits after the decimal point */
function fmtAmount($value) {
    return substr_replace(sprintf('%03d',$value),'.',-2,0);
}

/* update the cookie that is being carried around with the users details */
function updateUser() {
    global $user;
    $user['timestamp'] = time();
    $user['key'] = sha1(PRIVATE_KEY.$user['timestamp'].$user['uid']);
    if($user['temp']) {
        setcookie('akcmoney',base64_encode(serialize($user)),0); //Expire when browser closes
    } else {
        setcookie('akcmoney',base64_encode(serialize($user)),$user['timestamp']+2600000); //Just over 30 days
    }
}

/* Display the menu items specific to this user */
function menu_items() {
    global $db,$user;
    if(!isset($user)) return;  //if no user, that is because we have logged off and there is no cookie either

?><li><a href="index.php"><span class="down">Account Transactions</span></a>
    <ul>
<?php
    $menuselect = $db->prepare("
        SELECT a.name, a.domain FROM account AS a, 
        user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
        WHERE a.archived = 0 AND u.uid= ? AND (u.isAdmin = 1 OR c.domain = a.domain)
        ORDER BY CASE WHEN a.domain = ? THEN NULL ELSE coalesce(a.domain,'ZZZZZ') END COLLATE NOCASE ,a.name COLLATE NOCASE;
    ");
    $menuselect->bindValue(1,$user['uid'],PDO::PARAM_INT);
    if(isset($user['domain']) && !is_null($user['domain'])) {
	    $menuselect->bindValue(2,$user['domain']);
	} else {
		$menuselect->bindValue(2,null,PDO::PARAM_NULL);
	}
    $menuselect->execute();
    while ($menuitem = $menuselect->fetch(PDO::FETCH_ASSOC)) {
?>      <li><a href="index.php?account=<?php echo urlencode($menuitem['name']); ?>"><?php echo $menuitem['name'];
				if(!is_null($menuitem['domain'])) echo " (".$menuitem['domain'].")"; ?></a></li><?php
    }
    $menuselect->closeCursor();
?>  </ul>
</li>
<li><a href="accounting.php"><span class="down">Domain Accounting</span></a>
    <ul>
<?php
    $menuselect = $db->prepare("
        SELECT d.name FROM domain AS d, user AS u LEFT JOIN capability AS c ON c.uid = u.uid
        WHERE u.uid= ? AND ( c.domain = d.name OR u.isAdmin = 1) ORDER BY d.name COLLATE NOCASE ;
    ");
    $menuselect->bindValue(1,$user['uid'],PDO::PARAM_INT);
    $menuselect->execute();
    $menuitems = $menuselect->fetchAll(PDO::FETCH_COLUMN);
    foreach($menuitems as $menuitem) {
?>      <li><a href="accounting.php?domain=<?php echo urlencode($menuitem); ?>"><?php echo $menuitem; ?></a></li><?php
    }
    $menuselect->closeCursor();
?>  </ul>
</li>
<li><a href="user.php"><span>My Account</span></a></li>
<li><a href="logoff.php"><span>Log Off</span></a></li>
<?php
    if($user['isAdmin'] == 1) {
?><li><a href="#"><span class="down">Edit Configuration</span></a>
    <ul>
        <li><a href="accounts.php">Account Manager</a></li>
        <li><a href="currency.php">Currency Manager</a></li>
        <li><a href="domains.php">Domain Manager</a></li>
        <li><a href="codes.php">Accounting Codes Manager</a></li>
        <li><a href="users.php">User Manager</a></li>
    </ul>
</li>
<?php
    }
}

?>
