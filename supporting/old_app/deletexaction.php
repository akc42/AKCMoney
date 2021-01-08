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

//prepare ahead of starting transaction - making transaction faster
$vstmt = $db->prepare("SELECT version FROM xaction WHERE id = ? ;");
$vstmt->bindValue(1,$_POST['tid']);
$dstmt = $db->prepare("DELETE FROM xaction WHERE id = ? ;");
$dstmt->bindValue(1,$_POST['tid']);

$db->exec("BEGIN IMMEDIATE");
$vstmt->execute();
$version = $vstmt->fetchColumn();
$vstmt->closeCursor();
if ($version != $_POST['version'] ) {
?><error>It appears that someone else has been editing this transaction in parallel to you.  We have not deleted it, and are going to
reload the page so that we can ensure you see consistent data before taking this major step.</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$dstmt->execute();
$dstmt->closeCursor();

$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" ></xaction>