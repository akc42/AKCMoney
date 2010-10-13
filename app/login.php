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
if(!(isset($_GET['db']) && isset($_GET['url']))) die('Invalid Parameters'); 
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
        url:'doLogin.php',
        link:'ignore',
        onComplete: function(response,t) {
            if(response) {
                if(response.status) {
                    //validated OK (Cookie will have been set by user, so we need to exit
                    window.location = document.id('login').url.value;                    
                } else {
                    //Failed to validate, so we need to put up an error message (provided a retry is allowed)
                    if(response.retry) {
                        document.id('loginerror').removeClass('hidden');  //displays the error message
                        document.id('login').username.value = '';
                        document.id('login').pwd.value = '';
                    } else {
                        window.location = 'error.php?err='+encodeURIComponent("Login retry attempts exceeded");
                    }
                }
            }
        }
    });

    window.addEvent('domready', function() {
        document.id('submit').addEvent('click', function(e) {
            e.stop();
            document.id('loginerror').addClass('hidden');
            var myform = document.id('login'); 
            loginReq.post({
                db:myform.db.value,
                user:myform.username.value,
                pass:hex_md5(myform.pwd.value),
                rem:myform.rememberme.checked
            });
        });
        document.addEvent('keydown', function(e) {
            if(e.key == "enter"){
                document.id('submit').fireEvent('click',e);
            }
        });
    });
    </script>
<?php
}

function menu_items() {
}

function content() {
?>
    <h1>Log In</h1>
    <div class="loginpreamble">
        <p>Please enter your username and password to access this accounting system.</p>
        <p>If you do not wish to be remembered on this computer after you close the browser please uncheck the &#8220;<em>Remember Me</em>&#8221; check box</p>
    </div>
	<form id="login" action="#" method="post">
	    <input type="hidden" name="db" value="<?php echo $_GET['db']; ?>"/>
	    <input type="hidden" name="url" value="<?php echo $_GET['url']; ?>"/>
	    <div id="loginerror" class="login_error hidden">Invalid Credentials, please try again</div>
	    <div class="logininput">
		    <label for="username"><b>Username: </b></label>
		    <input class="field" type="text" name="username" id="username" value="" size="23" />
		    <label for="pwd"><b>Password:</b></label>
		    <input class="field" type="password" name="pwd" id="pwd" size="23" />
		</div>
        <div class="buttoncontainer loginsubmit">
            <a id="submit" class="button"><span><img src="login.png"/>Log In</span></a>
        </div>
	    <div>
        	<label for="rememberme"><input name="rememberme" id="rememberme" class="rememberme" type="checkbox" checked="checked" value="forever" /> Remember me</label>
        </div>
	</form>

<?php
} 
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>

