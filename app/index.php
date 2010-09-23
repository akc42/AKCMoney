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
if(isset($_GET['account'])) {
	$account = $_GET['account'];
} else {
	$account = $user['account'];
}
$stmt = $db->prepare("SELECT a.name AS name, bversion, dversion,balance,date, repeat_days,a.domain AS domain, a.currency, c.description AS cdesc, c.rate 
                        FROM account AS a JOIN currency AS c ON a.currency = c.name,
                        user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
                        WHERE a.name = ? AND u.uid = ? AND (u.isAdmin = 1 OR c.domain = a.domain)
                        ORDER BY a.name COLLATE NOCASE");
$stmt->bindValue(1,$account);
$stmt->bindValue(2,$user['uid']);

$db->beginTransaction();

$stmt->execute();

if($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	
	if($account != $user['account']) {
	//If changing account (successfully) then we need to update our user
	    $user['account'] = $account;
	    updateUser();
	}
}
$stmt->closeCursor();    


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


function content() {
    global $db,$user,$account,$row;

?><h1><?php echo $account; ?></h1>
<?php 
    if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
    } 
?>
		<div id="accountinfo">
			<div id="positive">
<?php
	if(!$row) {
?><h1>Problem with Account</h1>
<p>It appears that the account that is being requested is no longer in the database.  This is probably because someone
working in parallel with you has deleted it.  You can try to restart the software by
selecting another account from the menu above, but if that still fails then you should report the fault to
an adminstrator, informing them that you had a problem with account name <strong><?php echo $account; ?></strong> not being in the database</p>
<?php
        $db->rollBack();
        return;
    }
    
    // if account is new, update user cookie to reflect it
    if($account != $user['account']) {
    	$user['account'] = $account;
    	updateUser();
    }
    $repeattime = time() + $row['repeat_days']*84600;
    $currency = $row['currency'];
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
<?php
	if($user['isAdmin']){
?>		<div class="buttoncontainer accountbuttons">
		    <input type="hidden" name="account" value="<?php echo $account;?>" />
		    <input type="hidden" name="issrc" value="true" />
		    <input type="hidden" name="currency" value="<?php echo $currency; ?>" />
		    <input id="bversion" type="hidden" name="bversion" value="<?php echo $row['bversion'];?>" />
            <a id="new" class="button" tabindex="310"><span><img src="add.png"/>New Transaction</span></a>
            <a id="rebalance" class="button" tabindex="320"><span><img src="balance.png"/>Rebalance From Cleared</span></a>
        </div>
<?php
	}
?><script type="text/javascript">
var thisAccount;

window.addEvent('domready', function() {
//Turn all dates to the correct local time
    Utils.dateAdjust($('balance'),'dateawait','dateconvert');
    Utils.dateAdjust($('transactions'),'dateawait','dateconvert');
<?php if($user['isAdmin']) {
?>    AKCMoney.Account("<?php echo $account;?>","<?php echo $currency ;?>",<?php if(isset($_POST['tid'])) {echo $_POST['tid'];} else {echo '0';} ?>);
<?php }
?>});
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
    $stmt = $db->prepare('SELECT * FROM xaction WHERE (src = ? OR dst = ? ) AND repeat <> 0 AND date < ? ;');
    $stmt->bindValue(1,$account);
    $stmt->bindValue(2,$account);
    $stmt->bindValue(3,$repeattime);
    $upd = $db->prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
    $ins = $db->prepare('INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
                     repeat, currency, amount, description)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?);');
    while ($repeats_to_do) {
        $repeats_to_do = false; //lets be optimistic and plan to be done
        $stmt->execute();
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $upd->bindValue(1,$row['id']);
            $upd->execute();
            $upd->closeCursor();
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
            $ins->execute(array($row['date'],$row['src'],$row['dst'],$row['srcamount'],$row['dstamount'],$row['srccode'],$row['dstcode'],
                                $row['rno'],$row['repeat'],$row['currency'],$row['amount'],$row['description']));
            $ins->closeCursor();
        }
        $stmt->closeCursor();
    }
    
