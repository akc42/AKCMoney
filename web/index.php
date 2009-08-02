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

//Can't start if we haven't setup settings.php
if (!file_exists(dirname(__FILE__) . '/settings.php')) header('Location: install.php'); //So install it

session_start();

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

if(!isset($_SESSION['account'])) {
// if we are at home (IP ADDRESS = 192.168.0.*) then use home_account, else use extn_account as default
    $at = (preg_match('/192\.168\.0\..*/',$_SERVER['REMOTE_ADDR']))?'home':'extn';
	$result = dbQuery('SELECT '.$at.'_account AS account, demo FROM config;');
	$row = dbFetch($result);
	$_SESSION['account'] = $row['account'];
	$_SESSION['demo'] = ($row['demo'] == 't');
	dbFree($result);
}

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>AKC Money Account Page</title>
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<link type="text/css" href="/css/redmond/jquery-ui-1.7.2.custom.css" rel="stylesheet" />	
	<script type="text/javascript" src="/js/jquery-1.3.2.min.js"></script>
	<script type="text/javascript" src="/js/jquery-ui-1.7.2.custom.min.js"></script>
	<script type="text/javascript" src="money.js" ></script>
</head>
<body>
<script type="text/javascript">
    $(document).ready(function () {
    });
</script>

    <div id="header"></div>
    <ul id="menu">
        <li><a href="index.php" target="_self" title="Account" class="current">Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
    </ul>

<div id="content">
    <h1>Account Data</h1>
<?php if ($_SESSION['demo']) {?>    <div class="ui-widget">
			<div class="ui-state-highlight ui-corner-all" style="margin-top: 20px; padding: 0 .7em;"> 
				<p><span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span>
				<strong>Beware - Demo</strong> Do not use real data, as others may have access to it.</p>
			</div>
		</div>
		<br/>
<?php } ?>		<form id="accountsel">
            <select>
<?php
$result = dbQuery('SELECT name FROM account ORDER BY name ASC;');
while ($row = dbFetch($result) ) {
?>              <option <?php echo ($_SESSION['account'] == $row['name'])?'selected = "selected"':'' ; ?> ><?php echo $row['name']; ?></option>
<?php
}
?>           </select>
	    </form>	
<?php

?>
</div>

<div id="footer">
	<div id="copyright">
		<p>AKCMoney is copyright &copy; 2003-2009 Alan Chandler. Visit
		<a href="http://www.chandlerfamily.org.uk/software/">http://www.chandlerfamily.org.uk/software/</a> to obtain a copy</p>
	</div>
	<div id="version"><?php include('version.php');?></div>
</div>

</body>
</html>

