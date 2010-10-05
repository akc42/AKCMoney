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
define('DB_DIR','/var/www/money/db/'); //coordinate with db.inc, doLogin.php and login.php

if(!(isset($_GET['db']) && isset($_GET['url']))) die('Invalid Parameters'); 

if (!file_exists(DB_DIR.$_GET['db'].'.db')) {
    header('Location:error.php?err='.urlencode("Database file not found"));  //a database file must at least have been created by the sqlite3 command line utility
    exit;
}
$db = new PDO('sqlite:'.DB_DIR.$_GET['db'].'.db');

$result = $db->query("SELECT count(*) FROM sqlite_master WHERE name = 'config' ;");
if($result && ($present = $result->fetchColumn()) && $present == '1') {
    header('Location:error.php?err='.urlencode("Cannot install to existing database")); //database in file, so can't now create it
    exit;
}
$result->closeCursor();

$db->exec(file_get_contents('./inc/database.sql')); //setup the database (this is within its own transaction)

$db->beginTransaction();   //having set up the database, and put it into WAL mode, we open up a new transaction do the rest

function head_content() {

?><title>AKC Login Page</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money.  This is the login page"/>
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
    
    var loginReq = new Request.JSON({
        url:'doInstall.php',
        link:'ignore',
        onComplete: function(response,t) {
            if(response.status) {
                //validated OK (Cookie will have been set by user, so we need to exit
                window.location = document.id('login').url.value;                    
            }
        }
    });

    window.addEvent('domready', function() {
        document.id('submit').addEvent('click', function(e) {
            e.stop();
            document.id('loginerror').addClass('hidden');
            var myform = document.id('login'); 
            if(myform.username.value == '' || myform.pwd1.value == '' || myform.pwd1.value != myform.pwd2.value) {
                document.id('loginerror').removeClass('hidden');
            } else {
            loginReq.post({
                db:myform.db.value,
                user:myform.username.value,
                pass:hex_md5(myform.pwd1.value),
                rem:myform.rememberme.checked,
                timestamp:myform.timestamp.value,
                domain:myform.domain.value,
                account:myform.account.value
            });
            }
        });
    });
    </script>
<?php
}
//We don't want any menuitems as we want the user to continue, and can't do anything if he doesn't
function menu_items() {
}

function content() {
    global $db;
?>
    <h1>Install</h1>
    <div class="loginpreamble">
        <p>Please enter a user name for you to be administrator, together with the password (twice) that you wish to use</p>
        <p><strong>NOTE:</strong>If you do not login correctly with the form below, you will have created a database without adminsitrator access.  If you do that, you will have to delete the database installation and start again as explained in the README</p>
        <p>If you do not wish to be remembered on this computer after you close the browser please uncheck the &#8220;<em>Remember Me</em>&#8221; check box</p>
    </div>
	<form id="login" action="doInstall.php" method="post">
	    <input type="hidden" name="db" value="<?php echo $_GET['db']; ?>"/>
	    <input type="hidden" name="url" value="<?php echo $_GET['url']; ?>"/>
	    <input type="hidden" name="timestamp" value="<?php echo time(); /* This has to be close to database creation time for doInstall.php to pass validation */?>"/>
	    <div id="loginerror" class="login_error hidden">Username or password is blank or passwords do not match, please try again</div>
	    <div class="logininput">
	        <div>
		        <label for="username"><b>Username: </b></label>
		        <input class="field" type="text" name="username" id="username" value="" size="23" />
		    </div>
		    <div>
		        <label for="pwd1"><b>Password:</b>
		        <input class="field" type="password" name="pwd1" id="pwd1" size="23" /></label>
		        <label for="pwd2"><b>Confirm:</b>
		        <input class="field" type="password" name="pwd2" id="pwd2" size="23" /></label>
		    </div>
		    <div class="defaultselection">
		        <label for="domain">Default Accounting Domain:
		        <select id="domain" name="domain">
<?php
    $result = $db->query("SELECT name FROM domain ;");
    while($domain = $result->fetchColumn()) {
?>                  <option><?php echo $domain; ?></option>
<?php
    }
    $result->closeCursor();
?>		        </select></label>
		        <label for="account">Initial Account for Display:
		        <select id="account" name="account">
<?php
    $result = $db->query("SELECT name FROM account ;");
    while($account = $result->fetchColumn()) {
?>                  <option><?php echo $account; ?></option>
<?php
    }
    $result->closeCursor();
?>		        </select></label>
            </div>
		</div>
        <div class="buttoncontainer loginsubmit">
            <a id="submit" class="button"><span><img src="login.png"/>Log In</span></a>
        </div>
	    <div>
        	<label for="rememberme"><input name="rememberme" id="rememberme" class="rememberme" type="checkbox" checked="checked" value="forever" /> Remember me</label>
        	<label for="demo"><input name="demo" id="demo" type="checkbox"/>Demo</label>
        </div>
	</form>

<?php
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
$db->commit();
?>

