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

if(!isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] ) die('Hacking attempt - wrong key');

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");
$result=dbQuery("SELECT version, home_account, extn_account FROM config;");
$row = dbFetch($result);
if ($row['version'] != $_POST['version'] ) {
?><error>Someone else has edited the configuration in parallel with you.  We will reload the page to ensure you have consistent data</error>
<?php
    $_SESSION['config_version'] = $row['version'];
    $_SESSION['extn_account'] = $row['extn_account'];
    $_SESSION['home_account'] = $row['home_account'];
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}
dbFree($result);

$_SESSION['extn_account'] = $_POST['extnaccount'];
$_SESSION['home_account'] = $_POST['homeaccount'];

$result = dbQuery("UPDATE config SET version = DEFAULT, home_account = ".dbPostSafe($_POST['homeaccount']).
                ", extn_account = ".dbPostSafe($_POST['extnaccount'])." RETURNING version;");

$row = dbFetch($result);
$_SESSION['config_version'] = $row['version'];

?><configuration version="<?php echo $row['version']; ?>" 
                home_account="<?php echo $_POST['homeaccount'];?>" 
                extn_account="<?php echo $_POST['extnaccount'];?>" ></configuration>
<?php
dbFree($result);
dbQuery("COMMIT ;");
?>
