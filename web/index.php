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
if (!file_exists(dirname(__FILE__) . '/settings.php')) header('Location: install.php'); //So install it

session_start();

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');


if(!isset($_SESSION['account'])) {
// if we are at home (IP ADDRESS = 192.168.1.*) then use home_account, else use extn_account as default
    $result = dbQuery('SELECT * FROM config;');
    $row = dbFetch($result);
    $at = (preg_match('/192\.168\.1\..*/',$_SERVER['REMOTE_ADDR']))?'home':'extn';
	$_SESSION['account'] = $row[$at.'_account'];
	$_SESSION['demo'] = ($row['demo'] == 't');
    $_SESSION['repeat_interval'] = 86400*$row['repeat_days'];  // 86400 = seconds in day
    $_SESSION['default_currency'] = $row['default_currency'];
    dbFree($result);
}

$account = $_SESSION['account'];
$repeattime = time() + $_SESSION['repeat_interval'];

?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>AKC Money Account Page</title>
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
	<script type="text/javascript" src="/js/mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="/js/DateUtils.js"></script>
	<script type="text/javascript" src="money.js" ></script>
</head>
<body>
    <div id="header"></div>
    <ul id="menu">
        <li><a href="index.php" target="_self" title="Account" class="current">Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>
    </ul>

<div id="main">
    <h1>Account Data</h1>
