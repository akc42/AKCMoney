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


if(!isset($_SESSION['key']) || isset($_REQUEST['refresh'])) {
// if we are at home (IP ADDRESS = 192.168.0.*) then use home_account, else use extn_account as default
    $result = dbQuery('SELECT * FROM config;');
    $row = dbFetch($result);
/* this should be identical to code in install.php - if you change it here, please change it there */
        if(!isset($row['db_version'])) {
// Database version is at version 1 (no version number in config table), so we need to update to version 2
            dbQuery(file_get_contents('update1.sql'));
            //Update config to have new version
            $row['db_version'] = 2;
        }
// TO BE ADDED WHEN THERE IS A NEXT UPDATE
        if($row['db_version'] < 3) { //update to version 3
            dbQuery(file_get_contents('update2.sql'));
            //Update config to have new version
            $row['db_version'] = 3;
//Now reread config - to pickup any changes made to it during the updgrades
            dbfree($result);
            $result = dbQuery('SELECT * FROM config;');
            $row = dbFetch($result);            
        } 
    $at = (preg_match('/192\.168\.0\..*/',$_SERVER['REMOTE_ADDR']))?'home':'extn';
	$_SESSION['account'] = $row[$at.'_account'];
	$_SESSION['demo'] = ($row['demo'] == 't');
    $_SESSION['repeat_interval'] = 86400*$row['repeat_days'];  // 86400 = seconds in day
    $_SESSION['default_currency'] = $row['default_currency'];
    $_SESSION['extn_account'] = $row['extn_account'];
    $_SESSION['home_account'] = $row['home_account'];
    $_SESSION['config_version'] = $row['version'];
    $charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~@#$%^*()_+-={}|][";
    $key='';
    for ($i=0; $i<30; $i++) $key .= $charset[(mt_rand(0,(strlen($charset)-1)))];
    $_SESSION['key'] = $key;
    dbFree($result);
}

if(isset($_REQUEST['account'])) $_SESSION['account'] = $_REQUEST['account'];

