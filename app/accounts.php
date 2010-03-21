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

function head_content() {

?>
	<title>AKC Money Account Page</title>
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->

<?php
}

function menu_items() {

?> 
        <li><a href="index.php" target="_self" title="Account">Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager" class="current">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
<?php
}
function content() {

}
require_once($_SERVER['DOCUMENT_ROOT'].'/template.php'); 
?>

