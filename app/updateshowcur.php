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

$ustmt = $db->prepare("UPDATE currency SET version = version + 1, priority = ?, display = ? WHERE name = ? ;");
$ustmt->bindValue(1,$_POST['priority']);
$ustmt->bindValue(2,($_POST['show'] == 'true')?1:0);
$ustmt->bindValue(3,$_POST['currency']);

$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();
$version = $sstmt->fetchColumn();
$sstmt->closeCursor();
if ( $version != $_POST['version'] ) {
?><error>It appears that someone else has been editing the configuration in parallel to you.  In order to ensure you have consistent
information we are going to reload the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version++;


$ustmt->execute();
$ustmt->closeCursor();

$db->exec("COMMIT");

?><show currency="<?php echo $_POST['currency']; ?>"
    status="<?php echo ($_POST['show'] == "true")?'show':'hide'; ?>" <?php 
        if (isset($_POST['priority'])) echo 'priority="'.$_POST['priority'].'"'; ?> version="<?php echo $version; ?>"></show>
