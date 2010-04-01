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

if( !isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] ) die("<error>Hacking attempt - wrong key should have been '".$_SESSION['key']."'</error>");

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");

$result=dbQuery("SELECT name,dversion FROM account WHERE name =".dbMakeSafe($_POST['account']).";");

if (!($row = dbFetch($result))  || $row['dversion'] != $_POST['dversion']) {
    //account with this name already exists so we cannot create one
?><error>It appears someone else is editing accounts in parallel.  We need to reload the page to ensure you are working with consistent data</error>
<?php
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}
dbFree($result);

dbQuery("DELETE FROM account WHERE name = ".dbPostSafe($_POST['account'])." ;");

dbQuery("COMMIT;");
?><status>OK</status>

