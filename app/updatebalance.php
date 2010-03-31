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
$result = dbQuery("SELECT name, bversion FROM account WHERE name = ".dbMakeSafe($_POST['account'])." ;");
if (!($row = dbFetch($result)) || $row['bversion'] != $_POST['bversion'] ) {
?><error>It appears someone has updated the details of this account in parallel to you working on it.  We will reload the page to 
ensure you have the correct version</error>
<?php
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}

dbFree($result);
$balance = round(100*$_POST['balance']);
$result = dbQuery("UPDATE account SET bversion = DEFAULT, balance = ".$balance.
    " WHERE name = ".dbMakeSafe($_POST['account'])." RETURNING bversion;");
$row = dbFetch($result);
?><balance version="<?php echo $row['bversion']; ?>"><?php echo fmtAmount($balance) ; ?></balance>
<?php
dbFree($result);
dbQuery("COMMIT ;");
?>
