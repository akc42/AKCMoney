<?php
/*
 	Copyright (c) 2009, 2010 Alan Chandler
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


$db->exec("BEGIN IMMEDIATE");

$version=$db->querySingle("SELECT version, default_currency FROM config;");
if ( $version != $_POST['version'] ) {
?><error>Someone else has edited the configuration in parallel with you.  We will reload the page</error>
<?php
    $_SESSION['default_currency'] = $row['default_currency'];
    $_SESSION['config_version'] = $row['version'];
    $db->exec("ROLLBACK");
    exit;
}
$version++;


$_SESSION['default_currency'] = $_POST['currency'];
$_SESSION['config_version'] = $version;

$db->exec("UPDATE config SET version = $version, default_currency = ".dbPostSafe($_POST['currency']).';');
$row = $db->querySingle('SELECT * FROM currency WHERE name = '.dbMakeSafe($_POST['currency']),true);

$oldrate = $row['rate'];
$oldpriority = $row['priority'];

// We now go through all currencies adjusting relative priorities so that new default currency is always first
$db->exec("UPDATE currency SET version = (version + 1), rate = CASE WHEN name = '".$_SESSION['default_currency']."' THEN 1.0 ELSE rate / "
        .$oldrate." END, priority = CASE WHEN name = '".$_SESSION['default_currency']."'"
        .' THEN 0 WHEN display = 0 THEN NULL WHEN priority < '.$oldpriority.' THEN priority + 1 ELSE priority END ;');


?><selector>
    <div id=dc_description><?php echo $_SESSION['dc_description']; ?></div>
    <input type="hidden" name="version" value="<?php echo $_SESSION['config_version']; ?>" />
    <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
    <div class="currency">
        <select id="currencyselector" name="currency">
<?php            

$result = $db->query('SELECT * FROM currency WHERE display = 1 ORDER BY priority ASC;');
$currencies = Array();
while($row = $result->fetchArray(SQLITE3_ASSOC)) {
$currencies[$row['name']] = Array($row['version'],$row['description'],$row['rate']);
?>                <option value="<?php echo $row['name']; ?>" <?php
                    if($row['name'] == $_SESSION['default_currency']) echo 'selected="selected"';?> 
                        title="<?php echo $row['description']; ?>"><?php echo $row['name']; ?></option>
<?php    
}
?>
        </select>
    </div>
</selector>
<?php
$result->finalize();
$db->exec("COMMIT");
$r=0;
foreach($currencies as $name => $values)  {
    $r++;
    if($r == 1) {
?><defaultcurrency>
<div id="<?php echo 'c_'.$name; ?>" class="xcurrency<?php if($r%2 == 0) echo ' even';?>">
    <input type="hidden" name="version" value="<?php echo  $values[0]; ?>" />
    <div class="description"><?php echo $values[1]; ?></div>
    <div class="currency"><?php echo $name; ?></div>
    <div class="show">&nbsp;</div>
    <div class="rate">1.0</div>
</div>
</defaultcurrency>
<currencies>
<?php
    } else {
?>
<div id="<?php echo 'c_'.$name; ?>" class="xcurrency<?php if($r%2 == 0) echo ' even';?>">
    <input type="hidden" name="version" value="<?php echo  $values[0]; ?>" />
    <input type="hidden" name="priority" value="<?php echo $r-1; ?>" />
    <div class="description"><?php echo $values[1]; ?></div>
    <div class="currency"><?php echo $name; ?></div>
    <div class="show"><input type="checkbox" name="show" checked="checked" /></div>
    <div class="rate"><?php echo $values[2]; ?></div>
</div>
<?php
    }
}
?></currencies>

