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
session_start();
require_once('./inc/db.inc');
if(isset($_REQUEST['domain'])) $_SESSION['domain'] = $_REQUEST['domain'];
if(!isset($_SESSION['domain']) || isset($_REQUEST['refresh'])) {
    //First time through, or if a refresh requested
    $result = $db->query('SELECT default_domain,year_end,default_currency FROM config;');
    $row = $result->fetch(PDO::FETCH_ASSOC);
    $_SESSION['domain'] = $row['default_domain'];
    $_SESSION['default_currency'] = $row['default_currency'];
    $_SESSION['year_end'] = round($row['year_end']); //casts to an integer
    $_SESSION['year'] =  ((strftime('%m%d') > $_SESSION['year_end'])?1:0) + strftime('%Y');
    $result->closeCursor();
}

if(isset($_REQUEST['year'])) $_SESSION['year'] = round($_REQUEST['year']);


function head_content() {

?><title>AKCMoney Reporting Page</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money, either for a private individual or a small business.  This page
provides the reports that formally account for the transactions in an accounting sense.  Transactions have an account code applied, and it is this code
which allocates the transaction into the accounting system for a domain.  Different types of account allocate the transaction amount differently"/>
<meta name="keywords" content="
    <link rel="shortcut icon" type="image/png" href="favicon.ico" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<link rel="stylesheet" type="text/css" href="calendar/calendar.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="/money/money-ie.css"/>
    	<link rel="stylesheet" type="text/css" href="/money/calendar/calendar-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="mootools-1.2.4.4-money-yc.js"></script>
	<script type="text/javascript" src="utils.js" ></script>
	<script type="text/javascript" src="reports.js"></script>
	<script type="text/javascript" src="calendar/calendar.js" ></script>
<?php
}

function menu_items() {

?>      <li><a href="/money/index.php" target="_self" title="Account">Account</a></li>
        <li><a href="/money/reports.php" target="_self" title="Reports" class="current">Reports</a></li>
        <li><a href="/money/accounts.php" target="_self" title="Account Manager">Account Manager</a></li>
        <li><a href="/money/currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
        <li><a href="/money/config.php" target="_self" title="Config Manager">Config Manager</a></li>

<?php
}

