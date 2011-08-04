<?php
/*
 	Copyright (c) 2009,2010,2011 Alan Chandler
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

define('EDIT_KEY','AKCmEDIT'); //coordinate this with same key in money.js

require_once('./inc/db.inc');


if(isset($_GET['account'])) {
	$account = $_GET['account'];
} else {
	if(isset($user['account'])) {
		$account = $user['account'];
	}
}
$stmt = $db->prepare("SELECT a.name AS name, bversion, dversion,balance,date, a.domain AS domain, a.currency, a.startdate,c.description AS cdesc, c.rate 
                        FROM account AS a JOIN currency AS c ON a.currency = c.name,
                        user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
                        WHERE a.name = ? AND u.uid = ? AND (u.isAdmin = 1 OR c.domain = a.domain)");

$db->beginTransaction();
if(isset($account)) {
	$stmt->bindValue(1,$account);
	$stmt->bindValue(2,$user['uid'],PDO::PARAM_INT);

	$stmt->execute();

	if($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	
		if($account != $user['account']) {
		//If changing account (successfully) then we need to update our user
			$user['account'] = $account;
			updateUser();
		}
	}
	$stmt->closeCursor();    
} else {
	$row = false;
	$account = "No Account Defined";
}

function head_content() {

?><title>AKC Money Main Transaction Page</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money, either for a private individual or a small business.  It 
consist of two main concepts, accounts which hold money, and transactions which transfer money from one account to another (or just to or from a
single account if the transaction is with the outside world).  Multiple currencies are supported, and can use exchange rates which are initially
estimated, but are then corrected when the actual value used in a transaction is known.  This is the second release, based on personal use over
the past 4 years and a third release is planned to allow multiple accounting as is typically seen in business (cash accounts versus management accounts"/>
<meta name="keywords" content=""/>
    <link rel="shortcut icon" type="image/png" href="favicon.ico" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<link rel="stylesheet" type="text/css" href="/js/calendar/calendar.css"/>
	<!--[if lt IE 7]>
    	<link rel="stylesheet" type="text/css" href="/js/calendar/calendar-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="/js/mootools-core-1.3.2-yc.js"></script>
	<script type="text/javascript" src="mootools-money-1.3.2.1-yc.js"></script>
	<script type="text/javascript" src="/js/utils.js" ></script>
	<script type="text/javascript" src="/js/calendar/calendar.js" ></script>
	<script type="text/javascript" src="money.js" ></script>
<?php
}


function content() {
    global $db,$user,$account,$row;
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
    
    $result = $db->query("SELECT repeat_days FROM config");
    $repeatdays = $result->fetchColumn();
    $result->closeCursor();
    
    $repeattime = time() + $repeatdays*84600;
    $currency = $row['currency'];
    $balance = $row['balance'];
    $cumbalance = $balance; //We start with the reconciled balance
    $bdate = $row['date'];
    $cdesc = $row['cdesc'];
    $crate = $row['rate'];
    $domain = (is_null($row['domain']))?'':$row['domain'];
?>              <span class="title">Domain:</span> <?php echo $domain;
?>			</div> 
			<div id="currency">
				<span class="title">Currency for Account:</span> <span class="currency"><?php echo $currency ;?></span><br/>
				<?php echo $cdesc;?>
			</div>
			<div style="clear:both"></div>
		</div>
<?php
/*
	The start date has to be set dependant on the setting.  However this is far from easy in all cases.  This code creates the correct value
*/
	$useStartTime = true;		
	if(is_null($row['startdate'])) {
		$useStartTime = false;
		//Reconciled Balance Date
		$startTime = $row['date'];
	} elseif ($row['startdate'] == 0 ) {
		//Financial year start date - so we need go find it	
		$result = $db->query("SELECT year_end FROM config LIMIT 1");
		$yearend = $result->fetchColumn();
		$result->closeCursor();

		/* start time of the financial year. If its after now, then we jump back one year */

		$startTime = mktime(0,0,0,substr($yearend,0,2),substr($yearend,2)+1,round(date("Y")));
		if ( $startTime > time() ) $startTime = mktime(0,0,0,substr($yearend,0,2),substr($yearend,2)+1,round(date("Y"))-1);
	} else {
		//Start date is the right value
		$startTime = $row['startdate'];
	}

	if($user['isAdmin']){
?>		<div class="buttoncontainer accountbuttons">
		    <input type="hidden" name="account" value="<?php echo $account;?>" />
		    <input type="hidden" name="issrc" value="true" />
		    <input type="hidden" name="currency" value="<?php echo $currency; ?>" />
		    <input id="bversion" type="hidden" name="bversion" value="<?php echo $row['bversion'];?>" />
            <a id="new" class="button" tabindex="310"><span><img src="add.png"/>New Transaction</span></a>
            <a id="rebalance" class="button" tabindex="320"><span><img src="balance.png"/>Set Reconciled Balance</span></a>
        </div>
		<div id="scopeselection">
		    <input id="dversion" type="hidden" name="dversion" value="<?php echo $row['dversion'];?>" />
			<div><input type="radio" name="scope" value="U" <?php 
				if ( is_null($row['startdate'])) echo 'checked="checked"'; ?>/>Unreconciled transactions Only</div>
			<div><input type="radio" name="scope" value="S" <?php 
				if ( !is_null($row['startdate']) and $row['startdate'] == 0 ) echo 'checked="checked"'; ?>/>Transactions this financial year</div>
			<div><input type="radio" name="scope" value="D" <?php 
				if (!is_null($row['startdate']) AND $row['startdate'] > 0 ) echo 'checked="checked"'; ?>/>Transactions from date ... <input 
					type="hidden" name="startdate" value="<?php echo $startTime;?>" id="startdate"/></div>
		</div>																			
<?php
	}