function head_content() {

?><title>AKC Money Main Transaction Page</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money, either for a private individual or a small business.  It 
consist of two main concepts, accounts which hold money, and transactions which transfer money from one account to another (or just to or from a
single account if the transaction is with the outside world).  Multiple currencies are supported, and can use exchange rates which are initially
estimated, but are then corrected when the actual value used in a transaction is known.  This is the second release, based on personal use over
the past 4 years and a third release is planned to allow multiple accounting as is typically seen in business (cash accounts versus management accounts"/>
<meta name="keywords" content="
    <link rel="icon" type="image/png" href="favicon.png" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<link rel="stylesheet" type="text/css" href="calendar/calendar.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
    	<link rel="stylesheet" type="text/css" href="calendar/calendar-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="/js/mootools-1.2.4-core-nc.js"></script>
	<script type="text/javascript" src="mootools-1.2.4.4-money-yc.js"></script>
	<script type="text/javascript" src="utils.js" ></script>
	<script type="text/javascript" src="calendar/calendar.js" ></script>
	<script type="text/javascript" src="money.js" ></script>
<?php
}

function menu_items() {

?>      <li><a href="index.php" target="_self" title="Account" class="current">Account</a></li>
        <li><a href="accounts.php" target="_self" title="Account Manager">Account Manager</a></li>
        <li><a href="currency.php" target="_self" title="Currency Manager">Currency Manager</a></li>

<?php
}

function content() {

$account = $_SESSION['account'];
$repeattime = time() + $_SESSION['repeat_interval'];

?><h1>Account Data</h1>
<?php 
if ($_SESSION['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
} 
?>      <form id="accountsel" action="index.php" method="post">
Account Name:		
            <select id="account" name="account" tabindex="300">
<?php
$result = dbQuery('SELECT name FROM account ORDER BY name ASC;');
while ($row = dbFetch($result) ) {
?>            <option <?php echo ($account == $row['name'])?'selected = "selected"':'' ; ?> ><?php echo $row['name']; ?></option>
<?php
}
dbfree($result);
?>        </select>
        </form>	
		<div id="accountinfo">
			<div id="positive">
<?php
$sql = 'SELECT a.name, a.atype, bversion, dversion,balance,date,a.currency, c.description AS cdesc, t.description AS adesc, c.rate ';
$sql .= 'FROM account AS a JOIN account_type AS t ON a.atype = t.atype JOIN currency AS c ON a.currency = c.name ';
$sql .= 'WHERE a.name = '.dbMakeSafe($account).';';
$result = dbQuery($sql);
if(!($row = dbFetch($result))) {
?><h1>Problem with Account</h1>
<p>It appears that the account that is being requested is no longer in the database.  This is probably because someone
working in parallel with you has deleted it.  You can try to restart the software by
clicking <a href="index.php?refresh=yes"><strong>here</strong></a>, but if that still fails then you should report the fault to
an adminstrator, informing them that you had a problem with account name <strong><?php echo $account; ?></strong> not being in the database</p>
<?php
    return;
}
$currency = $row['currency'];
$_SESSION['currency'] = $currency;
$balance = $row['balance'];
$bdate = $row['date'];
$cdesc = $row['cdesc'];
$cumbalance = $balance;
$clrbalance = $balance;
$minbalance = $balance;
$maxbalance = $balance;
$atype = $row['atype'];
$crate = $row['rate'];
echo $row['adesc'];
?>			</div> 
			<div id="currency">
				<span class="title">Currency for Account:</span> <span class="currency"><?php echo $currency ;?></span><br/>
				<?php echo $cdesc;?>
			</div>

		</div>
		<div class="buttoncontainer accountbuttons">
		    <input type="hidden" name="key" value="<?php echo $_SESSION['key']; ?>" />
		    <input type="hidden" name="account" value="<?php echo $account;?>" />
		    <input type="hidden" name="issrc" value="<?php echo ($atype == 'Debit ')?'true':'false';?>" />
		    <input type="hidden" name="currency" value="<?php echo $currency; ?>" />
		    <input id="bversion" type="hidden" name="bversion" value="<?php echo $row['bversion'];?>" />
            <a id="new" class="button" tabindex="310"><span><img src="add.png"/>New Transaction</span></a>
            <a id="rebalance" class="button" tabindex="320"><span><img src="balance.png"/>Rebalance From Cleared</span></a>
        </div>

<script type="text/javascript">
var thisAccount;

window.addEvent('domready', function() {
    
// Set some useful values
    Utils.sessionKey = "<?php echo $_SESSION['key']; ?>";
    Utils.defaultCurrency = "<?php echo $_SESSION['default_currency'];?>";
//Turn all dates to the correct local time
    Utils.dateAdjust($('balance'),'dateawait','dateconvert');
    Utils.dateAdjust($('transactions'),'dateawait','dateconvert');
//It is easier to use Javascript than PHP to create a copy of the account selection list and place it in the transaction editing template
    var accountList = $('account').clone();
    accountList.set('tabindex',"70");
    var isSrcAccount = <?php echo ($atype == 'Debit ')?'true':'false';?> ;
    var currentSelected = accountList.getElement('option[selected]'); //remove this account
    currentSelected.destroy();
    var blankOption = new Element('option'); // and add a "selected" blank entry at top
    blankOption.set('selected','selected');
    blankOption.inject(accountList,'top');
// Insert this new list into the new transaction template
    accountList.inject($('xactiontemplate').getElement('.accountsel'));
// Now provide for jumping to new account when the select list changes
    $('account').addEvent('change', function(e) {
        e.stop();
        $('accountsel').submit();
    });
    AKCMoney.Account("<?php echo $account;?>","<?php echo $currency ;?>",isSrcAccount);
});
</script>

<h2>Transaction List</h2>
<div class="xaction heading">
    <div class="date">Date</div>
    <div class="ref">Ref</div>
    <div class="description">Description</div>
    <div class="amount">Amount</div>
    <div class="amount">Balance</div>
</div>
<div class="xaction balance">
    <div class="date">&nbsp;</div>
    <div class="ref">&nbsp;</div>
    <div class="description"><?php echo ($atype == 'Debit ')?'Minimum':'Maximum';?> Balance</div>
    <div class="amount">&nbsp;</div>
    <div id="minmaxbalance" class="amount">0.00</div>
</div>
<div class="xaction balance">
    <div class="date">&nbsp;</div>
    <div class="ref">&nbsp;</div>
    <div class="description">Cleared Balance</div>
    <div class="amount">&nbsp;</div>
    <div id="clrbalance" class="amount">0.00</div>
</div>
<div id="balance" class="xaction balance row">
    <input type="hidden" name="key" value="<?php echo $_SESSION['key']; ?>" />
    <input type="hidden" name="clearing" value="false" />
    <input type="hidden" name="bversion" value="<?php echo $row['bversion'];?>"/>
    <div class="date"><input type="hidden" name="bdate" value="<?php echo $bdate?>" class="dateawait" /></div>
    <div class="ref">&nbsp;</div>
    <div class="description">Opening Balance</div>
    <div class="amount">&nbsp;</div>
    <div  class="amount">
        <input  id="openbalance" class="amount" type="text" name="openbalance" 
                value="<?php echo fmtAmount($balance);?>" tabindex="280"/>
    </div>
</div>

<?php
dbFree($result);

/*
    Deal with repeating entries, by copying any that are below the repeat threshold to their
    new repeat position, and removing the repeat flag from the current entry.
*/
$repeats_to_do = true;
while ($repeats_to_do) {
    $repeats_to_do = false; //lets be optimistic and plan to be done
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
        if ($row['date'] < $repeattime) $repeats_to_do = true; //still have to do some more after this, since this didn't finish the job
        dbQuery('INSERT INTO transaction (date, src, dst, version, rno, srcclear, dstclear, srcamount, dstamount, 
                 repeat, currency, amount, description)
                 VALUES ('.dbPostSafe($row['date']).','.dbPostSafe($row['src']).','.dbPostSafe($row['dst']).', DEFAULT,'.dbPostSafe($row['rno']).
                 ','.dbPostBoolean($row['srcclear']).','.dbPostBoolean($row['dstclear']).','.dbPostSafe($row['srcamount']).
                 ','.dbPostSafe($row['dstamount']).','.dbPostSafe($row['repeat']).
                 ','.dbPostSafe($row['currency']).','.dbPostSafe($row['amount']).','.dbPostSafe($row['description']).');');
    }
    dbQuery('COMMIT;');
    dbFree($result);
}
//Having updated the entire account of repeated transactions, we now read and display everything
$locatedNow=false;
$result = dbQuery('SELECT transaction.*, currency.name AS cname, currency.rate AS rate FROM transaction,currency WHERE transaction.currency = currency.name AND (src = '.dbMakeSafe($account).' OR dst = '.dbMakeSafe($account).') ORDER BY date ASC;');
$r = 0;
?>
<div id="transactions">
<?php
while ($row = dbFetch($result)) {
    $r++;
    $cleared = false;
    $dual = false;
    if($row['src'] == $account) {
        if(!is_null($row['srcamount'])) {
            $amount = $row['srcamount'];//if this is a source account we are decrementing the balance with a positive value
        } else {
            if($row['currency'] != $currency) {
                $amount = -$row['amount']*$crate/$row['rate'];
            } else {
                $amount = -$row['amount'];
            }
        }
        if ($row['srcclear'] == 't') $cleared = true;
        if (!is_null($row['dst'])) $dual = true;
    } else {
        if(!is_null($row['dstamount'])) {
            $amount = $row['dstamount'];
        } else {
            if($row['currency'] != $currency) {
                $amount = $row['amount']*$crate/$row['rate'];
            } else {
                $amount = $row['amount'];
            }
        }
        if ($row['dstclear'] == 't') $cleared = true;
        if (!is_null($row['src'])) $dual = true;
    }
    $cumbalance += $amount;
    if (!$locatedNow && $row['date'] > time()) {
        $locatedNow=true;
?><div id="now" class="hidden"></div>
<?php
    }
?><div id="<?php echo 't'.$row['id']; ?>" class="xaction arow<?php if($r%2 == 0) echo ' even';?>">
    <div class="wrapper">    
        <input type="hidden" class="version" name="version" value="<?php echo $row['version']; ?>"/>
        <div class="date clickable<?php 
        if($row['repeat'] != 0) {
            echo " repeat";
            if($cleared) $clrbalance += $amount; //do this because in this case we would otherwise miss it
        } elseif($cleared) {
            $clrbalance += $amount;
            echo " cleared";
        } else {
            if ($row['date'] < time()) echo " passed"; //only indicate passed if not indicating cleared
        }
       ?>" ><input type="hidden" name="xxdate" value="<?php echo $row['date'];?>" class="dateawait"/></div>
        <div class="ref"><?php echo $row['rno'];?></div>
        <div class="description clickable<?php if ($dual) echo " dual";?>"><?php echo $row['description'];?></div>
        <div class="amount aamount<?php 
            if($currency != $row['currency']) {
                echo " foreign";
            } else {
                echo " clickable";
            };
            if ($dual) echo " dual";?>"><?php echo fmtAmount($amount);?></div>
        <div class="amount cumulative<?php if ($dual) echo " dual";?>"><?php echo fmtAmount($cumbalance);?></div>
    </div>
</div>
<?php
}
dbFree($result);
if (!$locatedNow) {
?><div id="now" class="hidden"></div>
<?php
}
?></div>
<div id="xactiontemplate" class="hidden xactionform"
    <input type="hidden" name="key" value="<?php echo $_SESSION['key']; ?>" />
    <input type="hidden" name="tid" value="0"/>
    <input type="hidden" name="version" value="0" />
    <input type="hidden" name="accounttype" value="<?php echo ($atype == 'Debit ')?'src':'dst';?>"/>
    <input type="hidden" name="accountname" value="<?php echo $account;?>" />
    <input type="hidden" name="acchange" value="0" />
    <div class="xaction irow">
        <div class="date" ><input type="hidden" name="xdate" value="0" /></div>
        <div class="ref"><input class="ref" type="text" name="rno" value="" tabindex="50"/></div>
        <div class="description"><input class=description type="text" name="desc" value="" tabindex="10"/></div>
        <div class="amount"><input class="amount" type="text" name="amount" value="0.00" tabindex="20"/></div>
        <div class="amount">
            <select name="currency" title="<?php echo $cdesc;?>" tabindex="30" >
<?php
$sql = 'SELECT name, rate, display, priority, description FROM currency WHERE display = true';
$result=dbQuery($sql.' ORDER BY priority ASC;');
while($row = dbFetch($result)) {
    if(!isset($_SESSION['dc_description'])  && $row['name'] == $_SESSION['default_currency']) $_SESSION['dc_description'] = $row['description'];
?>              <option value="<?php echo $row['name']; ?>" <?php
                        if($row['name'] == $currency) echo 'selected="selected"';?> rate="<?php
                            echo $row['rate']; ?>" title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
}
dbFree($result);
?>          </select>
        </div>
    </div>
    <div class="xaction irow">
        <div class="clearacc">
            <input type="checkbox" name="cleared" tabindex="40"/>
            <label for="cleared">Cleared</label>
        </div>
        <div class="spacer1"></div>
        <div class="buttoncontainer switchaccounts">
            <a class="button switchsrcdst" title="switch source and destination accounts" ><span><img src="switch.png"/>Switch Accounts (S&lt;-&gt;D)</span></a>
        </div>
        <div class="repeatsel">
            <select name="repeat" tabindex="60" >
<?php
$result=dbQuery('SELECT * FROM repeat;');
while($row = dbFetch($result)) {
?>              <option value="<?php echo $row['rkey']; ?>" <?php
                        if($row['rkey'] == 0) echo 'selected="selected"';?>><?php
                          echo $row['description']; ?></option>
<?php    
}
dbFree($result);
?>          </select>
        </div>
        <div class="buttoncontainer">
            <a class="button setcurrency" title="set currency rate from this transaction" ><span><img src="set.png"/>Set Currency Rate</span></a>
        </div>
    </div>
    <div class="xaction brow">
        <div class="sellabel"><?php echo ($atype == 'Debit ')?'Dst :':'Src :';?></div>
        <div class="accountsel"></div>
        <div class="amount crate">1.0</div>
        <div class="amount cumcopy">0.00</div>
    </div>
    <div class="xaction brow">
        <div class="buttoncontainer xactionactions">
            <a class="button revertxaction" title="close form and revert transaction" ><span><img src="revert.png"/>Cancel</span></a>
            <a class="button closeeditform" title="close form and save transaction" ><span><img src="save.png"/>Save and Close</span></a>
            <a class="button deletexaction" title="delete this transaction" ><span><img src="delete.png"/>Delete This Transaction</span></a>
        </div>
        <div class="amount"><input class="amount" name="aamount" type="text" value="0.00" tabindex="200"/></div>
        <div class="amount"><?php echo $currency; ?></div>
    </div>
</div>

<?php
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/template.php'); 
?>

