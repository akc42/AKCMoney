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

setcookie ("akcmoney", "", time() - 3600); //delete the cookie
unset($user);

function head_content() {

?>
	<title>AKC Money Domain Manager</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the Logoff Page"/>	
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
<?php
}

function content() {
?><h1>Log Off</h1>
<p>You have been logged off from the current application.  Select from a menu item above and it will attempt to log you on</p>
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

