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

require_once('./inc/db.inc');

$ustmt = $db->prepare("SELECT name FROM user WHERE name = ? ;");
$ustmt->bindValue(1,$_POST['user']);
$istmt =  $db->prepare("INSERT INTO user (name, version, password, isAdmin,domain,account) VALUES ( ? , 1, ? , ? , ? ,?);");
$istmt->bindValue(1,$_POST['user']);
$istmt->bindValue(2,$_POST['passwd']);
$istmt->bindValue(3,($_POST['admin'] == 'yes')?1:0,PDO::PARAM_INT);
if($_POST['domain'] != '') {
	$istmt->bindValue(4,$_POST['domain']);
} else {
	$istmt->bindValue(4,null,PDO::PARAM_NULL);
}
if($_POST['account'] != '') {
	$istmt->bindValue(5,$_POST['account']);
} else {
	$istmt->bindValue(5,null,PDO::PARAM_NULL);
}
if($_POST['admin'] != 'yes') {
	$cstmt = $db->prepare("INSERT INTO capability (uid,domain) VALUES (?,?);");
} 

$db->exec("BEGIN IMMEDIATE");

$ustmt->execute();
$name = $ustmt->fetchColumn();
$ustmt->closeCursor();

if ($name == $_POST['user']) {
    //User with this name already exists so we cannot create one
?><error>It appears a user with this name already exists.  This is probably because someone else is editing the list of users
in parallel to you.  We will reload the page to ensure that you have consistent data</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$istmt->execute();
$istmt->closeCursor();
$uid = $db->lastInsertId();

//if we need to create capability records, lets do so
if($_POST['admin'] != 'yes') {
	$cstmt->bindValue(1,$uid,PDO::PARAM_INT);
	foreach($_POST['domains'] as $domain) {
		$cstmt->bindValue(2,$domain);
		$cstmt->execute();
		$cstmt->closeCursor();
	}
}

?>  <div class="xuser">
        <form action="updateuser.php" method="post" onSubmit="return false;">
        	<input type="hidden" name="uid" value="<?php echo $uid; ?>" />
            <input type="hidden" name="version" value="1"/>
            <input type="hidden" name="original" value="<?php echo $_POST['user']; ?>" />
            <div class="user"><input type="text" name="user" value="<?php echo $_POST['user']; ?>"/></div>
		    <div class="passwd"<input type="password" name="passwd"/></div>
		    <div class="domains">
		    	<select name="domains" id="newselect" multiple="multiple" size="4" <?php
		    		if($_POST['admin'] == 'yes') echo 'disabled="disabled"';?>>
<?php
$result = $db->query('SELECT name, description FROM domain ORDER BY name COLLATE NOCASE;');
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
	$domains[$row['name']] = $row['description'];
?>					<option value="<?php echo $row['name']; ?>" title="<?php echo $row['description']; ?>" <?php 
                         if ($_POST['admin'] != 'yes' && in_array($row['name'],$_POST['domains'])) echo 'selected="selected"';?>><?php 
                         	echo $row['name']; ?></option>
<?php
}
$result->closeCursor();
?>              </select>
            </div>
        	<div class="account">
        		<select name="account" title="default account">
        			<option value="" title="NULL" <?php if($_POST['account'] == '') echo 'selected="selected"';?>></option>
<?php
$result = $db->query("SELECT name,domain FROM account ORDER BY coalesce(domain,'ZZZZZZ') COLLATE NOCASE,name COLLATE NOCASE");
while($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>					<option value="<?php echo $row['name']; ?>" domain="<?php echo $row['domain'];?>" <?php
						if(!($_POST['admin'] == 'yes' || in_array($row['domain'],$_POST['domains']))) {
							echo 'disabled="disabled"';
						} elseif($row['name'] == $_POST['account']) {
							echo 'selected="selected"';
						}?>><?php echo $row['name']; if(!is_null($row['domain'])) echo " (".$row['domain'].")"; ?></option>
<?php
}
$result->closeCursor();
?>              </select>
            </div>
            <div class="domain">
            	<select name="domain" title="default domain">
        			<option value="" title="NULL" <?php if($_POST['domain'] == '') echo 'selected="selected"';?>></option>
<?php
foreach($domains as $domain => $description) {
?>					<option value="<?php echo $domain;?>" title="<?php echo $description; ?>" <?php
						if(!($_POST['admin'] == 'yes' || in_array($domain,$_POST['domains']))) {
							echo 'disabled="disabled"';
						} elseif($_POST['domain'] == $domain) {
							echo 'selected="selected"';
						}?>><?php echo $domain; ?></option>
<?php
}
?>              </select>
			</div>
			<div class="admin"><label for="A<?php echo $uid;?>">Is Admin </label><input type="checkbox" name="admin" id="A<?php 
				echo $uid;?>" <?php if($_POST['admin'] == 'yes') echo 'checked="checked"';?> /></div>
        </form>
        <div class="button">
            <div class="buttoncontainer">
                <a class="button"><span><img src="delete.png"/>Delete</span></a>
            </div>
        </div>
    </div>
<?php
$db->exec("COMMIT");
?>
