<?php
/*
 	Copyright (c) 2010 Alan Chandler
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

$sstmt = $db->prepare("SELECT version FROM code WHERE id = ? ;");
$sstmt->bindValue(1,$_POST['id'],PDO::PARAM_INT);

$cstmt = $db->prepare("
    UPDATE code SET
        version = version + 1,
        type = ?,
        description = ? 
    WHERE id = ? ;
");
$cstmt->bindValue(1,$_POST['codetype']);
$cstmt->bindValue(2,$_POST['description']);
$cstmt->bindValue(3,$_POST['id'],PDO::PARAM_INT);

$db->exec("BEGIN IMMEDIATE;");

$sstmt->execute();
$version=$sstmt->fetchColumn();
$sstmt->closeCursor();
if ( $version != $_POST['version']) {
    //code with this name already exists so we cannot create one
?><error>It appears someone else is editing codes in parallel.  We need to reload the page to ensure you are working with consistent data</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}

$version++;
$cstmt->execute();
$cstmt->closeCursor();

?><code id="<?php echo $_POST['id']; ?>" version="<?php echo $version; ?>" ></code> 
<?php

$db->exec("COMMIT;");
?>
