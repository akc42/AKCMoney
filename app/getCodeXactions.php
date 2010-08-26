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
require_once('./inc/db.inc');
$starttime = mktime(0,0,0,substr($_SESSION['year_end'],0,2),substr($_SESSION['year_end'],2)+1,$_SESSION['year']-1);
$endtime = mktime(23,59,59,substr($_SESSION['year_end'],0,2),substr($_SESSION['year_end'],2),$_SESSION['year']);
$stmt = $db->prepare("SELECT type FROM code WHERE id = ? ;");
$stmt->bindValue(1,$_POST['code']);


$db->beginTransaction();

$stmt->execute();
$codetype = $stmt->fetchColumn();
$stmt->closeCursor();

switch ($codetype) {
case 'C':
case 'R':
case 'B':
    $stmt = $db->prepare("
    SELECT
        id,t.date AS date,version, description, rno, repeat, dfamount AS amount,
        src,srccode, dst, dstcode
    FROM 
        dfxaction AS t, account AS a
    WHERE
        t.date >= ? AND t.date <= ? AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = ? ) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = ? ))
    ORDER BY t.date ASC
        ");
    $stmt->bindValue(1,$starttime);
    $stmt->bindValue(2,$endtime);
    $stmt->bindValue(3,$_SESSION['domain']);
    $stmt->bindValue(4,$_POST['code']);
    $stmt->bindValue(5,$_POST['code']);
    break;
case 'A':
    $stmt = $db->prepare("
    SELECT
        t.id AS id,t.date AS date,version, t.description AS description, rno, repeat, 
        CASE 
            WHEN t.date < ? AND t.date + 94608000 >= ? THEN dfamount/3
            WHEN t.date >= ? THEN (CAST((? - t.date) AS REAL)/94608000) * dfamount
            ELSE (CAST((t.date + 94608000 - ?) AS REAL)/94608000) * dfamount
        END AS amount,
        dfamount AS famount,
        src,srccode, dst, dstcode
    FROM 
        dfxaction AS t, account AS a, code AS c
    WHERE
        t.date >= ? - 94608000 AND t.date <= ? AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = ? AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode =  ? AND t.dstcode = c.id))
    ORDER BY t.date ASC
        ");

    $stmt->bindValue(1,$starttime);
    $stmt->bindValue(2,$endtime);
    $stmt->bindValue(3,$starttime);
    $stmt->bindValue(4,$endtime);
    $stmt->bindValue(5,$starttime);
    $stmt->bindValue(6,$starttime);
    $stmt->bindValue(7,$endtime);
    $stmt->bindValue(8,$_SESSION['domain']);
    $stmt->bindValue(9,$_POST['code']);
    $stmt->bindValue(10,$_POST['code']);
    break;
default:
?><error>Invalid Account Code Type.  Please Report This Error to an Administrator</error>
<?php
    $db->rollBack();
    exit;
}
?><div class="transactions">
<?php
$stmt->execute();
$r=0;
$cumulative = 0;
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $r++;
        $cumulative += $row['amount'];
        $dual = (!(is_null($row['src']) || is_null($row['dst'])));
?><div id="<?php echo 't'.$row['id']; ?>" class="xaction arow<?php if($r%2 == 0) echo ' even';?>">
    <div class="wrapper">    
        <input type="hidden" class="version" name="version" value="<?php echo $row['version']; ?>"/>
        <div class="date <?php
        if($row['repeat'] != 0) {
            echo ' repeat';
        } else {
            if ($row['date'] < time()) echo ' passed'; //only indicate passed if not indicating cleared
        }
       ?>" ><input type="hidden" name="xxdate" value="<?php echo $row['date'];?>" class="dateawait"/></div>
        <div class="ref"><?php echo $row['rno'];?></div>
        <div class="description<?php if ($dual) echo " dual";?>"><?php echo $row['description'];?></div>
        <div class="amount aamount<?php 
            if ($dual) echo ' dual';?>"><?php echo fmtAmount($row['amount']);?></div>
        <div class="amount cumulative<?php if ($dual) echo ' dual';?>"><?php echo fmtAmount((isset($row['famount']))?$row['famount']:$cumulative);?></div>
        <div class="taccount hidden">
            <span class=" src"><?php if(!is_null($row['src'])) echo $row['src'];?></span><?php if($dual) echo " -> ";?>
            <span class="dst"><?php if(!is_null($row['dst'])) echo $row['dst'];?></span>
        </div>
    </div>
</div>
<?php    
}
?></div>
$stmt->closeCursor();
$db->commit();
?>

