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

$sstmt = $db->prepare("SELECT version FROM xaction WHERE id= ? ;");
$sstmt->bindValue(1,$_POST['tid']);

$ustmt = $db->prepare("UPDATE xaction SET version = version + 1 , date = ? WHERE id = ? ;");
$ustmt->bindValue(1,$_POST['date']);
$ustmt->bindValue(2,$_POST['tid']);

$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();
$version=$sstmt->fetchColumn();

if ( $version != $_POST['version'] ) {
?><error>It appears that someone else has been editing this transaction in parallel to you.  In order to ensure you have consistent
information we are going to reload the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version++;

$ustmt->execute();
$ustmt->closeCursor();

$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" version="<?php echo $version ?>" ></xaction>
