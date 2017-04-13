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

$sstmt = $db->prepare("
    SELECT
        t.version AS version, t.amount AS amount, tc.rate AS trate,
        src, srcamount, sc.rate AS srate,
        dst, dstamount, dc.rate AS drate
    FROM xaction AS t
    JOIN currency AS tc ON t.currency = tc.name
    LEFT JOIN account AS sa ON t.src = sa.name
    LEFT JOIN currency AS sc ON sa.currency = sc.name
    LEFT JOIN account AS da ON t.dst = da.name
    LEFT JOIN currency AS dc ON da.currency = dc.name
    WHERE id= ? ;");
$sstmt->bindValue(1,$_POST['tid']);

$ustmt = $db->prepare("
    UPDATE xaction SET
        version = version + 1 ,
        srcamount = ?,
        dstamount = ?,
        amount = ?
    WHERE id = ? ;
");
$ustmt->bindValue(4,$_POST['tid']);

$db->exec("BEGIN IMMEDIATE");

$sstmt->execute();

$row = $sstmt->fetch(PDO::FETCH_ASSOC);

if (!isset($row['version']) || $row['version'] != $_POST['version'] ) {
?><error>It appears that someone else has been editing this transaction in parallel to you.  In order to ensure you have consistent
information we are going to reload the page</error>
<?php
    $db->exec("ROLLBACK");
    exit;
}
$version = $row['version'] + 1;

$amount = round((float)($_POST['amount'])*100); //convert amount back to be a big int.
if($_POST['account'] == $row['src']) {
    $amount = -$amount;
}
/* if either srcamount or dstamount are not null, we need to scale them to represent the change in value of amount.  It
    should be noted that this routine is only called where one of src or dst is the same currency as the transaction, but that
    does not imply that the other account (dst or src) is also of the same currency - so it might need updating and here we check */

if ($row['amount'] != 0) {
    $scaling = $amount/$row['amount'];
}

if (!is_null($row['srcamount'])) {
    if ($row['amount'] != 0) {
        $ustmt->bindValue(1,round($scaling*$row['srcamount']));
    } else {
        $ustmt->bindValue(1,round($amount*$row['srate']/$row['trate']));
    }
} else {
    $ustmt->bindValue(1,NULL);
}
if (!is_null($row['dstamount'])) {
    if ($row['amount'] != 0) {
        $ustmt->bindValue(2,round($scaling*$row['dstamount']));
    } else {
        $ustmt->bindValue(2,round($amount*$row['drate']/$row['trate']));
    }
} else {
    $ustmt->bindValue(2,NULL);
}
$ustmt->bindValue(3,$amount);
$ustmt->execute();
$ustmt->closeCursor();
$db->exec("COMMIT");

?><xaction tid="<?php echo $_POST['tid']; ?>" version="<?php echo $version ?>" ></xaction>