function content() {
    global $db;
/* start and end times of the financial year */

$starttime = mktime(0,0,0,substr($_SESSION['year_end'],0,2),substr($_SESSION['year_end'],2)+1,$_SESSION['year']-1);
$endtime = mktime(23,59,59,substr($_SESSION['year_end'],0,2),substr($_SESSION['year_end'],2),$_SESSION['year']);
    $db->beginTransaction();
?><h1>Accounting Reports</h1>
<?php 
    if ($_SESSION['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
    } 
?>      <form id="selections" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post">
            <select id="domainsel" name="domain" tabindex="10">
<?php
    $result = $db->query('SELECT domain FROM account GROUP BY domain ORDER BY domain ASC');
    while($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>              <option <?php echo ($_SESSION['domain'] == $row['domain'])?'selected="selected"':'';?>><?echo $row['domain'];?></option>
<?php
    }
    $result->closeCursor();
?>          </select>
Year:
            <select id="yearsel" name="year" tabindex="20">

<?php
/*  There are two date complexities that have to be dealt with in this select statement.  Firstly, transactions 
    where the account_code is of type 'A' are going to be depreciated over 3 years - so the end date of any
    effect on accounts is 3 years after the transaction date.  Secondly, the accounting year end means that if the transaction
    occurs after the accounting year end, it needs to be considered to be in the next year
*/ 
    $stmt = $db->prepare("    
    SELECT
        strftime('%Y',min(
            CASE WHEN CAST (strftime('%m%d',xaction.date,'unixepoch') AS INTEGER) > ? THEN xaction.date + 31536000 
            ELSE xaction.date 
            END),'unixepoch') AS firstyear,
        strftime('%Y',max(
            CASE WHEN code.type = 'A' THEN
                CASE WHEN CAST (strftime('%m%d',xaction.date,'unixepoch') AS INTEGER) > ? THEN xaction.date + 126144000 
                ELSE xaction.date +94608000 
                END
            ELSE 
                CASE WHEN CAST (strftime('%m%d',xaction.date,'unixepoch') AS INTEGER) > ? THEN xaction.date + 31536000 
                ELSE xaction.date
                END
            END),'unixepoch') AS lastyear 
    FROM 
        xaction,
        code,
        account 
    WHERE 
        account.domain = ? AND (
        (src IS NOT NULL AND src = account.name AND srccode IS NOT NULL AND srccode = code.id) OR
        (dst IS NOT NULL AND dst = account.name AND dstcode IS NOT NULL AND dstcode = code.id))
    ");
    $stmt->execute(array($_SESSION['year_end'],$_SESSION['year_end'],$_SESSION['year_end'],$_SESSION['domain']));
    $row = $stmt->fetch(PDO::FETCH_ASSOC); 
    for( $year = $row['firstyear'] ; $year <= $row['lastyear'] ; $year++) {
?>              <option <?php if ($_SESSION['year'] == $year) echo 'selected="selected"';?>><?php echo $year; ?></option>
<?php
    }
    $stmt->closeCursor();
?>          </select>
        </form>
<script type="text/javascript">

window.addEvent('domready', function() {
// Set some useful values
    Utils.sessionKey = "<?php echo $_SESSION['key']; ?>";
    AKCMoney.Reports();
});
</script>

<h2>Account Code List</h2>
<div class="xaction heading">
    <div class="ref">Type</div>
    <div class="description">Account Code</div>
    <div class="amount">Totals</div>
    <div class="amount">Profit</div>
    <div class="codetype">Show/Hide</div>
</div>

<?php

/* The following sql statements rely on the application level restriction that an account code cannot be specified for
    both source and destination if the accounts for source and destination are both in the same domain.  This is managed in
    updatexaction.php
*/
    $profit = 0;
    $stmt = $db->prepare("
    SELECT
        c.id AS id, 
        c.type AS type, 
        c.description AS description,
        sum(t.dfamount) AS tamount
                  
    FROM 
        dfxaction AS t, account AS a, code AS c
    WHERE
        t.date >= ? AND t.date <= ? AND
        c.type = 'C' AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
    GROUP BY
        c.id
    ORDER BY c.id ASC
        ");
    $stmt->execute(array($starttime,$endtime,$_SESSION['domain']));
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $profit -= $row['tamount'];
?><div class="xaction balance">
    <div class="ref"><?php echo $row['type']; ?></div>
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="amount"><?php echo fmtAmount($row['tamount']); ?></div>
    <div class="amount"><?php echo fmtAmount($profit); ?></div>
    <div class="expand">
        <input type="hidden" value="<?php echo $row['id']; ?>" />
    </div>
</div>
<?php
    }
    $stmt->closeCursor();
/* This query is complex because we are depreciating the amount over 3 years, so the contribution to this years accounts is a proportion of the 
    three years that this accounting period covers.  It could be as much as a 3rd, but might be less if the three year period starts or ends
    within this accounting period. 283824000 is the number of seconds in 3 years
*/
    $stmt = $db->prepare("
    SELECT
        c.id AS id, 
        c.type AS type, 
        c.description AS description,
        sum(
            CASE 
                WHEN t.date < ? AND t.date + 94608000 >= ? THEN dfamount/3
                WHEN t.date >= ? THEN (CAST((? - t.date) AS REAL)/94608000) * dfamount
                ELSE (CAST((t.date + 94608000 - ?) AS REAL)/94608000) * dfamount
            END
        ) AS tamount
                  
    FROM 
        dfxaction AS t, account AS a, code AS c
    WHERE
        t.date >= ? - 283824000 AND t.date <= ? AND
        c.type = 'A' AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
    GROUP BY
        c.id
    ORDER BY c.id ASC
        ");
    $stmt->execute(array($starttime,$endtime,$starttime,$endtime,$starttime,$starttime,$endtime,$_SESSION['domain']));
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $profit -= $row['tamount'];
?><div class="xaction balance">
    <div class="ref"><?php echo $row['type']; ?></div>
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="amount"><?php echo fmtAmount($row['tamount']); ?></div>
    <div class="amount"><?php echo fmtAmount($profit); ?></div>
    <div class="expand">
        <input type="hidden" value="<?php echo $row['id']; ?>" />
    </div>
</div>
<?php
    }
    $stmt->closeCursor();
    $stmt = $db->prepare("
    SELECT
        c.id AS id, 
        c.type AS type, 
        c.description AS description,
        sum(t.dfamount) AS tamount
                  
    FROM 
        dfxaction AS t, account AS a, code AS c
    WHERE
        t.date >= ? AND t.date <= ? AND
        c.type = 'R' AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
    GROUP BY
        c.id
    ORDER BY c.id ASC
        ");
    $stmt->execute(array($starttime,$endtime,$_SESSION['domain']));
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $profit += $row['tamount'];
?><div class="xaction balance">
    <div class="ref"><?php echo $row['type']; ?></div>
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="amount"><?php echo fmtAmount($row['tamount']); ?></div>
    <div class="amount"><?php echo fmtAmount($profit); ?></div>
    <div class="expand">
        <input type="hidden" value="<?php echo $row['id']; ?>" />
    </div>
</div>
<?php
    }
    $stmt->closeCursor();
    $stmt = $db->prepare("
    SELECT
        c.id AS id, 
        c.type AS type, 
        c.description AS description,
        sum(
            CASE WHEN t.src = a.name THEN -t.dfamount
            ELSE t.dfamount
            END) AS tamount
                  
    FROM 
        dfxaction AS t, account AS a, code AS c
    WHERE
        t.date >= ? AND t.date <= ? AND
        c.type = 'B' AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
    GROUP BY
        c.id
    ORDER BY c.id ASC
        ");
    $stmt->execute(array($starttime,$endtime,$_SESSION['domain']));
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $profit -= $row['tamount'];
?><div class="xaction balance">
    <div class="ref"><?php echo $row['type']; ?></div>
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="amount"><?php echo fmtAmount($row['tamount']); ?></div>
    <div class="amount"><?php echo fmtAmount($profit); ?></div>
    <div class="expand">
        <input type="hidden" value="<?php echo $row['id']; ?>" />
    </div>
</div>
<?php
    }
    $stmt->closeCursor();

?><div class="xaction balance">
    <div class="ref"></div>
    <div class="description">Profit</div>
    <div class="amount">&nbsp;</div>
    <div class="amount"><?php echo fmtAmount($profit); ?></div>
</div>
<?php
    $db->commit();
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

