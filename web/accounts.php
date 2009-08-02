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

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>AKC Money</title>
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<link type="text/css" href="css/redmond/jquery-ui-1.7.2.custom.css" rel="stylesheet" />	
	<script type="text/javascript" src="js/jquery-1.3.2.min.js"></script>
	<script type="text/javascript" src="js/jquery-ui-1.7.2.custom.min.js"></script>
</head>
<body>
<script type="text/javascript">
    var version = '<?php include('version.txt');?>' ;
    $(document).ready(function () {
        $('#version').append(version);
    });
</script>

    <div id="header"></div>
    <ul id="menu">
        <li><a href="index.php" target="_self" title="Account" >Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager" class="current">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
    </ul>

<!-- footer START -->
<div id="footer">
	<img id="logo" src="http://www.chandlerfamily.org.uk/wp-content/themes/chandlerszen/img/chandlerfamily.jpg" alt="chandlerfamily logo" />
	<div id="copyright">
		<p>Unless otherwise stated the content of this site is copyright copyright &copy; 2003-2009 Alan Chandler. Please see <a href="/licences/">licence conditions</a> for details on copying.</p>

	</div>
	<div id="version"><?php include version.php;?></div>
</div>
<!-- footer END -->

</div>
<!-- container END -->

<script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
try {
var pageTracker = _gat._getTracker("UA-xxxxxxx-1");
pageTracker._trackPageview();
} catch(err) {}</script>


</body>
</html>

