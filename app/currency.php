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
	<title>AKC Money Currency Manager</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the Currency Management Page where Currencies from
the formal list may be selected for inclusion in currency selection lists, together with the priority in which they should appear (default
currency always appears first).  The current rate is also shown, but is adjusted elsewhere"/>	
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<script type="text/javascript" src="/js/mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="mootools-1.2.4.4-money-yc.js"></script>
	<script type="text/javascript" src="utils.js" ></script>
	<script type="text/javascript" src="currency.js" ></script>

<?php
}

function menu_items() {
?>        <li><a href="index.php" target="_self" title="Account">Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager" class="current">Currency Manager</a></li>
<?php
}

function content () {
?><h1>Currency Manager</h1>
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
    AKCMoney.Currency();
});
</script>

<div class="topinfo">
    <div class="defaultcurrency">
        <div id=dc_description><?php echo $_SESSION['dc_description']; ?></div>
        <form id="updefcurrency" action="updatedefcur.php" method="post" />
            <input type="hidden" name="version" value="<?php echo $_SESSION['config_version']; ?>" />
            <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
            <div class="currency">
                <select id="currencyselector" name="currency">
<?php            
$result=dbQuery('SELECT * FROM currency WHERE display = true ORDER BY priority ASC;');
while($row = dbFetch($result)) {
?>                <option value="<?php echo $row['name']; ?>" <?php
                        if($row['name'] == $_SESSION['default_currency']) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
}
?>
                </select>
            </div>
        </form>
    </div>
</div>
<h2>Currency List</h2>
<div class="xcurrency heading">
    <div class="description">Description</div>
    <div class="currency">Name</div>
    <div class="show">Show?</div>
    <div class="rate">Rate</div>
</div>
<?php
$result=dbQuery('SELECT * FROM currency WHERE display = true ORDER BY priority ASC;');
if ($row = dbFetch($result)) {  //First row is default currency and is not sortable
?>
<div id="defaultcurrency">
    <div class="xcurrency">
        <input type="hidden" name="version" value="<?php echo  $row['version']; ?>" />
        <div class="description"><?php echo $row['description']; ?></div>
        <div class="currency"><?php echo $row['name']; ?></div>
        <div class="show">&nbsp;</div>
        <div class="rate">1.0</div>
    </div>
</div>
<div id="topcurrencies">

<?php
    $r=1;
    while($row = dbFetch($result)) {
        $r++
?>

<div class="xcurrency<?php if($r%2 == 0) echo ' even';?>">
    <input type="hidden" name="version" value="<?php echo  $row['version']; ?>" />
    <input type="hidden" name="priority" value="<?php echo $r-1 ?>" />
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="currency"><?php echo $row['name']; ?></div>
    <div class="show"><input type="checkbox" name="show" checked="checked" /></div>
    <div class="rate"><?php echo $row['rate']; ?></div>
</div>

<?php
    }
    $maxp = $r
?></div>
<?php
}
dbFree($result);
?><div class="xcurrency heading"></div>
<div id="othercurrencies">
<?php
$result=dbQuery('SELECT * FROM currency WHERE display = false ORDER BY name ASC;');
while($row = dbFetch($result)) {
$r++
?>
<div class="xcurrency<?php if($r%2 == 0) echo ' even';?>">
    <input type="hidden" name="version" value="<?php echo  $row['version']; ?>" />
    <input type="hidden" name="priority" value="1000" />
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="currency"><?php echo $row['name']; ?></div>
    <div class="show"><input type="checkbox" name="show" /></div>
    <div class="rate hidden"><?php echo $row['rate']; ?></div>
</div>
<?php
}
dbFree($result);
?></div>
<input type="hidden" id="maxpriority" value="<?php echo $maxp; ?>" />
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/template.php'); 
?>

