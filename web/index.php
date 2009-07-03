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


define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

if(!isset($_GET['account'])) {
	$result = dbQuery('SELECT start_account FROM config;');
	$row = dbFetch($result);
	$account = $row['start_account'];
	dbFree($result);
} else {
	$account = $_GET['account'];
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
<!-- include site css -->
	<link rel="stylesheet" type="text/css" href="/css/site.css"/>
</head>
<body>
<script type="text/javascript">
    var version = '<?php include('version.txt');?>' ;
    $(document).ready(function () {
        $('#version').append(version);
    });
</script>

<?php include($_SERVER['DOCUMENT_ROOT'].'/header.html'); ?>

<div id="navigation"><a href="#">Transactions</a> <a href="accmgr.php">Accounts Manager</a> <a href="currmgr.php">Currency Manager</a></div> 

<div id="content" class="loading"></div>

<?php include($_SERVER['DOCUMENT_ROOT'].'/footer.html'); ?>

</body>
</html>