<?php 
if ($_SESSION['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
} 
?>      <div id="accountsel">
Account Name:		
            <select id="account">
<?php
$result = dbQuery('SELECT name FROM account ORDER BY name ASC;');
while ($row = dbFetch($result) ) {
?>            <option <?php echo ($account == $row['name'])?'selected = "selected"':'' ; ?> ><?php echo $row['name']; ?></option>
<?php
}
dbfree($result);
?>        </select>
        </div>	
		<div id="accountinfo">
			<div id="positive">
<?php
$sql = 'SELECT a.name, a.atype, bversion,balance,date ,a.currency, c.description AS cdesc, t.description AS adesc, c.rate ';
$sql .= 'FROM account AS a JOIN account_type AS t ON a.atype = t.atype JOIN currency AS c ON a.currency = c.name ';
$sql .= 'WHERE a.name = '.dbMakeSafe($account).';';
$result = dbQuery($sql);
if(! ($row = dbFetch($result))) die ('failed to read account data');
$currency = $row['currency'];
$balance = $row['balance'];
$bdate = $row['date'];
$cumbalance = $balance;
$clrbalance = $balance;
$minbalance = $balance;
$maxbalance = $balance;
$crate = $row['rate'];
echo $row['adesc'];
?>			</div> 
			<div id="currency">
				<span class="title">Currency for Account:</span> <span class="currency"><?php echo $currency ;?></span><br/>
				<?php echo $row['cdesc'];?>
			</div>

		</div>
		<div class="buttoncontainer">
            <a href="#" class="button"><span><img src="add.png"/>New Transaction</span></a>
            <a href="#" class="button"><span><img src="balance.png"/>Rebalance From Cleared</span></a>
        </div>

<script type="text/javascript">
var myAccount;
var myMoney;
window.addEvent('domready', function() {
    DateUtils.adjustDates($('transactions'),true); //Adjust dates to display date (only)
<?php 
if ($row['atype'] == 'Debit ') {
?>
    $('minbalance').set('text',myAccount.getMinBalance());
<?php
} else {
?>
    $('maxbalance').set('text',myAccount.getMaxBalance());
<?php
}
?>
    $('clrbalance').set('text',myAccount.getClearedBalance()); 
    $('openbalance').value = myAccount.getOpeningBalance(); 
    myMoney = new Money({
        account:myAccount,
        accountList: $('account'),
        currencyList:$('currencyList')
    });
});
</script>


<table id="transactions" >
    <caption>Transaction List</caption>
    <thead>
        <tr id="accountHead">
            <th class="date">Date</th>
            <th class="ref">Ref</th>
            <th class="description">Description</th>
            <th class="amount">Amount</th>
            <th class="amount">Balance</th>
        </tr>
    </thead>
    <tbody>
        <tr class="balance">
            <td></td><td></td>
<?php 
if ($row['atype'] == 'Debit ') {
?>          <td>Minimum Balance</td>
            <td></td>
            <td id="minbalance"></td>
<?php
} else {    
?>          <td>Minimum Balance</td>
            <td></td>
            <td id="maxbalance"></td>
<?php
}
?>      </tr>
        <tr class="balance">
            <td></td><td></td>
            <td>Cleared Balance</td>
            <td></td>
            <td id="clrbalance"></td>
        </tr>
        <form action="#" method="post">
            <input type="hidden" name="bversion" value="<?php echo $row['bversion'];?>"/>
            <tr class="balance">
                <td class="utime"><?php echo $bdate;?></td>
                <td></td>
                <td>Opening Balance</td>
                <td></td>
                <td><input id="openbalance" type="text" name="openbalance" value=""/></td>
            </tr>
        </form>
<?php
dbFree($result);

/*
    Deal with repeating entries, by copying any that are below the repeat threshold to their
    new repeat position, and removing the repeat flag from the current entry.
*/

dbQuery('BEGIN;');  // Start transaction, because we may have to update repeat entries
$sql ='SELECT * FROM transaction WHERE (src = '.dbMakeSafe($account).' OR dst = '.dbMakeSafe($account).')'; 
$sql .= 'AND repeat <> 0 AND date < '.dbMakeSafe($repeattime).';';
$result = dbQuery($sql);
while ($row = dbFetch($result)) {
    dbQuery('UPDATE transaction SET version = DEFAULT, repeat = 0 WHERE id = '.dbMakeSafe($row['id']).';');
    switch ($row['repeat']) {
        case 1:
            $row['date'] += 1304800 ;  //add on a week
            break;
        case 2:
            $row['date'] += 2609600 ; //add two weeks
            break;
        case 3:
            $row['date'] += date("t",$row['date']) * 86400 ; // a month (finds days in month and multiplies by seconds in a day)
            break;
        case 4:
            $row['date'] += date("t",mktime(0,0,0,date("m",$row['date'])+1,1,date("y",$row['date'])))*86400; //days in next month * seconds/day
            break;
        case 5: 
            $info = getdate($row['date']);
            $row['date'] = mktime($info['hours'],$info['minutes'],$info['seconds'],$info['mday'],$info['mon']+3,$info['year']); //Quarterly
            break;
        case 6:
            $info = getdate($row['date']);
            $row['date'] = mktime($info['hours'],$info['minutes'],$info['seconds'],$info['mday'],$info['mon'],$info['year']+1); //Quarterly
            break;
       default:
            dbQuery('ROLLBACK');
            die('invalid repeat period in database, transaction id = '.$row['id']);
    }
    dbQuery('INSERT INTO transaction (date, src, dst, version, rno, srcclear, dstclear, namount, repeat, currency, amount, description)
             VALUES ('.dbMakeSafe($row['date']).','.dbMakeSafe($row['src']).','.dbMakeSafe($row['dst']).', DEFAULT,'.dbMakeSafe($row['rno']).
             ','.dbMakeSafe($row['srcclear']).','.dbMakeSafe($row['dstclear']).','.dbMakeSafe($row['namount']).','.dbMakeSafe($row['repeat']).
             ','.dbMakeSafe($row['currency']).','.dbMakeSafe($row['amount']).','.dbMakeSafe($row['description']).';');
}
dbQuery('COMMIT;');
dbFree($result);

//Having updated the entire account of repeated transactions, we now read and display everything

$result = dbQuery('SELECT * FROM transaction WHERE src = '.dbMakeSafe($account).' OR dst = '.dbMakeSafe($account).';');
$r = 0;
while ($row = dbFetch($result)) {
    $r++;
    if($row['currency'] == $currency) {  //if currency the same than can use the raw amount, otherwise we take the normalised value
        $amount = $row['amount'];
        $cur = '';
        $cam = '';
    } else {
        $amount = $row['namount'];
        $cur = $row['currency'];
        $cam = $row['amount'];
    }
    $cleared = false;
    if($row['src'] == $account) {
        $amount = -$amount;  //if this is a source account we are decrementing the balance with a positive value
        if ($row['srcclear'] == 't') $cleared = true;
    } else {
        if ($row['dstclear'] == 't') $cleared = true;
    }
    $cumbalance += $amount;
    $minbalance = min($minbalance,$cumbalance);
    $maxbalance = max($maxbalance,$cumbalance);
?>      <tr <?php if($r%2 == 0) echo 'class="even"'; ?> >
            <td <?php if($cleared) {$clrbalance += $amount; echo 'class="cleared utime"';} else {echo 'class="utime"';} ?> ><?php echo $row['date'];?></td>
            <td><?php echo $row['rno'];?></td><td class="desc"><?php echo $row['description'];?></td>
            <td class="amount"><?php echo $amount;?></td><td class="amount"><?php echo $cumbalance;?></td>
        </tr>
        <tr class="hidden">
            <td></td>
        </tr>
<?php
}
dbFree($result);
?>    </tbody>   
</table>
</div>
<script type="text/javascript">
    myAccount = new Account({
        name:'<?php echo $account;?>',
        balances:{
            min:<?php echo $minbalance;?>,
            max:<?php echo $maxbalance;?>,
            cleared:<?php echo $clrbalance;?>,
            opening:<?php echo $balance;?>
        },
        currency:{
            name:'<?php echo $currency;?>',
            rate:<?php echo $crate;?>
        }
    });
</script>            
<select id="currencyList" class="hidden">
<?php
$sql = 'SELECT name, rate, display, priority FROM currency WHERE display = true';
if ($currency != $_SESSION['default_currency']) {
    $sql .=' AND (name = '.dbMakeSafe($currency).' OR name = '.dbMakeSafe($_SESSION['default_currency']);
}
$result=dbQuery($sql.' ORDER BY priority ASC;');
while($row = dbFetch($result)) {
?>            <option><?php echo $row['name']; ?><span class="hidden"><?php echo $row['rate']; ?></span></option>
<?php    
}
dbFree($result);
?>
</select>
<div id="footer">
	<div id="copyright">
		<p>AKCMoney is copyright &copy; 2003-2009 Alan Chandler. Visit
		<a href="http://www.chandlerfamily.org.uk/software/">http://www.chandlerfamily.org.uk/software/</a> to obtain a copy</p>
	</div>
	<div id="version"><?php include('version.php');?></div>
</div>

</body>
</html>

