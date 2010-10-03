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

function head_content() {

?>
	<title>AKC Money Account Manager</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the Account Management Page where Accounts may be set up or deleted"/>	
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="utils.js" ></script>
	<script type="text/javascript" src="accounts.js" ></script>
<?php
}

function content() {
    global $db,$user;
    $tabIndex = 1;
?><h1>Account Manager</h1>
<?php

if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
}

?>
<script type="text/javascript">

window.addEvent('domready', function() {
    AKCMoney.Account();
});
</script>
<h2>Account List</h2>
<div class="xaccount heading">
    <div class="account">Name</div>
    <div class="domain">Domain</div>
    <div class="currency">Currency</div>
    <div class="button">&nbsp;</div>
</div>
<div class="xaccount newaccount">
    <form id="newaccount" action="newaccount.php" method="post" onSubmit="return false;">
        <div class="account"><input type="text" name="account" value="" tabindex="<?php echo $tabIndex++; ?>"/></div>
        <div class="domain">
        	<select name="domain" value="" tabindex="<?php echo $tabIndex++; ?>">
        		<option value="" title="NULL" selected="selected"></option>
<?php
$domains = Array();
$currencies = Array();            
$db->beginTransaction();

$result = $db->query('SELECT name, description FROM domain ORDER BY name COLLATE NOCASE;');
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
$domains[$row['name']] = $row['description'];
?>              <option value="<?php echo $row['name']; ?>" title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php
}
$result->closeCursor();

?>			</select>
        </div>
        <div class="currency">
            <select name="currency" tabindex="<?php echo $tabIndex++; ?>">
<?php
$result = $db->query('SELECT name, rate, description FROM currency WHERE display = 1 ORDER BY priority ASC;');
$r=0;
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
$currencies[$row['name']] = Array($row['rate'],$row['description']);
?>              <option value="<?php echo $row['name']; ?>" <?php
                        if($r == 0) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php
$r++;    
}
$result->closeCursor();
?>
            </select>
        </div>
    </form>
    <div class="button">
        <div class="buttoncontainer">
            <a id="addaccount" class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="add.png"/>Add</span></a>
        </div>
    </div>
</div>
<div id="accounts">
<?php
// Assuming that accounts with NULL domains will sort first - we then see they need to be allocated to a domain
$result = $db->query("SELECT * FROM account ORDER BY domain,name COLLATE NOCASE ASC;");
$r=0;
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $r++;
?>  <div class="xaccount<?php if($r%2 == 0) echo ' even';?>">
        <form action="updateaccount.php" method="post" onSubmit="return false;">
            <input type="hidden" name="dversion" value="<?php echo $row['dversion'];?>"/>
            <input type="hidden" name="original" value="<?php echo $row['name']; ?>" />
            <div class="account"><input type="text" name="account" value="<?php echo $row['name']; ?>" tabindex="<?php echo $tabIndex++; ?>"/></div>
            <div class="domain">
<?php
	if(is_null($row['domain'])){
?>            	<select name="domain" title="NULL" tabindex="<?php echo $tabIndex++; ?>">
            		<option value="" title="NULL" selected="selected"></option>
<?php
	} else {
?>				<select name="domain" title="<?php echo $domains[$row['domain']]; ?>">
					<option value="" title="NULL"></option>
<?php
	}
    foreach($domains as $domain => $description) {
?>					<option value="<?php echo $domain; ?>" title="<?php
                         echo $description; ?>" <?php if (!is_null($row['domain']) && $domain == $row['domain']) echo 'selected="selected"';?>><?php echo $domain; ?></option>
<?php
    }
?>              </select>
            </div>
            <div class="currency">
                <select name="currency" title="<?php echo $currencies[$row['currency']][1]; ?>" tabindex="<?php echo $tabIndex++; ?>">
<?php
    foreach($currencies as $currency => $values) {
?>                <option value="<?php echo $currency; ?>" title="<?php
                         echo $values[1]; ?>" rate="<?php echo $values[0]; ?>" <?php if ($currency == $row['currency']) echo 'selected="selected"';?> 
                       ><?php echo $currency; ?></option>
<?php
    }
?>              </select>
            </div>
        </form>
        <div class="button">
            <div class="buttoncontainer">
                <a class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="delete.png"/>Delete</span></a>
            </div>
        </div>
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

