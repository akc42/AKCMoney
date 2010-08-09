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
if(!isset($_SESSION['inc_dir'])) die('<error>AKC Money - session timed out and I do not know what instance of the application you were running.  Please restart</error>');
require_once($_SESSION['inc_dir'].'db.inc');


$db->exec("BEGIN IMMEDIATE");


$version=$db->querySingle("SELECT version FROM xaction WHERE id=".dbMakeSafe($_POST['tid']).";");

if ( $version != $_POST['version'] ) {
?><error>It appears that someone else has been editing this transaction in parallel to you.  In order to ensure you have consistent
information we are going to reload the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version++;

$db->exec("UPDATE xaction SET version = $version , date = ".dbPostSafe($_POST['date'])." WHERE id = ".dbPostSafe($_POST['tid']).";");

$db->exec("COMMIT");
?><xaction tid="<?php echo $_POST['tid']; ?>" version="<?php echo $version ?>" ></xaction>
