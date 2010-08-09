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

$version=$db->querySingle("SELECT dversion FROM account WHERE name =".dbMakeSafe($_POST['original']).";");
if ( $version != $_POST['dversion']) {
    //account with this name already exists so we cannot create one
?><error>It appears someone else is editing accounts in parallel.  We need to reload the page to ensure you are working with consistent data</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version++;


if($_POST['original'] != $_POST['account']) {
    //planning on changing the name - just check the new name has not been created in the meantime
    if($db->querySingle("SELECT COUNT(*) FROM account WHERE name =".dbMakeSafe($_POST['account']).";") > 0) {
    //its there - this must mean someone just put it there
?><error>You have attempted to rename the account to one that already exists.  We will reload the page in case someone else created it in parallel with you</error>
<?php
        $db->exec("ROLLBACK");
        exit;
    }

}
$db->exec("UPDATE account SET name = ".dbPostSafe($_POST['account']).
        ", dversion = $version, currency = ".dbPostSafe($_POST['currency']).", domain = ".dbPostSafe($_POST['domain']).
        " WHERE name = ".dbPostSafe($_POST['original']).";");

?><account name="<?php echo $_POST['account']; ?>" version="<?php echo $version; ?>" ></account> 
<?php

$db->exec("COMMIT");
?>
