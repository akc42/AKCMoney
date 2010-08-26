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

$ustmt = $db->prepare("UPDATE config SET version = ?, home_account = ? , extn_account = ? ;");
$ustmt->bindParam(1,$version,PDO::PARAM_INT);
$ustmt->bindValue(2,$_POST['homeaccount']);
$ustmt->bindValue(3,$_POST['extnaccount']);

$db->exec("BEGIN IMMEDIATE");

$result = $db->query("SELECT version, home_account, extn_account FROM config;");
$row = $result->fetch(PDO::FETCH_ASSOC);
if ($row['version'] != $_POST['version'] ) {
?><error>Someone else has edited the configuration in parallel with you.  We will reload the page to ensure you have consistent data</error>
<?php
    $_SESSION['config_version'] = $row['version'];
    $_SESSION['extn_account'] = $row['extn_account'];
    $_SESSION['home_account'] = $row['home_account'];
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] + 1;

$_SESSION['extn_account'] = $_POST['extnaccount'];
$_SESSION['home_account'] = $_POST['homeaccount'];

$ustmt->execute();
$ustmt->closeCursor();

$_SESSION['config_version'] = $version;

?><configuration version="<?php echo $version; ?>" 
                home_account="<?php echo $_POST['homeaccount'];?>" 
                extn_account="<?php echo $_POST['extnaccount'];?>" ></configuration>
<?php
$db->exec("COMMIT");
?>