//Having updated the entire account of repeated transactions, we now read and display everything
$locatedNow=false;
$r = 0;
?>
<div id="transactions">
<?php
    $stmt = $db->prepare('
        SELECT 
            xaction.*, currency.name AS cname, currency.rate AS rate, srcacc.domain AS srcdom, dstacc.domain AS dstdom,
            sc.type AS sct, sc.description AS scd, dc.type AS dct, dc.description AS dcd  
        FROM xaction,currency 
        LEFT JOIN code AS sc ON sc.id = xaction.srccode 
        LEFT JOIN code AS dc ON dc.id = xaction.dstcode 
        LEFT JOIN account AS srcacc ON xaction.src = srcacc.name 
        LEFT JOIN account AS dstacc ON xaction.dst = dstacc.name 
        WHERE xaction.currency = currency.name AND (src = ? OR dst = ?) ORDER BY date ASC;');
    $stmt->bindValue(1,$account);
    $stmt->bindValue(2,$account);
    $stmt->execute();
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
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
            echo ' repeat';
            if($cleared) $clrbalance += $amount; //do this because in this case we would otherwise miss it
        } elseif($cleared) {
            $clrbalance += $amount;
            echo ' cleared';
        } else {
            if ($row['date'] < time()) echo ' passed'; //only indicate passed if not indicating cleared
        }
       ?>" ><input type="hidden" name="xxdate" value="<?php echo $row['date'];?>" class="dateawait"/></div>
        <div class="ref"><?php echo $row['rno'];?></div>
        <div class="description clickable<?php if ($dual) echo " dual";?>"><?php echo $row['description'];?></div>
        <div class="amount aamount<?php 
            if($currency != $row['currency']) {
                echo ' foreign';
            } else {
                echo ' clickable';
            };
            if ($dual) echo ' dual';?>"><?php echo fmtAmount($amount);?></div>
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
    $stmt->closeCursor();
    if (!$locatedNow) {
?><div id="now" class="hidden"></div>
<?php
    }
?></div>
<?php
	if($user['isAdmin']) {
?><div id="xactiontemplate" class="hidden xactionform"
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
		$result = $db->query('SELECT name, rate, display, priority, description FROM currency WHERE display = 1 ORDER BY priority ASC;');
		while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>              <option value="<?php echo $row['name']; ?>" <?php
            if($row['name'] == $currency) echo 'selected="selected"';?> rate="<?php
                echo $row['rate']; ?>" title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
	    }
	    $result->closeCursor();
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
		while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>              <option value="<?php echo $row['rkey']; ?>" <?php
            if($row['rkey'] == 0) echo 'selected="selected"';?>><?php
              echo $row['description']; ?></option>
<?php    
		}
		$result->closeCursor();
?>          </select>
        </div>
        <div class="codesel">
            <select name="code" tabindex="63">
                <option value="0" type="" selected="selected">-- Select (Optional) Account Code --</option>
<?php
		$result = $db->query('SELECT * FROM code ORDER BY id ASC;');
		while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>              <option value="<?php echo $row['id']; ?>" codetype="<?php echo $row['type']; ?>"><?php echo $row['description']; ?></option>
<?php
		}
		$result->closeCursor();
?>            </select>
        </div>
        <div class="codetype"></div>
        <div class="buttoncontainer">
            <a class="button setcurrency" title="set currency rate from this transaction" ><span><img src="set.png"/>Set Currency Rate</span></a>
        </div>
    </div>
    <div class="xaction brow">
        <div class="sellabel">Dst :</div>
        <div class="accountsel">
            <select id="account" name="account">
            	<option value="" selected="selected">-- Select (Optional) Other Account --</option>
<?php
		$result = $db->prepare('SELECT name FROM account WHERE name != ? ORDER BY name ASC;');
		$result->bindValue(1,$account);
		$result->execute();
		while($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>            <option value="<?php echo $row['name']; ?>" ><?php echo $row['name']; ?></option>
<?php
		}
		$result->closeCursor();

?>        </select>
        </div>
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
	}    
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
$db->commit();
?>
