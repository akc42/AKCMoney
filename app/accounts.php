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

//Stop us remaining on this page if we haven't yet started a session
if(!isset($_SESSION['key'])) {
	header( 'Location: index.php' ) ;
	exit;
};


define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

function head_content() {

?>
	<title>AKC Money Account Manager</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the Account Management Page where Accounts may be set up or deleted"/>	
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<script type="text/javascript" src="/js/mootools-1.2.4-core-nc.js"></script>
	<script type="text/javascript" src="utils.js" ></script>
	<script type="text/javascript" src="account.js" ></script>
<?php
}

function menu_items() {

?> 
        <li><a href="index.php" target="_self" title="Account">Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager" class="current">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
<?php
}
function content() {
?><h1>Account Manager</h1>
<?php

if ($_SESSION['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
}

?>
<script type="text/javascript">

window.addEvent('domready', function() {
// Set some useful values
    Utils.sessionKey = "<?php echo $_SESSION['key']; ?>";
    Utils.defaultCurrency = "<?php echo $_SESSION['default_currency'];?>";
    Utils.dcDescription = "<?php echo $_SESSION['dc_description']; ?>";
    AKCMoney.Account();
});
</script>
<div class="topinfo">
    <form id="startaccounts" action="updefaccount.php" method="post" />
    <input type="hidden" name="version" value="<?php echo $_SESSION['config_version']; ?>" />
    <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
    <div class="startaccount">
        <div class="acclabel">External Start Account</div>
        <div class="accountsel">
            <select name="extnaccount" tabindex="10">
<?php
$result = dbQuery('SELECT name FROM account ORDER BY name ASC;');
while ($row = dbFetch($result) ) {
?>              <option <?php echo ($_SESSION['extn_account'] == $row['name'])?'selected = "selected"':'' ; ?> ><?php echo $row['name']; ?></option>
<?php
}
dbfree($result);
?>          </select>

        </div>
    </div>
    <div class="startaccount">
        <div class="acclabel">Home Start Account</div>
        <div class="accountsel">
           <select name="homeaccount" tabindex="20">
<?php
$result = dbQuery('SELECT name FROM account ORDER BY name ASC;');
while ($row = dbFetch($result) ) {
?>            <option <?php echo ($_SESSION['home_account'] == $row['name'])?'selected = "selected"':'' ; ?> ><?php echo $row['name']; ?></option>
<?php
}
dbfree($result);
?>        </select>
        </div>
    </div>
    </form>
</div>
<h2>Account List</h2>
<div class="xaccount heading">
    <div class="account">Name</div>
    <div class="type">Type</div>
    <div class="currency">Currency</div>
    <div class="button">&nbsp;</div>
</div>
<div class="xaccount newaccount">
    <form id="newaccount" action="newaccount.php" method="post" onSubmit="return false;">
        <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
        <div class="account"><input type="text" name="account" value=""/></div>
        <div class="type">
<?php
$atype = Array();
$result=dbQuery('SELECT atype,description FROM account_type');
if($row=dbFetch($result)) { /* first row is the default, so read it first to set it up*/
    $defaultatype = $row['atype'];
    $atype[$defaultatype] = $row['description'];
/* Note we've given the select statement an id because its going to become a template for all the other accounts */
?>            <select name="type" title="<?php echo $row['description'];?>">
                <option selected="selected" title="<?php echo $row['description'];?>"><?php echo $row['atype'];?></option>
<?php
    while($row=dbFetch($result)) {
    $atype[$row['atype']] = $row['description'];
?>              <option title="<?php echo $row['description'];?>"><?php echo $row['atype'];?></option>
<?php
    }
?>          </select>
<?php
}
?>
        </div>
        <div class="currency">
            <select name="currency" title="<?php echo $_SESSION['dc_description']; ?>">
<?php
$currencies = Array();            
$result=dbQuery('SELECT name, rate, display, priority, description FROM currency WHERE display = true ORDER BY priority ASC;');
while($row = dbFetch($result)) {
$currencies[$row['name']] = Array($row['rate'],$row['description']);
?>              <option value="<?php echo $row['name']; ?>" <?php
                        if($row['name'] == $_SESSION['default_currency']) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
}
dbFree($result);
?>
            </select>
        </div>
    </form>
    <div class="button">
        <div class="buttoncontainer">
            <a id="addaccount" class="button"><span><img src="add.png"/>Add Account</span></a>
        </div>
    </div>
</div>
<div id="accounts">
<?php
$result=dbQuery('SELECT * FROM account ORDER BY name ASC;');
$r=0;
while($row = dbFetch($result)) {
    $r++
?>  <div class="xaccount<?php if($r%2 == 0) echo ' even';?>">
        <form action="updateaccount.php" method="post" onSubmit="return false;">
            <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
            <input type="hidden" name="dversion" value="<?php echo $row['dversion'];?>"/>
            <input type="hidden" name="original" value="<?php echo $row['name']; ?>" />
            <div class="account"><input type="text" name="account" value="<?php echo $row['name']; ?>"/></div>
            <div class="type">
                <select name="type" title="<?php echo $atype[$defaultatype]; ?>" />
<?php
    foreach($atype as $type => $description) { 
?>                  <option value="<?php echo $type; ?>" 
                        title="<?php echo $description; ?>" <?php if ($type == $row['atype']) echo 'selected="selected"';?> ><?php echo $type; ?></option>
<?php
    }
?>              </select>
            </div>
            <div class="currency">
                <select name="currency" title="<?php echo $currencies[$row['currency']][1]; ?>">
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
                <a class="button"><span><img src="delete.png"/>Delete Account</span></a>
            </div>
        </div>
    </div>
<?php            
}
?>
</div>
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/template.php'); 
?>

