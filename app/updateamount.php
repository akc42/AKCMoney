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

$result=dbQuery("SELECT id, version, amount, dstamount, srcamount FROM transaction WHERE id=".dbMakeSafe($_POST['tid']).";");
$row = dbFetch($result);
if ($row['version'] != $_POST['version'] ) {
?><error>It appears that someone else has been editing this transaction in parallel to you.  In order to ensure you have consistent
information we are going to reload the page</error>
<?php
    dbFree($result);
    dbQuery("ROLLBACK;");
    exit;
}


$amount = (int)($_POST['amount']*100); //convert amount back to be a big int.
$sql = "UPDATE transaction SET version = DEFAULT,";
if($_POST['issrc'] == 'true') {
    $amount = -$amount;
}
/* if either srcamount or dstamount are not null, we need to scale them to represent the change in value of amount.  It
    should be noted that this routine is only called where one of src or dst is the same currency as the transaction, but that
    does not imply that the other account (dst or src) is also of the same currency - so it might need updating and here we check */
if ($row['amount'] != 0) { 
    $scaling = $amount/$row['amount'];
    if (!is_null($row['srcamount'])) {
        $sql .= ' srcamount = '.((int)($scaling*$row['srcamount']));
    }
    if (!is_null($row['dstamount'])) {
        $sql .= ' dstamount = '.((int)($scaling*$row['dstamount']));
    }
}
dbFree($result);

$sql .= ' amount = '.$amount.' WHERE id = '.dbPostSafe($_POST['tid']).' RETURNING version;';
$result = dbQuery($sql);
$row = dbFetch($result);
$version = $row['version'];
dbFree($result);
dbQuery("COMMIT;");
?><xaction tid="<?php echo $_POST['tid']; ?>" version="<?php echo $version ?>" ></xaction>
