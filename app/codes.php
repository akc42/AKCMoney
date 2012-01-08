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
	<title>AKC Money Accounting Code Manager</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the Code Management Page where Codes may be set up or deleted"/>	
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="/js/mootools-core-1.3.2-yc.js"></script>
	<script type="text/javascript" src="/js/utils-yc-<?php include('inc/version.inc');?>.js" ></script>
	<script type="text/javascript" src="codes-yc-<?php include('inc/version.inc');?>.js" ></script>
<?php
}

function content() {
    global $db,$user;
    $tabIndex = 1;
    
    
    
    
    
?><h1>Code Manager</h1>
<?php

if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
}

?>
<script type="text/javascript">

window.addEvent('domready', function() {
    AKCMoney.Code();
});
</script>
<h2>Code List</h2>
<div class="xcode heading">
    <div class="description">Description</div>
    <div class="codetype">Type</div>
    <div class="button">&nbsp;</div>
</div>
<div class="xcode newcode">
    <form id="newcode" action="newcode.php" method="post" onSubmit="return false;">
    	<input type="hidden" name="original" value=""/>
		<div class="description"><input type="text" name="description" value="" tabindex="<?php	 echo $tabIndex++; ?>"/></div>
        <div class="codetype">
        	<select name="codetype" value="" tabindex="<?php echo $tabIndex++; ?>">
<?php
	$codes = Array();
	$db->beginTransaction();
	$result = $db->query("SELECT * FROM codeType ORDER BY type ASC;");
	$r=0;
	while($row = $result->fetch(PDO::FETCH_ASSOC) ) {
		$r++;
		$codes[$row['type']] = $row['description'];
?>				<option value="<?php echo $row['type']; ?>" <?php
					if($r ==1) echo 'selected="selected"'; ?> class="code_<?php echo $row['type']; ?>"><?php echo $row['description'];?></option>
<?php
	}
	$result->closeCursor();
?>			</select>
        </div>
    </form>
    <div class="button">
        <div class="buttoncontainer">
            <a id="addcode" class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="add.png"/>Add Code</span></a>
        </div>
    </div>
</div>
<div id="codes">
<?php

	$result = $db->query('SELECT * FROM code ORDER BY type ASC, description COLLATE NOCASE ASC;');
	$r=0;
	while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    	$r++
?>  <div class="xcode<?php if($r%2 == 0) echo ' even';?>">
        <form action="updatecode.php" method="post" onSubmit="return false;">
            <input type="hidden" name="version" value="<?php echo $row['version'];?>"/>
            <input type="hidden" name="id" value="<?php echo $row['id']; ?>" />
            <input type="hidden" name="original" value="<?php echo $row['description']; ?>" />
            <div class="description"><input type="text" name="description" value="<?php echo $row['description']; ?>" tabindex="<?php
            					 echo $tabIndex++; ?>"/></div>
		    <div class="codetype">
		    	<select name="codetype" value="" tabindex="<?php echo $tabIndex++; ?>">
<?php
		foreach($codes as $codetype => $codedesc) {
?>				<option value="<?php echo $codetype; ?>" <?php 
					if($codetype == $row['type']) echo 'selected="selected"';?> class="code_<?php echo $codetype; ?>"><?php echo $codedesc;?></option>
<?php
		}
?>			</select>
        </div>
        </form>
        <div class="button">
            <div class="buttoncontainer">
                <a class="button" tabindex="<?php echo $tabIndex++; ?>"><span><img src="delete.png"/>Delete Code</span></a>
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

