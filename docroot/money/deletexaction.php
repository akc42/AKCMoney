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
require_once($_SESSION['inc_dir'].'db.inc');


$db->exec("BEGIN IMMEDIATE");

$version=$db->querySingle("SELECT version FROM transaction WHERE id=".dbMakeSafe($_POST['tid']));

if ($version != $_POST['version'] ) {
?><error>It appears that someone else has been editing this transaction in parallel to you.  We have not deleted it, and are going to
reload the page so that we can ensure you see consistent data before taking this major step.</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$db->exec("DELETE FROM transaction WHERE id = ".dbMakeSafe($_POST['tid']).";");
$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" ></xaction>
