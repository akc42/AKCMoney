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

session_start();

if( !isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] ) die("<error>Hacking attempt - wrong key should have been '".$_SESSION['key']."'</error>");

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");

$result=dbQuery("SELECT name FROM account WHERE name =".dbMakeSafe($_POST['account']).";");

if ($row = dbFetch($result)) {
    //account with this name already exists so we cannot create one
?><error>It appears an account with this name already exists.  This is probably because someone else is editing the list of accounts
in parallel to you.  We will reload the page to ensure that you have consistent data</error>
<?php
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}
dbFree($result);

$result = dbQuery("INSERT INTO account (name, dversion, bversion, date, currency,atype) VALUES (".dbPostSafe($_POST['account']).
            ", DEFAULT, DEFAULT, DEFAULT, ".dbPostSafe($_POST['currency']).",".dbPostSafe($_POST['type']).") RETURNING dversion ;");
$row = dbFetch($result);

?><div class="xaccount">
        <form action="updateaccount.php" method="post" onSubmit="return false;" >
            <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
            <input type="hidden" name="dversion" value="<?php echo $row['dversion'];?>"/>
            <input type="hidden" name="original" value="<?php echo $_POST['account']; ?>" />
            <div class="account"><input type="text" name="account" value="<?php echo $_POST['account']; ?>"/></div>
            <div class="type">
                <select name="type" >
<?php
dbFree($result);
dbQuery("COMMIT;");
$result=dbQuery('SELECT atype,description FROM account_type');

?>
                
<?php
 while($row=dbFetch($result)) {
?>              <option title="<?php echo $row['description'];?>" <?php
                        if ($row['atype'] == $_POST['type']) echo 'selected="selected"'; ?> ><?php echo $row['atype'];?></option>
<?php
}
dbFree($result);
?>          </select>
            </div>
            <div class="currency">
            <select name="currency" title="<?php echo $_SESSION['dc_description']; ?>">
<?php
$result=dbQuery('SELECT name, rate, display, priority, description FROM currency WHERE display = true ORDER BY priority ASC;');
while($row = dbFetch($result)) {
?>              <option value="<?php echo $row['name']; ?>" <?php
                        if($row['name'] == $_POST['currency']) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
}
dbFree($result);
?>
            </select>
            </div>
        </form>
        <div class="button">
            <div class="buttoncontainer">
                <a class="button"><span><img src="delete.png"/>Delete Account</span></a>
            </div>
        </div>
</div>

