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

if(!(isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] )) die('Hacking attempt - wrong key');

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");
$result=dbQuery('SELECT version FROM currency WHERE name = '.dbPostSafe($_POST['currency']).';');
$row = dbFetch($result);
if ($row['version'] != $_POST['version'] ) {
?><error>Someone else has edited the configuration in parallel with you.  We need to reload the page in order to pickup
    their changes</error>
<?php
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}
dbFree($result);

if(($_POST['newpriority']+0) > ($_POST['oldpriority']+0)) {
    $sql1 = 'priority - 1';
    $sql2 = 'priority >= '.dbPostSafe($_POST['oldpriority']).' AND priority <= '.dbPostSafe($_POST['newpriority']);
} else {
    $sql1 = 'priority + 1';
    $sql2 = 'priority >= '.dbPostSafe($_POST['newpriority']).' AND priority <= '.dbPostSafe($_POST['oldpriority']);
}


dbQuery('UPDATE currency SET version = DEFAULT, priority = CASE WHEN name = '.dbPostSafe($_POST['currency']).' THEN '
            .dbPostSafe($_POST['newpriority']).' ELSE '.$sql1.' END WHERE display = true AND '.$sql2.' ;');

?><currencies>
<?php       
$result=dbQuery('SELECT * FROM currency WHERE display = true AND priority > 0 ORDER BY priority ASC;');
$r=0;
$options = Array();
while($row = dbFetch($result)) {
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
dbFree($result);
dbQuery("COMMIT;");
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


