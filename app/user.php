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


require_once('./inc/db.inc');


function head_content() {
	global $user;

?><title>AKCMoney MyAccount Page</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This page allows a user to adjust some account settings"/>
<meta name="keywords" content="
    <link rel="shortcut icon" type="image/png" href="favicon.ico" />
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="/money/money-ie.css"/>
	<![endif]-->
	<link rel="stylesheet" type="text/css" href="print.css" media="print" />
	<script type="text/javascript" src="mootools-1.2.4-core-yc.js"></script>
	<script type="text/javascript" src="md5.js" ></script>
    <script type="text/javascript">
    
    var saveReq = new Request.JSON({
        url:'updateuseraccount.php',
        link:'ignore',
        onComplete: function(response,t) {
            if(response) {
                if(response.status) {
                    //validated OK 
                    window.location = 'index.php';                    
                } else {
                	Cookie.dispose('akcmoney'); //Removing the cookie because it is no longer valid
                    window.location = 'error.php?err='+encodeURIComponent("Your details are no longer in the database-please inform administrator");
                }
            }
        }
    });

    window.addEvent('domready', function() {
        document.id('submit').addEvent('click', function(e) {
            e.stop();
            var myform = document.id('useraccount');
            if (myform.pwd.value != '' && myform.confirm.value != myform.pwd.value) {
            	document.id('usererror').removeClass('hidden');
            	return;
            }
            document.id('usererror').addClass('hidden');
            saveReq.post({
                uid:<?php echo $user['uid']; ?>,
                version:myform.version.value,
                pass:(myform.pwd.value != '')?hex_md5(myform.pwd.value):'',
        		account:myform.account.options[myform.account.selectedIndex].value,
        		domain: myform.domain.options[myform.domain.selectedIndex].value,
            });
        });
    });
    </script>
<?php
}

function content() {
	global $db,$user;
	$sstmt = $db->prepare("SELECT name,version,account,domain FROM user WHERE uid = ? ;");
	$sstmt->bindValue(1,$user['uid'],PDO::PARAM_INT);
	$astmt = $db->prepare("
        SELECT a.name, a.domain FROM account AS a, 
        user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
        WHERE u.uid= ? AND (u.isAdmin = 1 OR c.domain = a.domain)
        ORDER BY coalesce(a.domain,'ZZZZZ') COLLATE NOCASE ,a.name COLLATE NOCASE;
	");
	$astmt->bindValue(1,$user['uid'],PDO::PARAM_INT);
	$dstmt = $db->prepare("
        SELECT d.name, description FROM domain AS d, user AS u LEFT JOIN capability AS c ON c.uid = u.uid
        WHERE u.uid= ? AND ( c.domain = d.name OR u.isAdmin = 1) ORDER BY d.name COLLATE NOCASE ;
	");
	$dstmt->bindValue(1,$user['uid']);
	$db->beginTransaction();
	$sstmt->execute();
	$row = $sstmt->fetch(PDO::FETCH_ASSOC);
	$sstmt->closeCursor();
	if(!$row) {
?><<h1>Problem with User</h1>
<p>It appears that your account  is no longer in the database.  This is probably because someone
working in parallel with you has deleted it.  You can try to restart the software by
selecting another item from the menu above, but if that still fails then you should report the fault to
an adminstrator, informing them that you had a problem with user ID <strong><?php echo $user['uid']; ?></strong> not being in the database</p>
<?php
        $db->rollBack();
        return;
    }

	
?>
    <h1>My Account</h1>
    <div class="userpreamble">
        <p>This page allows you to update your password and/or your default account (the one that will appear when you first login), together
        with your default Accounting Domain.  If you wish to change your user name, you will have to ask an administrator to do it.</p>
        <p>If you wish to leave your password as it currently is, then leave the password field blank. Otherwise fill in the password
        field with your new password, and enter the <em>same</em> new password in the confirm field.</p>
        <p><em>Save and Close</em> when you have finished making your changes.</p>
    </div>
    <div class="user_error hidden" id="usererror">
    	<p>The password and its confirmation are not the same, please either blank the password field, or make sure both are the same</p>
    </div>
	<form id="useraccount" action="#" method="post" onsubmit="return false;">
	    <input type="hidden" name="uid" value="<?php echo $user['uid'] ?>"/>
	    <input type="hidden" name="version" value="<?php echo $row['version']; ?>"/>
	    <div class="userinput">
	    	<div class="username">
			    <label for="username"><b>Username: </b>
			    <span id="username"><?php echo $row['name'];?></span></label>
			</div>
			<div class="password">
			    <label for="pwd"><b>Password:</b>
			    <input class="field" type="password" name="pwd" id="pwd" size="23" /></label>
			    <label for="confirm"><b>Confirm: </b>
			    <input class="field" type="password" name="confirm" id="confirm" size="23" /></label>
			</div>
        	<div class="account">
        		<label for="dfa"><b>Default Account:</b>
        		<select name="account" title="default account" id="dfa">
        			<option value="" title="NULL" <?php if(is_null($row['account'])) echo 'selected="selected"';?>></option>
<?php
	$astmt->execute();
	while($account = $astmt->fetch(PDO::FETCH_ASSOC)) {
?>					<option value="<?php echo $account['name']; ?>" domain="<?php echo $account['domain'];?>" <?php
						if($row['account'] == $account['name']) echo 'selected="selected"';?>><?php 
							echo $account['name']; if(!is_null($account['domain'])) echo " (".$account['domain'].")"; ?></option>
<?php
	}
	$astmt->closeCursor();
?>              </select></label>
            </div>
            <div class="domain">
            	<label for="dfd"><b>Default Domain:</b>
            	<select name="domain" title="default domain" id="dfd">
        			<option value="" title="NULL" <?php if(is_null($row['domain'])) echo 'selected="selected"';?>></option>
<?php
$dstmt->execute();
	while($domain = $dstmt->fetch(PDO::FETCH_ASSOC)) {
?>					<option value="<?php echo $domain['name'];?>" title="<?php echo $domain['description']; ?>" <?php
						if($row['domain'] == $domain['name']) echo 'selected="selected"';?>><?php echo $domain['name']; ?></option>
<?php
	}
	$dstmt->closeCursor();
?>              </select></label>
			</div>
		    
		</div>
        <div class="buttoncontainer usersubmit">
            <a id="submit" class="button"><span><img src="save.png"/>Save and Close</span></a>
        </div>
	</form>

<?php
	$db->rollBack();
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

