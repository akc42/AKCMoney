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
error_reporting(E_ALL);

session_start();
require_once('./inc/db.inc');
if($_SESSION['key'] != $_POST['key']) die('Protection Key Not Correct');
$astmt = $db->prepare("SELECT name FROM account WHERE name = ? ;");
$astmt->bindValue(1,$_POST['account']);
$istmt =  $db->prepare("INSERT INTO account (name, dversion, bversion, currency,domain) VALUES ( ? , 1, 1, ? , ? );");
$istmt->bindValue(1,$_POST['account']);
$istmt->bindValue(2,$_POST['currency']);
$istmt->bindValue(3,$_POST['domain']);

$db->exec("BEGIN IMMEDIATE");

$astmt->execute();
$name = $astmt->fetchColumn();
$astmt->closeCursor();

if ($name == $_POST['account']) {
    //account with this name already exists so we cannot create one
?><error>It appears an account with this name already exists.  This is probably because someone else is editing the list of accounts
in parallel to you.  We will reload the page to ensure that you have consistent data</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$istmt->execute();
$istmt->closeCursor();
?><div class="xaccount">
        <form action="updateaccount.php" method="post" onSubmit="return false;" >
            <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
            <input type="hidden" name="dversion" value="1"/>
            <input type="hidden" name="original" value="<?php echo $_POST['account']; ?>" />
            <input type="hidden" name="origdom" value="<?php echo $_POST['domain']; ?>" />
            <div class="account"><input type="text" name="account" value="<?php echo $_POST['account']; ?>"/></div>
            <div class="domain"><input type="text" name="domain" value="<?php echo $_POST['domain']; ?>"/></div>
            <div class="currency">
            <select name="currency" title="<?php echo $_SESSION['dc_description']; ?>">
<?php
$result = $db->query('SELECT name, rate, display, priority, description FROM currency WHERE display = 1 ORDER BY priority ASC;');
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>              <option value="<?php echo $row['name']; ?>" <?php
                        if($row['name'] == $_POST['currency']) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
}
$result->closeCursor();
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
<?php
$db->exec("COMMIT");
?>
