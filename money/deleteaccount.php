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


//Do all the preparation before starting the transaction - that way the transaction is over quicker
$vstmt = $db->prepare("SELECT dversion FROM account WHERE name = ? ;");
$dstmt = $db->prepare("DELETE FROM account WHERE name = ? ;");
$vstmt->bindValue(1,$_POST['account']);
$dstmt->bindValue(1,$_POST['account']);

$db->exec("BEGIN IMMEDIATE");

$vstmt->execute();
$version = $vstmt->fetchColumn();
$vstmt->closeCursor();
if ($version != $_POST['dversion']) {
?><error>It appears someone else is editing this account in parallel.  We cannot delete it in this case and need to reload the page to ensure you are working with consistent data</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}

$dstmt->execute();
$dstmt->closeCursor();

$db->exec("COMMIT");

?><status>OK</status>

