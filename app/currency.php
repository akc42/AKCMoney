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

require_once('./inc/db.inc');

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
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="/js/mootools-core-1.3.2-yc.js"></script>
	<script type="text/javascript" src="mootools-money-1.3.2.1-yc.js"></script>
	<script type="text/javascript" src="/js/utils.js" ></script>
	<script type="text/javascript" src="currency.js" ></script>

<?php
}

function content () {
    global $db,$user;
?><h1>Currency Manager</h1>
<?php 
if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
} 
?>
<script type="text/javascript">

window.addEvent('domready', function() {
// Set some useful values
    AKCMoney.Currency();
});
</script>

<div class="topinfo">
    <div id="updefcurrency" class="defaultcurrency">
<?php

$pstmt = $db->prepare("SELECT * FROM currency WHERE display = 1 ORDER BY priority ASC;");
$nstmt = $db->prepare("SELECT * FROM currency WHERE display = 0 ORDER BY name ASC;"); 
            
$db->beginTransaction();
$pstmt->execute();
$r=0;
while ($row = $pstmt->fetch(PDO::FETCH_ASSOC)) {
	if($r==0) {
?>      <div id=dc_description>Default Currency:<?php echo $row['description']; ?></div>
        <div class="currency">
            <select id="currencyselector" name="currency" tabindex="1">

<?php
	}
?>                <option value="<?php echo $row['name']; ?>" <?php
                        if($r == 0) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php
	$r++;    
}
$pstmt->closeCursor();
?>
            </select>
        </div>
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

$pstmt->execute();
if ($row = $pstmt->fetch(PDO::FETCH_ASSOC)) {  //First row is default currency and is not sortable
?>
<div id="defaultcurrency">
    <div id="<?php echo 'c_'.$row['name']; ?>" class="xcurrency">
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
    while($row = $pstmt->fetch(PDO::FETCH_ASSOC)) {
        $r++
?>

<div id="<?php echo 'c_'.$row['name']; ?>" class="xcurrency<?php if($r%2 == 0) echo ' even';?>">
    <input type="hidden" name="version" value="<?php echo  $row['version']; ?>" />
    <input type="hidden" name="priority" value="<?php echo $r-1 ?>" />
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="currency"><?php echo $row['name']; ?></div>
    <div class="show"><input type="checkbox" name="show" checked="checked" tabindex="<?php echo $r; ?>"/></div>
    <div class="rate"><?php echo $row['rate']; ?></div>
</div>

<?php
    }
    $maxp = $r
?></div>
<?php
}
$pstmt->closeCursor();
?><div class="xcurrency heading"></div>
<div id="othercurrencies">
<?php
$nstmt->execute();
while($row = $nstmt->fetch(PDO::FETCH_ASSOC)) {
$r++
?>
<div id="<?php echo 'c_'.$row['name']; ?>" class="xcurrency<?php if($r%2 == 0) echo ' even';?>">
    <input type="hidden" name="version" value="<?php echo  $row['version']; ?>" />
    <input type="hidden" name="priority" value="1000" />
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="currency"><?php echo $row['name']; ?></div>
    <div class="show"><input type="checkbox" name="show"  tabindex="<?php echo $r; ?>"/></div>
    <div class="rate hidden"><?php echo $row['rate']; ?></div>
</div>
<?php
}
$nstmt->closeCursor();
$db->commit();
?></div>
<input type="hidden" id="maxpriority" value="<?php echo $maxp; ?>" />
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