?>		<div class="buttoncontainer accountbuttons">
            <a id="csv" href="accountcsv.php?&account=<?php echo $account;  ?>" class="button" tabindex="310"><span><img src="spreadsheet.png"/>Create CSV File</span></a>
        </div>
<script type="text/javascript">
var thisAccount;

window.addEvent('domready', function() {
//Turn all dates to the correct local time
    Utils.dateAdjust($('balance'),'dateawait','dateconvert');
    Utils.dateAdjust($('transactions'),'dateawait','dateconvert');
<?php if($user['isAdmin']) {
?>	AKCMoney.Account("<?php echo $account;?>","<?php echo $currency ;?>",<?php
					 if(isset($_GET['tid'])) {echo $_GET['tid'];} else {echo '0';} ?>,<?php
					 if(isset($_GET['edit']) && $_GET['edit'] == EDIT_KEY ) {echo '1';} else {echo '0';} ?>);
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
    <div id="minbalance" class="amount">0.00</div>
</div>
<div id="balance" class="xaction balance row">
    <input type="hidden" name="clearing" value="false" />
    <input type="hidden" name="bversion" value="<?php echo $row['bversion'];?>"/>
    <div class="date"><input id="recbaldate" type="hidden" name="bdate" value="<?php echo $bdate?>" class="dateawait" /></div>
    <div class="ref">&nbsp;</div>
    <div class="description">Reconciled Balance</div>
    <div class="amount">&nbsp;</div>
    <div  class="amount">
        <input  id="recbalance" class="amount" type="text" name="recbalance" 
                value="<?php echo fmtAmount($balance);?>" tabindex="280"/>
    </div>
</div>
<div class="xaction balance">
    <div class="date">&nbsp;</div>
    <div class="ref">&nbsp;</div>
    <div class="description">Cleared Balance</div>
    <div class="amount">&nbsp;</div>
    <div id="clearbalance" class="amount"><?php echo fmtAmount($balance);/* cleared balance = reconciled balance when we load the transactions */?></div> 
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
    $stmt->bindValue(3,$repeattime,PDO::PARAM_INT);
    $upd = $db->prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
    $ins = $db->prepare('INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
                     repeat, currency, amount, description)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?);');
    while ($repeats_to_do) {
        $repeats_to_do = false; //lets be optimistic and plan to be done
        $stmt->execute();
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $upd->bindValue(1,$row['id'],PDO::PARAM_INT);
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
	if ( $useStartTime) {
		$stmt = $db->prepare('
		    SELECT 
		        xaction.*, currency.name AS cname, currency.rate AS rate, srcacc.domain AS srcdom, dstacc.domain AS dstdom,
		        sc.type AS sct, sc.description AS scd, dc.type AS dct, dc.description AS dcd  
		    FROM xaction,currency 
		    LEFT JOIN code AS sc ON sc.id = xaction.srccode 
		    LEFT JOIN code AS dc ON dc.id = xaction.dstcode 
		    LEFT JOIN account AS srcacc ON xaction.src = srcacc.name 
		    LEFT JOIN account AS dstacc ON xaction.dst = dstacc.name 
		    WHERE xaction.currency = currency.name AND (src = ? OR dst = ?) AND xaction.date > ? ORDER BY xaction.date ASC;');
		$stmt->bindValue(1,$account);
		$stmt->bindValue(2,$account);
		$stmt->bindValue(3,$startTime,PDO::PARAM_INT);
	} else {
		$stmt = $db->prepare('
		    SELECT 
		        xaction.*, currency.name AS cname, currency.rate AS rate, srcacc.domain AS srcdom, dstacc.domain AS dstdom,
		        sc.type AS sct, sc.description AS scd, dc.type AS dct, dc.description AS dcd  
		    FROM xaction,currency 
		    LEFT JOIN code AS sc ON sc.id = xaction.srccode 
		    LEFT JOIN code AS dc ON dc.id = xaction.dstcode 
		    LEFT JOIN account AS srcacc ON xaction.src = srcacc.name 
		    LEFT JOIN account AS dstacc ON xaction.dst = dstacc.name 
		    WHERE xaction.currency = currency.name AND ((src = ? AND srcclear = 0 )OR (dst = ? AND dstclear = 0)) ORDER BY xaction.date ASC;');
		$stmt->bindValue(1,$account);
		$stmt->bindValue(2,$account);
	}
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
                $amount = -$row['srcamount'];//if this is a source account we are decrementing the balance with a positive value
            } else {
                if($row['currency'] != $currency) {
                    $amount = -$row['amount']*$crate/$row['rate'];
                } else {
                    $amount = -$row['amount'];
                }
            }
            if ($row['srcclear'] != 0) {
                $cleared = true;
            } else {
                $cumbalance += $amount;
            }
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
            if ($row['dstclear'] !=0 ) {
                $cleared = true;
            } else {
                $cumbalance += $amount;
            }
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
        if (!$locatedNow && $row['date'] > time()) {
            $locatedNow=true;
?><div id="now" class="hidden"></div>
<?php
        }

?><div id="<?php echo 't'.$row['id']; ?>" class="xaction arow<?php if($r%2 == 0) echo ' even';?>">
    <div class="wrapper">    
        <input type="hidden" class="version" name="version" value="<?php echo $row['version']; ?>"/>
        <div class="date clickable<?php
        if($row['repeat'] != 0) echo ' repeat'; //We do this regardless of other considerations
		if ($cleared) {
			echo ' reconciled'; 
        } else {
            if ($row['date'] < time()) echo ' passed'; //We only clear temporarily, so we don't worry about that just yet
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
        <div class="amount cumulative<?php if ($dual) echo " dual";?>"><?php if($cleared) {echo "0.00" ;} else {echo fmtAmount($cumbalance); }?></div>
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
?><div id="xactiontemplate" class="hidden xactionform">
	<div class="movequery">
	    <input type="hidden" name="tid" value="0"/>
	    <input type="hidden" name="accountname" value="<?php echo $account;?>" />
	</div>
    <input type="hidden" name="version" value="0" />
    <input type="hidden" name="accounttype" value="src"/>
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
		$result = $db->query('SELECT * FROM code ORDER BY type DESC, description COLLATE NOCASE ASC;');
		while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>              <option value="<?php echo $row['id']; ?>" codetype="<?php echo $row['type']; ?>" class="code_<?php
					 echo $row['type']; ?>"><?php echo $row['description']; ?></option>
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
		$result = $db->prepare("
		    SELECT a.name, a.domain FROM account AS a, 
		    user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
		    WHERE a.name != ? AND u.uid= ? AND (u.isAdmin = 1 OR c.domain = a.domain)
		    ORDER BY CASE WHEN a.domain = ? THEN NULL ELSE coalesce(a.domain,'ZZZZZ') END COLLATE NOCASE ,a.name COLLATE NOCASE;
		");
		$result->bindValue(1,$account);
		$result->bindValue(2,$user['uid'],PDO::PARAM_INT);
		if($domain != '') {
			$result->bindValue(3,$domain);
		} else {
			$result->bindValue(3,null,PDO::PARAM_NULL);
		}
		$result->execute();
		while($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>            <option value="<?php echo $row['name']; ?>" ><?php echo $row['name'];
				if(!is_null($row['domain'])) echo " (".$row['domain'].")"; ?></option>
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
	$db->commit();   
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 

?>

