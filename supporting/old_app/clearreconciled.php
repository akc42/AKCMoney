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

require_once('./inc/db.inc');
if(!$user['isAdmin']) die('insufficient permissions');
$sstmt = $db->prepare("SELECT version,src,dst FROM xaction WHERE id= ? ;");
$sstmt->bindValue(1,$_POST['tid']);


$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();
$row=$sstmt->fetch(PDO::FETCH_ASSOC);
$sstmt->closeCursor();
if (!isset($row['version']) || $row['version'] != $_POST['version'] ) {
?><error>Someone else has updated this transaction in parallel with you.  In order to ensure you are working with the latest version we
are going to update the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] + 1;
if($_POST['account'] == $row['src']) {
$uxs = $db->prepare("
    UPDATE xaction SET
        version = version + 1,
        srcclear = 0
    WHERE id = ? ;
    ");
} else {
$uxs = $db->prepare("
    UPDATE xaction SET
        version = version + 1,
        dstclear = 0
    WHERE id = ? ;
    ");
}
$uxs->bindValue(1,$_POST['tid']);
$uxs->execute();
$uxs->closeCursor();
$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" version="<?php echo $version ?>" ></xaction>


