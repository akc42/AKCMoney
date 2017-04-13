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
function head_content() {

?><title>AKCMoney Error Page</title>
    <link rel="shortcut icon" type="image/png" href="favicon.ico" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="/money/money-ie.css"/>
	<![endif]-->
<?php
}

function menu_items() {
}

function content() {
    global $db;
?><h1>ERROR</h1>
<p class="error">Application encounted unrecoverable error please restart</p>
<p class="error">Error was &#8220;<?php echo $_GET['err']; ?>&#8221;</p>
<?php
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

