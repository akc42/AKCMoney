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
	<title>AKC Money Domain Manager</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the Domain Management Page where Domains may be set up or deleted"/>	
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="utils-yc-<?php include('inc/version.inc');?>.js" ></script>
	<script type="text/javascript" src="domains-yc-<?php include('inc/version.inc');?>.js" ></script>
<?php
}

function content() {
    global $db,$user;
    $tabIndex = 1;
?><h1>Domain Manager</h1>
<?php

if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
}

?>
<script type="text/javascript">

window.addEvent('domready', function() {
    AKCMoney.Domain();
});
</script>
<h2>Domain List</h2>
<div class="xdomain heading">
    <div class="domain">Name</div>
    <div class="description">Description</div>
    <div class="button">&nbsp;</div>
</div>
<div class="xdomain newdomain">
    <form id="newdomain" action="newdomain.php" method="post" onSubmit="return false;">
        <div class="domain"><input type="text" name="domain" value="" tabindex="<?php echo $tabIndex++; ?>"/></div>
		<div class="description"><input type="text" name="description" value="" tabindex="<?php	 echo $tabIndex++; ?>"/></div>
    </form>
    <div class="button">
        <div class="buttoncontainer">
            <a id="adddomain" class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="add.png"/>Add Domain</span></a>
        </div>
    </div>
</div>
<div id="domains">
<?php
$db->beginTransaction();
$result = $db->query('SELECT * FROM domain ORDER BY name COLLATE NOCASE ASC;');
$r=0;
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $r++
?>  <div class="xdomain<?php if($r%2 == 0) echo ' even';?>">
        <form action="updatedomain.php" method="post" onSubmit="return false;">
            <input type="hidden" name="version" value="<?php echo $row['version'];?>"/>
            <input type="hidden" name="original" value="<?php echo $row['name']; ?>" />
            <div class="domain"><input type="text" name="domain" value="<?php echo $row['name']; ?>" tabindex="<?php echo $tabIndex++; ?>"/></div>
            <div class="description"><input type="text" name="description" value="<?php echo $row['description']; ?>" tabindex="<?php
            					 echo $tabIndex++; ?>"/></div>
        </form>
        <div class="button">
            <div class="buttoncontainer">
                <a class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="delete.png"/>Delete Domain</span></a>
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

