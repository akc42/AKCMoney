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

require_once('./inc/db.inc');

$astmt = $db->prepare("SELECT name FROM account WHERE name = ? ;");
$astmt->bindValue(1,$_POST['account']);
$istmt =  $db->prepare("INSERT INTO account (name, dversion, bversion, currency,domain) VALUES ( ? , 1, 1, ? , ? );");
$istmt->bindValue(1,$_POST['account']);
$istmt->bindValue(2,$_POST['currency']);
if($_POST['domain'] != '') {
	$istmt->bindValue(3,$_POST['domain']);
} else {
	$istmt->bindValue(3,null,PDO::PARAM_NULL);
}

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
            <input type="hidden" name="dversion" value="1"/>
            <input type="hidden" name="original" value="<?php echo $_POST['account']; ?>" />
            <input type="hidden" name="origdom" value="<?php echo $_POST['domain']; ?>" />
            <div class="account"><input type="text" name="account" value="<?php echo $_POST['account']; ?>"/></div>
            <div class="domain">
	        	<select name="domain" value="" tabindex="<?php echo $tabIndex++; ?>">
	        		<option value="" title="NULL" <?php if($_POST['domain'] == '') echo 'selected="selected"';?>></option>
<?php
$result = $db->query('SELECT name, description FROM domain ORDER BY name COLLATE NOCASE;');
$r=0;
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
?>					<option value="<?php echo $row['name']; ?>" <?php
                        if($row['name'] == $_POST['domain']) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php
	$r++;    
}
$result->closeCursor();

?>				</select>
			</div>
            <div class="currency">
<?php
$result = $db->query('SELECT name, rate, display, priority, description FROM currency WHERE display = 1 ORDER BY priority ASC;');
$r=0;
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
	if($r == 0) {
?>	            <select name="currency" title="<?php echo $row['description']; ?>">
<?php
	}
?>              	<option value="<?php echo $row['name']; ?>" <?php
                        if($r == 0) echo 'selected="selected"';?> 
                            title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php
	$r++;    
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
