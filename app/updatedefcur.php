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
if($_SESSION['key'] != $_POST['key']) die('Protection Key Not Correct');

$ustmt = $db->prepare("UPDATE config SET version = ?, default_currency = ? ;");
$ustmt->bindParam(1,$version,PDO::PARAM_INT);
$ustmt->bindValue(2,$_POST['currency']);
$currency = $db->quote($_POST['currency']);
$cstmt = $db->prepare('SELECT rate,priority FROM currency WHERE name = ? ;');
$cstmt->bindValue(1,$_POST['currency']);
$astmt = $db->prepare("
    UPDATE currency SET 
        version = (version + 1), 
        rate = CASE WHEN name = ? THEN 1.0 ELSE rate / CAST( ?  AS REAL) END, 
        priority = 
            CASE 
                WHEN name = ? THEN 0
                WHEN display = 0 THEN NULL 
                WHEN priority < ? THEN priority + 1 
                ELSE priority 
            END ;"
    );
$astmt->bindValue(1,$_POST['currency']);
$astmt->bindParam(2,$oldrate); //There is no PDO::PARAM_REAL
$astmt->bindValue(3,$_POST['currency']);
$astmt->bindParam(4,$oldpriority,PDO::PARAM_INT);

$db->exec("BEGIN IMMEDIATE");

$result=$db->query("SELECT version, default_currency FROM config;");
$row = $result->fetch(PDO::FETCH_ASSOC);
if ( $row['version'] != $_POST['version'] ) {
?><error>Someone else has edited the configuration in parallel with you.  We will reload the page</error>
<?php
    $_SESSION['default_currency'] = $row['default_currency'];
    $_SESSION['config_version'] = $row['version'];
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] + 1;


$_SESSION['default_currency'] = $_POST['currency'];
$_SESSION['config_version'] = $version;
$ustmt->execute();
$ustmt->closeCursor();

//Since we have now changed the default currency we need to recreate the view that shows transactions in that default currency
$db->exec("DROP VIEW dfxaction;");
$db->exec("
CREATE VIEW IF NOT EXISTS dfxaction AS
    SELECT t.id,t.date,t.version, src, srccode, dst, dstcode,t.description, rno, repeat,
        CASE 
            WHEN t.currency = $currency THEN t.amount
            WHEN t.srcamount IS NOT NULL AND sa.currency = $currency THEN t.srcamount
            WHEN t.dstamount IS NOT NULL AND da .currency = $currency THEN t.dstamount
            ELSE CAST ((CAST (t.amount AS REAL) / currency.rate) AS INTEGER)
        END AS dfamount
    FROM
        xaction AS t
        LEFT JOIN account AS sa ON t.src = sa.name
        LEFT JOIN account AS da ON t.dst = da.name
        LEFT JOIN currency ON 
            t.currency != $currency AND
            (t.srcamount IS NULL OR sa.currency != $currency ) AND
            (t.dstamount IS NULL OR da.currency != $currency ) AND 
            t.currency = currency.name;
    ");

$cstmt->execute(); //get currency details
$cstmt->bindColumn(1,$oldrate);
$cstmt->bindColumn(2,$oldpriority);
$cstmt->fetch(PDO::FETCH_BOUND);

// We now go through all currencies adjusting relative priorities so that new default currency is always first
$astmt->execute();
$astmt->closeCursor();
?><selector>
    <div id=dc_description><?php echo $_SESSION['dc_description']; ?></div>
    <input type="hidden" name="version" value="<?php echo $_SESSION['config_version']; ?>" />
    <input type="hidden" name="key" value="<?php echo $_SESSION['key'];?>" />
    <div class="currency">
        <select id="currencyselector" name="currency">
<?php            

$result = $db->query('SELECT * FROM currency WHERE display = 1 ORDER BY priority ASC;');
$currencies = Array();
while($row = $result->fetch(PDO::FETCH_ASSOC)) {
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
$result->closeCursor();
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

