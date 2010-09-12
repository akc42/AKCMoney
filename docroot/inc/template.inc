<?php
/*
 	Copyright (c) 2009,2010 Alan Chandler
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

/*This template file shows the prefered way of providing a site template in which to fit
the application.  This file should be placed in the 'inc' subdirectory of thedocument root of the site where each page
of the application (and other applications also) will call it to display the site surround, and expect it to call it
back via "head_content()", "menu_items()" and "content()" functions.

Full instructions are given in the documentation.html file contained in the "supporting" directory of the overall source package.  This is a  tiddly wiki and is a full standalone web site inside a single file.  

This inclusion of the copyright file is the prefered way of providing attribution as required by the licence (obviously adjusting the
relative path to locate the the file in the delivered application).  If this template covers several applications, then each one should be included with a separate div as shown. 

The inclusion of the application version number is entirely optional, but is
a useful information when users wish to report faults

*/

define('MONEY_APP','/home/alan/dev/money/app/');  //Repeat for all apps that are to be included in footer
  
error_reporting(E_ALL);
date_default_timezone_set  ('Europe/London');

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<link rel="stylesheet" type="text/css" href="/css/template.css"/>
<?php
head_content();
?></head>
<body>
<!-- these two spans help the menu load faster-->
<span class="preload1"></span>
<span class="preload2"></span>

    <div id="header"></div>
    <ul class="menu">
        <li><a href="/"><span>Home</span></a></li>
<?php
menu_items();
?>    </ul>

<div id="main">
<?php
content(); 
?>
</div>
<div id="footer">
	<div class="copyright"><?php include(MONEY_APP.'inc/copyright.inc');?></div>
	<div class="version">AKCMoney <?php include(MONEY_APP.'inc/version.inc');?></div>
</div>

</body>
</html>

