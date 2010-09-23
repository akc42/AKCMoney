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

require_once('./inc/db.inc');


if(isset($_GET['domain'])) {
	$domain = $_GET['domain'];
} else {
	$domain = $user['domain'];
}

$stmt = $db->prepare("
        SELECT d.name AS name FROM domain AS d, user AS u LEFT JOIN capability AS c ON c.uid = u.uid
        WHERE d.name = ? AND u.uid= ? AND ( c.domain = d.name OR u.isAdmin = 1) ORDER BY d.name COLLATE NOCASE ;
	");
$stmt->bindValue(1,$domain);
$stmt->bindValue(2,$user['uid']);

$db->beginTransaction();

$stmt->execute();

if($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	
	if($domain != $user['domain']) {
	//If changing domain (successfully) then we need to update our user
	    $user['domain'] = $domain;
	    updateUser();
	}
}
$stmt->closeCursor();    


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
	<script type="text/javascript" src="accounting.js"></script>
<?php
}


function content() {
	global $db,$user,$domain;
	if(isset($_POST['year'])) {
		$year = round($_POST['year']);
	} else {
		$year = round(date("Y"));
	}
	
	$result = $db->query("SELECT year_end FROM config LIMIT 1");
	$yearend = $result->fetchColumn();
	$result->closeCursor();

	/* start and end times of the financial year */

	$starttime = mktime(0,0,0,substr($yearend,0,2),substr($yearend,2)+1,$year-1);
	$endtime = mktime(23,59,59,substr($yearend,0,2),substr($yearend,2),$year);

?><h1>Accounting Reports</h1>
<?php 
    if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
    } 
?>      <form id="selections" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post">
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
    $stmt->execute(array($yearend,$yearend,$yearend,$domain));
    $row = $stmt->fetch(PDO::FETCH_ASSOC); 
    for( $yr = $row['firstyear'] ; $yr <= $row['lastyear'] ; $yr++) {
?>              <option <?php if ($year == $yr) echo 'selected="selected"';?>><?php echo $yr; ?></option>
<?php
    }
    $stmt->closeCursor();
?>          </select>
        </form>
		<div class="buttoncontainer accountbuttons">
            <a id="csv" href="generatecsv.php?&domain=<?php echo $domain; ?>&year=<?php echo $year;?>" class="button" tabindex="310"><span><img src="spreadsheet.png"/>Create CSV File</span></a>
        </div>

<script type="text/javascript">

window.addEvent('domready', function() {
    AKCMoney.Reports(<?php echo "'$domain' , $starttime , $endtime " ; ?>);
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
    $stmt->execute(array($starttime,$endtime,$domain));
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
    within this accounting period. 94608000 is the number of seconds in 3 years
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
        t.date >= ? - 94608000 AND t.date <= ? AND
        c.type = 'A' AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
    GROUP BY
        c.id
    ORDER BY c.id ASC
        ");
    $stmt->execute(array($starttime,$endtime,$starttime,$endtime,$starttime,$starttime,$endtime,$domain));
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
    $stmt->execute(array($starttime,$endtime,$domain));
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
    $stmt->execute(array($starttime,$endtime,$domain));
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

