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
session_start();
require_once('./inc/db.inc');

function head_content() {

?><title>AKCMoney Configruation Page</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money, either for a private individual or a small business.  It 
consist of two main concepts, accounts which hold money, and transactions which transfer money from one account to another (or just to or from a
single account if the transaction is with the outside world).  Multiple currencies are supported, and can use exchange rates which are initially
estimated, but are then corrected when the actual value used in a transaction is known.  This is the second release, based on personal use over
the past 4 years and a third release is planned to allow multiple accounting as is typically seen in business (cash accounts versus management accounts"/>
<meta name="keywords" content="
    <link rel="shortcut icon" type="image/png" href="favicon.ico" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<link rel="stylesheet" type="text/css" href="calendar/calendar.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="/money/money-ie.css"/>
    	<link rel="stylesheet" type="text/css" href="/money/calendar/calendar-ie.css"/>
	<![endif]-->
	<script type="text/javascript" src="mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="mootools-1.2.4.4-money-yc.js"></script>
	<script type="text/javascript" src="utils.js" ></script>
	<script type="text/javascript" src="calendar/calendar.js" ></script>
<?php
}

function menu_items() {

?>      <li><a href="/money/index.php" target="_self" title="Account">Account</a></li>
        <li><a href="/money/reports.php" target="_self" title="Accounting">Accounting</a></li>
        <li><a href="/money/accounts.php" target="_self" title="Account Manager">Account Manager</a></li>
        <li><a href="/money/currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
        <li><a href="/money/accounting.php" target="_self" title="Accounting Manager" class="current">Accounting Manager</a></li>

<?php
}

function content() {
    global $db;

    $db->beginTransaction();
?><h1>Configuration Manager</h1>
<?php 
    if ($_SESSION['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
    } 

?><script type="text/javascript">

window.addEvent('domready', function() {
// Set some useful values
    Utils.sessionKey = "<?php echo $_SESSION['key']; ?>";
});
</script>


<?php
    $db->commit();
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

