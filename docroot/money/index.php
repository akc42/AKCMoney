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
if(!isset($_SESSION['inc_dir'])) die('AKC Money - session timed out and I do not know what instance of the application you were running.  Please restart');
require_once($_SESSION['inc_dir'].'db.inc');

if(!isset($_SESSION['account']) || isset($_REQUEST['refresh'])) {
    //First time through, or if a refresh requested
    $row = $db->querySingle('SELECT * FROM config;',true);

    // if we are at home (IP ADDRESS = 192.168.0.*) then use home_account, else use extn_account as default
    $at = (preg_match('/192\.168\.0\..*/',$_SERVER['REMOTE_ADDR']))?'home':'extn';
    $_SESSION['account'] = $row[$at.'_account'];
    $_SESSION['demo'] = ($row['demo'] != 0);
    $_SESSION['repeat_interval'] = 86400*$row['repeat_days'];  // 86400 = seconds in day
    $_SESSION['default_currency'] = $row['default_currency'];
    $_SESSION['extn_account'] = $row['extn_account'];
    $_SESSION['home_account'] = $row['home_account'];
    $_SESSION['config_version'] = $row['version'];
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
	<script type="text/javascript" src="calendar/calendar.js" ></script>
	<script type="text/javascript" src="money.js" ></script>
<?php
}

function menu_items() {

?>      <li><a href="/money/index.php?key=<?php echo $_SESSION['key']; ?>" target="_self" title="Account" class="current">Account</a></li>
        <li><a href="/money/accounts.php?key=<?php echo $_SESSION['key']; ?>" target="_self" title="Account Manager">Account Manager</a></li>
        <li><a href="/money/currency.php?key=<?php echo $_SESSION['key']; ?>" target="_self" title="Currency Manager">Currency Manager</a></li>

<?php
}

