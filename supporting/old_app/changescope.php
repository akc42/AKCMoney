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
if(!$user['isAdmin']) die('insufficient permissions');

$account = $_POST['account'];

$astmt = $db->prepare("SELECT dversion, startdate FROM account WHERE name = ? ;");
$astmt->bindValue(1,$account);

$ustmt = $db->prepare("UPDATE account SET dversion = dversion+1, startdate = ? WHERE name = ? ;");
$ustmt->bindValue(2,$account);

$db->exec("BEGIN IMMEDIATE");
$astmt->execute();
$row = $astmt->fetch(PDO::FETCH_ASSOC);

if (!isset($row['dversion']) || $row['dversion'] != $_POST['dversion'] ) {
?><error>It appears someone has updated the details of this account in parallel to you working on it.  We will reload the page to 
ensure you have the correct version</error>
<?php
    $astmt->closeCursor();
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['dversion'] + 1;
$astmt->closeCursor();

if($_POST['scope'] == 'U') {
    $ustmt->bindValue(1,null,PDO::PARAM_NULL);
} elseif ( $_POST['scope'] == 'S') {
    $ustmt->bindValue(1,0,PDO::PARAM_INT);
} elseif ($_POST['scope'] == 'D') {
    $ustmt->bindValue(1,$_POST['sdate'],PDO::PARAM_INT);
} else {
    //Something has gone wrong
?><error>Invalid scope setting so we are going to reload the page for you to try again</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}


$ustmt->execute();
$ustmt->closeCursor();

?><startdate version="<?php echo $version; ?>"></startdate>
<?php
$db->exec("COMMIT");
?>
