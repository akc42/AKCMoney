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

$sstmt = $db->prepare("SELECT version FROM domain WHERE name = ? ;");
$sstmt->bindValue(1,$_POST['original']);

$dstmt = $db->prepare("
    UPDATE domain SET
        name = ? ,
        version = version + 1,
        description = ? 
    WHERE name = ? ;
");
$dstmt->bindValue(1,$_POST['domain']);
$dstmt->bindValue(2,$_POST['description']);
$dstmt->bindValue(3,$_POST['original']);

$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();
$version=$sstmt->fetchColumn();
$sstmt->closeCursor();
if ( $version != $_POST['version']) {
    //domain with this name already exists so we cannot create one
?><error>It appears someone else is editing domains in parallel.  We need to reload the page to ensure you are working with consistent data</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}

if($_POST['original'] != $_POST['domain']) {
    //planning on changing the name - just check the new name has not been created in the meantime
    $sstmt = $db->prepare("SELECT COUNT(*) FROM domain WHERE name = ? ;");
    $sstmt->bindValue(1,$_POST['domain']);
    $sstmt->execute();
    $count = $sstmt->fetchColumn();
    $sstmt->closeCursor();
    if($count > 0) {
    //its there - this must mean someone just put it there
?><error>You have attempted to rename the domain to one that already exists.  We will reload the page in case someone else created it in parallel with you</error>
<?php
        $db->exec("ROLLBACK");
        exit;
    }

}
$version++;
$dstmt->execute();
$dstmt->closeCursor();

?><domain name="<?php echo $_POST['domain']; ?>" version="<?php echo $version; ?>" ></domain> 
<?php

$db->exec("COMMIT");
?>
