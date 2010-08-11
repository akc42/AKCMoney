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


$db->exec("BEGIN IMMEDIATE");

$version = $db->querySingle("SELECT bversion FROM account WHERE name = ".dbMakeSafe($_POST['account'])." ;");

if ( $version != $_POST['bversion'] ) {
?><error>It appears someone has updated the details of this account in parallel to you working on it.  We will reload the page to 
ensure you have the correct version</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}

$version++;
$balance = round(100*$_POST['balance']);
$db->exec("UPDATE account SET bversion = $version, balance = $balance WHERE name = ".dbMakeSafe($_POST['account']).";");

?><balance version="<?php echo $version; ?>"><?php echo fmtAmount($balance) ; ?></balance>
<?php
$db->exec("COMMIT");
?>
