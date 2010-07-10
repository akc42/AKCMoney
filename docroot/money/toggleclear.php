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
$result=dbQuery("SELECT id, version,src,dst FROM transaction WHERE id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
dbFree($result);
if ($row['version'] != $_POST['version'] ) {
?><error>Someone else has updated this transaction in parallel with you.  In order to ensure you are working with the latest version we
are going to update the page</error>
<?php
    dbQuery("ROLLBACK;");
    exit;
}
$sql = "UPDATE transaction SET version = DEFAULT, ";
if($_POST['account'] == $row['src']) {
    $sql .= "srcclear = ";
} else {
    $sql .= "dstclear = ";
}
$sql .= ($_POST['clear'] == 'true')? 'TRUE' : 'FALSE' ;
$sql .= ' WHERE id = '.dbPostSafe($_POST['tid']).' RETURNING version;';
$result = dbQuery($sql);

$row = dbFetch($result);
$version = $row['version'];
dbFree($result);

dbQuery("COMMIT;");
?><xaction tid="<?php echo $_POST['tid']; ?>" clear="<?php echo $_POST['clear']; ?>" version="<?php echo $version ?>" ></xaction>