function content() {
    global $db;
    $account = $_SESSION['account'];
    $repeattime = time() + $_SESSION['repeat_interval'];
    $db->exec("BEGIN");
?><h1>Account Data</h1>
<?php 
    if ($_SESSION['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
    } 
?>      <form id="accountsel" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post">
            <input type="hidden" name="key" value="<?php echo $_SESSION['key']; ?>" />
            <input type="hidden" name="tid" value="0" />
Account Name:		
            <select id="account" name="account" tabindex="300">
<?php
    $result = $db->query('SELECT name FROM account ORDER BY name ASC;');
    while($row = $result->fetchArray(SQLITE3_ASSOC)) {
?>            <option <?php echo ($account == $row['name'])?'selected = "selected"':'' ; ?> ><?php echo $row['name']; ?></option>
<?php
    }
    $result->finalize();

?>        </select>
        </form>	
		<div id="accountinfo">
			<div id="positive">
<?php
    $sql = 'SELECT a.name, bversion, dversion,balance,date, domain, a.currency, c.description AS cdesc, c.rate ';
    $sql .= 'FROM account AS a JOIN currency AS c ON a.currency = c.name ';
    $sql .= 'WHERE a.name = '.dbMakeSafe($account).';';

    if(!($row = $db->querySingle($sql,true))) {
?><h1>Problem with Account</h1>
<p>It appears that the account that is being requested is no longer in the database.  This is probably because someone
working in parallel with you has deleted it.  You can try to restart the software by
clicking <a href="<?php echo $_SERVER['PHP_SELF']; ?>?refresh=yes"><strong>here</strong></a>, but if that still fails then you should report the fault to
an adminstrator, informing them that you had a problem with account name <strong><?php echo $account; ?></strong> not being in the database</p>
<?php
        $db->exec("ROLLBACK");
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
    $crate = $row['rate'];
    if(!is_null($row['domain'])) {
?>              <span class="title">Domain:</span> <?php echo $row['domain'];
    }    
?>			</div> 
			<div id="currency">
				<span class="title">Currency for Account:</span> <span class="currency"><?php echo $currency ;?></span><br/>
				<?php echo $cdesc;?>
			</div>

		</div>
		<div class="buttoncontainer accountbuttons">
		    <input type="hidden" name="key" value="<?php echo $_SESSION['key']; ?>" />
		    <input type="hidden" name="account" value="<?php echo $account;?>" />
		    <input type="hidden" name="issrc" value="true" />
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
    var currentSelected = accountList.getElement('option[selected]'); //remove this account
    currentSelected.destroy();
    var blankOption = new Element('option'); // and add a "selected" blank entry at top
    blankOption.set('selected','selected');
    blankOption.set('value','');
    blankOption.set('text','-- Select (Optional) Other Account --');
    blankOption.inject(accountList,'top');
// Insert this new list into the new transaction template
    accountList.inject($('xactiontemplate').getElement('.accountsel'));
// Now provide for jumping to new account when the select list changes
    $('account').addEvent('change', function(e) {
        e.stop();
        $('accountsel').submit();
    });
    AKCMoney.Account("<?php echo $account;?>","<?php echo $currency ;?>",<?php if(isset($_POST['tid'])) {echo $_POST['tid'];} else {echo '0';} ?>);
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
    <div class="description">Minimum Balance</div>
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

/*
    Deal with repeating entries, by copying any that are below the repeat threshold to their
    new repeat position, and removing the repeat flag from the current entry.
*/
    $repeats_to_do = true;
    while ($repeats_to_do) {
        $repeats_to_do = false; //lets be optimistic and plan to be done
        $sql ='SELECT * FROM xaction WHERE (src = '.dbMakeSafe($account).' OR dst = '.dbMakeSafe($account).')'; 
        $sql .= 'AND repeat <> 0 AND date < '.dbMakeSafe($repeattime).';';
        $result = $db->query($sql);
        while($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $db->exec('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = '.dbMakeSafe($row['id']).';');
            switch ($row['repeat']) {
                case 1:
                    $row['date'] += 604800 ;  //add on a week
                    break;
                case 2:
                    $row['date'] += 1209600 ; //add two weeks
                    break;
                case 3:
                    $row['date'] += date("t",$row['date']) * 86400 ; // a month (finds days in month and multiplies by seconds in a day)
                    break;
                case 4:
                    $row['date'] += date("t",mktime(0,0,0,date("m",$row['date'])+1,1,date("y",$row['date'])))*86400; //days in next month * seconds/day
                    break;
                case 5: 
                    $info = getdate($row['date']);
                    $row['date'] = mktime($info['hours'],$info['minutes'],$info['seconds'],$info['mon']+3,$info['mday'],$info['year']); //Quarterly
                    break;
                case 6:
                    $info = getdate($row['date']);
                    $row['date'] = mktime($info['hours'],$info['minutes'],$info['seconds'],$info['mon'],$info['mday'],$info['year']+1); //yearly
                    break;
               default:
                    $db->rollBack();
                    die('invalid repeat period in database, transaction id = '.$row['id']);
            }
            if ($row['date'] < $repeattime) $repeats_to_do = true; //still have to do some more after this, since this didn't finish the job
            $db->exec('INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
                     repeat, currency, amount, description)
                     VALUES ('.dbPostSafe($row['date']).','.dbPostSafe($row['src']).','.dbPostSafe($row['dst']).
                     ','.dbPostSafe($row['srcamount']).','.dbPostSafe($row['dstamount']).','.dbPostSafe($row['srccode']).','.dbPostSafe($row['dstcode']).
                     ','.dbPostSafe($row['rno']).','.dbPostSafe($row['repeat']).
                     ','.dbPostSafe($row['currency']).','.dbPostSafe($row['amount']).','.dbPostSafe($row['description']).');');
        }
        $result->finalize();
    }
    
//Having updated the entire account of repeated transactions, we now read and display everything
$locatedNow=false;
$r = 0;
?>
<div id="transactions">
<?php
    $sql = 'SELECT xaction.*, currency.name AS cname, currency.rate AS rate, srcacc.domain AS srcdom, dstacc.domain AS dstdom, ';
    $sql .= 'sc.type AS sct, sc.description AS scd, dc.type AS dct, dc.description AS dcd  FROM xaction,currency ';
    $sql .= 'LEFT JOIN code AS sc ON sc.id = xaction.srccode LEFT JOIN code AS dc ON dc.id = xaction.dstcode ';
    $sql .= 'LEFT JOIN account AS srcacc ON xaction.src = srcacc.name LEFT JOIN account AS dstacc ON xaction.dst = dstacc.name ';
    $sql .= 'WHERE xaction.currency = currency.name ';
    $sql .= 'AND (src = '.dbMakeSafe($account).' OR dst = '.dbMakeSafe($account).') ORDER BY date ASC;';
    $result = $db->query($sql);
    while($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $r++;
        $cleared = false;
        $dual = false;
        $codetype = '';
        $codedesc = '';
        $codeid = 0;
        if($row['src'] == $account) {
            if(!is_null($row['srcamount'])) {
                -$amount = $row['srcamount'];//if this is a source account we are decrementing the balance with a positive value
            } else {
                if($row['currency'] != $currency) {
                    $amount = -$row['amount']*$crate/$row['rate'];
                } else {
                    $amount = -$row['amount'];
                }
            }
            if ($row['srcclear'] != 0) $cleared = true;
            if (!is_null($row['dst'])) $dual = true;
            if (!is_null($row['srccode'])) {
                $codeid = $row['srccode'];
                $codetype = $row['sct'];
                $codedesc = $row['scd'];
            } elseif (!is_null($row['dstcode']) && $row['srcdom'] == $row['dstdom'] ) {
            /* if the dst account is in the same domain as the src account, then we can borrow the dst account code */
                $codeid = $row['dstcode'];
                $codetype = $row['dct'];
                $codedesc = $row['dcd'];
            }
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
            if ($row['dstclear'] !=0 ) $cleared = true;
            if (!is_null($row['src'])) $dual = true;
            if (!is_null($row['dstcode'])) {
                $codeid = $row['dstcode'];
                $codetype = $row['dct'];
                $codedesc = $row['dcd'];
            } elseif (!is_null($row['srccode']) && $row['srcdom'] == $row['dstdom'] ) {
            /* if the src account is in the same domain as the dst account, then we can borrow the src account code */
                $codeid = $row['srccode'];
                $codetype = $row['sct'];
                $codedesc = $row['scd'];
            }
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
        <div class="codetype">
            <div class="code_<?php echo $codetype; ?>">&nbsp;</div>
            <span class="codeid"><?php echo $codeid; ?></span>
            <span class="codedesc<?php if ($codeid==0) echo ' nocode';?>"><?php echo $codedesc; ?></span>
        </div>
    </div>
</div>
<?php
    }
    $result->finalize();
    if (!$locatedNow) {
?><div id="now" class="hidden"></div>
<?php
    }
?></div>
<div id="xactiontemplate" class="hidden xactionform"
    <input type="hidden" name="key" value="<?php echo $_SESSION['key']; ?>" />
    <input type="hidden" name="tid" value="0"/>
    <input type="hidden" name="version" value="0" />
    <input type="hidden" name="accounttype" value="src"/>
    <input type="hidden" name="accountname" value="<?php echo $account;?>" />
    <input type="hidden" name="acchange" value="0" />
    <input type="hidden" name="move" value="0" />
    <div class="xaction irow">
        <div class="date" ><input type="hidden" name="xdate" value="0" /></div>
        <div class="ref"><input class="ref" type="text" name="rno" value="" tabindex="50"/></div>
        <div class="description"><input class=description type="text" name="desc" value="" tabindex="10"/></div>
        <div class="amount"><input class="amount" type="text" name="amount" value="0.00" tabindex="20"/></div>
        <div class="amount">
            <select name="currency" title="<?php echo $cdesc;?>" tabindex="30" >
<?php
    $sql = 'SELECT name, rate, display, priority, description FROM currency WHERE display = 1';
    $result = $db->query($sql.' ORDER BY priority ASC;');
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        if(!isset($_SESSION['dc_description'])  && $row['name'] == $_SESSION['default_currency']) $_SESSION['dc_description'] = $row['description'];
?>              <option value="<?php echo $row['name']; ?>" <?php
                        if($row['name'] == $currency) echo 'selected="selected"';?> rate="<?php
                            echo $row['rate']; ?>" title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
    }
    $result->finalize();
?>          </select>
        </div>
    </div>
    <div class="xaction irow">
        <div class="clearacc">
            <input type="checkbox" name="cleared" tabindex="40"/>
            <label for="cleared">Cleared</label>
        </div>
        <div class="repeatsel">
            <select name="repeat" tabindex="60" >
<?php
    $result = $db->query('SELECT * FROM repeat;');
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
?>              <option value="<?php echo $row['rkey']; ?>" <?php
                        if($row['rkey'] == 0) echo 'selected="selected"';?>><?php
                          echo $row['description']; ?></option>
<?php    
    }
    $result->finalize();
?>          </select>
        </div>
        <div class="codesel">
            <select name="code" tabindex="63">
                <option value="0" type="" selected="selected">-- Select (Optional) Account Code --</option>
<?php
    $result = $db->query('SELECT * FROM code ORDER BY id ASC;');
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
?>              <option value="<?php echo $row['id']; ?>" codetype="<?php echo $row['type']; ?>"><?php echo $row['description']; ?></option>
<?php
    }
    $result->finalize();
?>            </select>
        </div>
        <div class="codetype"></div>
        <div class="buttoncontainer">
            <a class="button setcurrency" title="set currency rate from this transaction" ><span><img src="set.png"/>Set Currency Rate</span></a>
        </div>
    </div>
    <div class="xaction brow">
        <div class="sellabel">Dst :</div>
        <div class="accountsel"></div>
        <div class="buttoncontainer switchaccounts">
            <a class="button switchsrcdst" title="switch source and destination accounts" ><span><img src="switch.png"/>Switch (S&lt;-&gt;D)</span></a>
        </div>
        <div class="amount crate">1.0</div>
        <div class="amount cumcopy">0.00</div>
    </div>
    <div class="xaction brow">
        <div class="buttoncontainer xactionactions">
            <a class="button revertxaction" title="close form and revert transaction" ><span><img src="revert.png"/>Cancel</span></a>
            <a class="button closeeditform" title="close form and save transaction" ><span><img src="save.png"/>Save and Close</span></a>
            <a class="button moveaccount" title="move to Dst account" ><span><img src="move.png"/>Move to Dst</span></a>
            <a class="button deletexaction" title="delete this transaction" ><span><img src="delete.png"/>Delete</span></a>
        </div>
        <div class="amount"><input class="amount" name="aamount" type="text" value="0.00" tabindex="200"/></div>
        <div class="amount"><?php echo $currency; ?></div>
    </div>
</div>

<?php
    $db->exec("COMMIT");
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/template.php'); 
?>

