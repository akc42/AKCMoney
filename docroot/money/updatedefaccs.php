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
if(!isset($_SESSION['inc_dir'])) die('<error>AKC Money - session timed out and I do not know what instance of the application you were running.  Please restart</error>');
require_once($_SESSION['inc_dir'].'db.inc');


$db->exec("BEGIN IMMEDIATE");

$row= $db->querySingle("SELECT version, home_account, extn_account FROM config;",true);
if (!isset($row['version']) || $row['version'] != $_POST['version'] ) {
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

$db->exec("UPDATE config SET version = $version, home_account = ".dbPostSafe($_POST['homeaccount']).
                ", extn_account = ".dbPostSafe($_POST['extnaccount']).";");

$_SESSION['config_version'] = $version;

?><configuration version="<?php echo $version; ?>" 
                home_account="<?php echo $_POST['homeaccount'];?>" 
                extn_account="<?php echo $_POST['extnaccount'];?>" ></configuration>
<?php
$db->exec("COMMIT");
?>
