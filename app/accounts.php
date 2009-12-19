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
session_start();

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');




?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>AKC Money Account Page</title>
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<script type="text/javascript" src="/js/mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="/js/DateUtils.js"></script>
	<script type="text/javascript" src="money.js" ></script>
</head>
<body>
    <div id="header"></div>
    <ul id="menu">
        <li><a href="index.php" target="_self" title="Account">Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager" class="current">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
    </ul>

<div id="main">

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

