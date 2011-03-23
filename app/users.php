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

function head_content() {

?>
	<title>AKC Money User Manager</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the User Management Page where Users may be set up or deleted"/>	
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="/js/mootools-core-1.3-yc.js"></script>
	<script type="text/javascript" src="/js/utils.js" ></script>
	<script type="text/javascript" src="/js/md5.js" ></script>
	<script type="text/javascript" src="users.js" ></script>
<?php
}

function content() {
    global $db,$user;
    $tabIndex = 1;
    $cstmt = $db->prepare("SELECT domain FROM capability WHERE uid = ? ;");
?><h1>User Manager</h1>
<?php

if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
}

?>
<script type="text/javascript">

window.addEvent('domready', function() {
    AKCMoney.User();
});
</script>
<h2>User List</h2>
<div class="xuser heading">
	<div class="urow">
    	<div class="user">Name</div>
    	<div class="passwd">Password</div>
    </div>
    <div class="domains">Domains</div>
    <div class="urow">
    	<div class="account">Default Account</div>
    	<div class="domain">Default Domain</div>
    </div>
    <div style="clear:both"></div>
</div>
<div class="xuser newuser">
    <form id="newuser" action="newuser.php" method="post" onSubmit="return false;">
	    <div class="user"><input type="text" name="user" tabindex="<?php echo $tabIndex++; ?>"/></div>
	    <div class="passwd"<input type="password" name="passwd" tabindex="<?php echo $tabIndex++; ?>"/></div>
        <div class="domains">
        	<select name="domains" multiple="multiple" size="4" tabindex="<?php echo $tabIndex++; ?>">
<?php
$domains = Array();
$accounts = Array();
$db->beginTransaction();

$result = $db->query('SELECT name, description FROM domain ORDER BY name COLLATE NOCASE;');
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
	$domains[$row['name']] = $row['description'];
?>              <option value="<?php echo $row['name']; ?>" title="<?php echo $row['description']; ?>" selected="selected"><?php echo $row['name']; ?></option>
<?php
}
$result->closeCursor();

?>			</select>
        </div>
       	<div class="account">
       		<select name="account" title="default account">
        		<option value="" title="NULL" selected="selected"></option>
<?php
$result = $db->query("SELECT name,domain FROM account ORDER BY coalesce(domain,'ZZZZZZ') COLLATE NOCASE,name COLLATE NOCASE");
while($row = $result->fetch(PDO::FETCH_ASSOC)) {
	$accounts[$row['name']] = $row['domain'];
?>				<option value="<?php echo $row['name'];?>" domain="<?php echo $row['domain']; ?>"><?php echo $row['name'];
					if(!is_null($row['domain'])) echo " (".$row['domain'].")"; ?></option>
<?php
}
$result->closeCursor();
?>			</select>
		</div>
		<div class="domain">
			<select name="domain" title="default domain"  tabindex="<?php echo $tabIndex++; ?>">
        		<option value="" title="NULL" selected="selected"></option>
<?php
    foreach($domains as $domain => $description) {
?>				<option value="<?php echo $domain; ?>" title="<?php echo $description; ?>" ><?php echo $domain; ?></option>
<?php
    }
?>			</select>
	    </div>
        <div class="admin"><label for="A0">Is Admin </label><input type="checkbox" name="admin" id="A0" tabindex="<?php echo $tabIndex++; ?>"/></div>
    </form>
    <div class="button">
        <div class="buttoncontainer">
            <a id="adduser" class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="add.png"/>Add</span></a>
        </div>
    </div>
</div>
<div id="users">
<?php
$result = $db->query('SELECT * FROM user ORDER BY name COLLATE NOCASE ASC;');
$r=0;
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $r++;
?>  <div class="xuser<?php if($r%2 == 0) echo ' even';?>">
        <form action="updateuser.php" method="post" onSubmit="return false;">
        	<input type="hidden" name="uid" value="<?php echo $row['uid']; ?>" />
            <input type="hidden" name="version" value="<?php echo $row['version'];?>"/>
            <input type="hidden" name="original" value="<?php echo $row['name']; ?>" />
            <div class="user"><input type="text" name="user" value="<?php echo $row['name']; ?>" tabindex="<?php echo $tabIndex++; ?>"/></div>
		    <div class="passwd"<input type="password" name="passwd" tabindex="<?php echo $tabIndex++; ?>"/></div>
		    <div class="domains">
		    	<select name="domains" id="newselect" multiple="multiple" size="4" tabindex="<?php echo $tabIndex++; ?>" <?php
		    		if($row['isAdmin'] == 1) echo 'disabled="disabled"';?>>
<?php
	if($row['isAdmin'] != 1) {
	// if we are not admin, then we must only select the domains currently included in our capabilities
		$cstmt->bindValue(1,$row['uid']);
		$cstmt->execute();
		$capabilities = $cstmt->fetchAll(PDO::FETCH_COLUMN);
		$cstmt->closeCursor();
	}
    foreach($domains as $domain => $description) {
?>					<option value="<?php echo $domain; ?>" title="<?php echo $description; ?>" <?php 
                         if ($row['isAdmin'] != 1 && in_array($domain,$capabilities)) echo 'selected="selected"';?>><?php echo $domain; ?></option>
<?php
    }
?>              </select>
            </div>
        	<div class="account">
        		<select name="account" title="default account" tabindex="<?php echo $tabIndex++; ?>">
        			<option value="" title="NULL" <?php if(is_null($row['account'])) echo 'selected="selected"';?>></option>
<?php
    foreach($accounts as $account => $domain) {
?>					<option value="<?php echo $account; ?>" domain="<?php echo $domain;?>" <?php
						if(!($row['isAdmin'] == 1 || in_array($domain,$capabilities))) {
							echo 'disabled="disabled"';
						} elseif($row['account'] == $account) {
							echo 'selected="selected"';
						}?>><?php echo $account; if(!is_null($domain)) echo " (".$domain.")"; ?></option>
<?php
    }
?>              </select>
            </div>
            <div class="domain">
            	<select name="domain" title="default domain" tabindex="<?php echo $tabIndex++; ?>">
        			<option value="" title="NULL" <?php if(is_null($row['domain'])) echo 'selected="selected"';?>></option>
<?php
	foreach($domains as $domain => $description) {
?>					<option value="<?php echo $domain;?>" title="<?php echo $description; ?>" <?php
						if(!($row['isAdmin'] == 1 || in_array($domain,$capabilities))) {
							echo 'disabled="disabled"';
						} elseif($row['domain'] == $domain) {
							echo 'selected="selected"';
						}?>><?php echo $domain; ?></option>
<?php
    }
?>              </select>
			</div>
			<div class="admin"><label for="A<?php echo $row['uid'];?>">Is Admin </label><input type="checkbox" name="admin" id="A<?php 
				echo $row['uid'];?>" <?php if($row['isAdmin'] == 1) echo 'checked="checked"';?> tabindex="<?php echo $tabIndex++; ?>"/></div>
        </form>
        <div class="button">
<?
	if($row['uid'] != 1) { //can't delete the original user
?>          <div class="buttoncontainer">
                <a class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="delete.png"/>Delete</span></a>
            </div>
<?php
	}
?>      </div>
    </div>
<?php            
}
$result->closeCursor();
?>
</div>
<?php
$db->commit();
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

