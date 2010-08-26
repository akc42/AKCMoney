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
$sstmt = $db->prepare("SELECT version FROM currency WHERE name = ? ;");
$sstmt->bindValue(1,$_POST['currency']);

$ustmt = $db->prepare("
    UPDATE currency SET 
        version = version + 1, 
        priority = 
            CASE 
                WHEN name = ? THEN ? 
                ELSE priority + ? 
            END
     WHERE display = 1 AND priority >= ? AND priority <= ? ;
");
$ustmt->bindValue(1,$_POST['currency']);
$ustmt->bindValue(2,$_POST['newpriority']);
if(($_POST['newpriority']+0) > ($_POST['oldpriority']+0)) {
    $ustmt->bindValue(3,-1);
    $ustmt->bindValue(4,$_POST['oldpriority']);
    $ustmt->bindValue(5,$_POST['newpriority']);
} else {
    $ustmt->bindValue(3,1);
    $ustmt->bindValue(4,$_POST['newpriority']);
    $ustmt->bindValue(5,$_POST['oldpriority']);
}

$db->exec("BEGIN IMMEDIATE");
$sstmt->execute();
$version=$sstmt->fetchColumn();
$sstmt->closeCursor();
if ($version != $_POST['version'] ) {
?><error>Someone else has edited the configuration in parallel with you.  We need to reload the page in order to pickup
    their changes</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}

$ustmt->execute();
$ustmt->closeCursor();

?><currencies>
<?php       
$result = $db->query('SELECT * FROM currency WHERE display = 1 AND priority > 0 ORDER BY priority ASC;');
$r=0;
$options = Array();
while($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $r++;
    $options[$row['name']] = $row['description'];
?><div class="xcurrency<?php if($r%2 != 0) echo ' even';?>">
    <input type="hidden" name="version" value="<?php echo  $row['version']; ?>" />
    <input type="hidden" name="priority" value="<?php echo $r ?>" />
    <div class="description"><?php echo $row['description']; ?></div>
    <div class="currency"><?php echo $row['name']; ?></div>
    <div class="show"><input type="checkbox" name="show" checked="checked" /></div>
    <div class="rate"><?php echo $row['rate']; ?></div>
</div>
<?php
}
$result->closeCursor();
$db->exec("COMMIT");
?></currencies>
<selectoptions><select>
<option value="<?php echo $_SESSION['default_currency']; ?>" title="<?php echo $_SESSION['dc_description']; ?>" selected="selected"><?php
    echo $_SESSION['default_currency']; ?></option>
<?php            
foreach($options as $name => $description) {
?><option value="<?php echo $name; ?>" title="<?php echo $description; ?>"><?php echo $name; ?></option>
<?php    
}
?></select></selectoptions>


