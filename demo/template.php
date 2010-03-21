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
date_default_timezone_set  ('Europe/London');

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<link rel="stylesheet" type="text/css" href="/site.css"/>
<?php
head_content();
?></head>
<body>
    <div id="header"></div>
    <ul id="menu">
<?php
menu_items();
?>    </ul>

<div id="main">
<?php
content(); 
?><div id="footer">
	<div id="copyright">
	    <p>Copyright &copy; <?php echo date("Y");?> Alan Chandler.<p>
	    <p>This software is licenced under the latest version of the <a href="http://www.gnu.org/licences/" title="GNU General Public Licence" target="_blank">GPL</a>.</p> 
	</div>
	<div id="version"><?php include(dirname(__FILE__).'/../version.php');?></div>
</div>

</body>
</html>

