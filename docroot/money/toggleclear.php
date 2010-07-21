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
require_once($_SESSION['inc_dir'].'db.inc');


$db->exec("BEGIN IMMEDIATE");

$row=$db->querySingle("SELECT id, version,src,dst FROM xaction WHERE id=".dbMakeSafe($_POST['tid']).";",true);
if (!isset($row['version']) || $row['version'] != $_POST['version'] ) {
?><error>Someone else has updated this transaction in parallel with you.  In order to ensure you are working with the latest version we
are going to update the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] +1;

$sql = "UPDATE xaction SET version = $version, ";
if($_POST['account'] == $row['src']) {
    $sql .= "srcclear = ";
} else {
    $sql .= "dstclear = ";
}
$sql .= ($_POST['clear'] == 'true')? '1' : '0' ;
$sql .= ' WHERE id = '.dbPostSafe($_POST['tid']).';';
$db->exec($sql);
$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" clear="<?php echo $_POST['clear']; ?>" version="<?php echo $version ?>" ></xaction>


