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
$stmt = $db->prepare("SELECT type FROM code WHERE id = ? ;");
$stmt->bindValue(1,$_POST['code'],PDO::PARAM_INT);


$db->beginTransaction();


$stmt->execute();
$codetype = $stmt->fetchColumn();
$stmt->closeCursor();

/*
    Deal with repeating entries, by copying any that are below the repeat threshold to their
    new repeat position, and removing the repeat flag from the current entry.
    
    
    IMPORTANT NOTE - We MUST rollback at the end of all of this, so these updates to the database don't remain.
*/
    $repeats_to_do = true;
    $stmt = $db->prepare('SELECT * FROM xaction WHERE (srccode = ? OR dstcode = ?) AND repeat <> 0 AND date <= ? ;');
    $stmt->bindValue(1,$_POST['code'],PDO::PARAM_INT);
    $stmt->bindValue(2,$_POST['code'],PDO::PARAM_INT);
    $stmt->bindValue(3,$_POST['end'],PDO::PARAM_INT);
    $upd = $db->prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
    $ins = $db->prepare('INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
                     repeat, currency, amount, description)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?);');
    while ($repeats_to_do) {
        $repeats_to_do = false; //lets be optimistic and plan to be done
        $stmt->execute();
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $upd->bindValue(1,$row['id']);
            $upd->execute();
            $upd->closeCursor();
            switch ($row['repeat']) {
                case 1:
                    $row['date'] += 604800 ;  //add on a week
                    break;
                case 2:
                    $row['date'] += 1209600 ; //add two weeks
                    break;
                case 3:
                    $row['date'] += date("t",$row['date']) * 86400 ; // a month (finds days in month and multiplies by seconds in a day)
                    break;
                case 4:
                    $row['date'] += date("t",mktime(0,0,0,date("m",$row['date'])+1,1,date("y",$row['date'])))*86400; //days in next month * seconds/day
                    break;
                case 5: 
                    $info = getdate($row['date']);
                    $row['date'] = mktime($info['hours'],$info['minutes'],$info['seconds'],$info['mon']+3,$info['mday'],$info['year']); //Quarterly
                    break;
                case 6:
                    $info = getdate($row['date']);
                    $row['date'] = mktime($info['hours'],$info['minutes'],$info['seconds'],$info['mon'],$info['mday'],$info['year']+1); //yearly
                    break;
               default:
                    $db->rollBack();
                    die('invalid repeat period in database, transaction id = '.$row['id']);
            }
            if ($row['date'] < $_POST['end']) $repeats_to_do = true; //still have to do some more after this, since this didn't finish the job
            $ins->execute(array($row['date'],$row['src'],$row['dst'],$row['srcamount'],$row['dstamount'],$row['srccode'],$row['dstcode'],
                                $row['rno'],$row['repeat'],$row['currency'],$row['amount'],$row['description']));
            $ins->closeCursor();
        }
        $stmt->closeCursor();
    }
	




switch ($codetype) {
case 'C':
case 'R':
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
    $stmt->bindValue(1,$_POST['start'],PDO::PARAM_INT);
    $stmt->bindValue(2,$_POST['end'],PDO::PARAM_INT);
    $stmt->bindValue(3,$_POST['domain'],PDO::PARAM_INT);
    $stmt->bindValue(4,$_POST['code'],PDO::PARAM_INT);
    $stmt->bindValue(5,$_POST['code'],PDO::PARAM_INT);
    break;
case 'B':
    $stmt = $db->prepare("
    SELECT
        id,t.date AS date,version, description, rno, repeat, 
        CASE 
            WHEN t.src = a.name THEN -dfamount
            ELSE dfamount 
        END AS amount,
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
    $stmt->bindValue(1,$_POST['start'],PDO::PARAM_INT);
    $stmt->bindValue(2,$_POST['end'],PDO::PARAM_INT);
    $stmt->bindValue(3,$_POST['domain'],PDO::PARAM_INT);
    $stmt->bindValue(4,$_POST['code'],PDO::PARAM_INT);
    $stmt->bindValue(5,$_POST['code'],PDO::PARAM_INT);
    break;
case 'A':
    $stmt = $db->prepare("
    SELECT
        t.id AS id,t.date AS date,t.version AS version, t.description AS description, rno, repeat, 
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
    $stmt->bindValue(1,$_POST['start'],PDO::PARAM_INT);
    $stmt->bindValue(2,$_POST['end'],PDO::PARAM_INT);
    $stmt->bindValue(3,$_POST['start'],PDO::PARAM_INT);
    $stmt->bindValue(4,$_POST['end'],PDO::PARAM_INT);
    $stmt->bindValue(5,$_POST['start'],PDO::PARAM_INT);
    $stmt->bindValue(6,$_POST['start'],PDO::PARAM_INT);
    $stmt->bindValue(7,$_POST['end'],PDO::PARAM_INT);
    $stmt->bindValue(8,$_POST['domain']);
    $stmt->bindValue(9,$_POST['code'],PDO::PARAM_INT);
    $stmt->bindValue(10,$_POST['code'],PDO::PARAM_INT);
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

$stmt->closeCursor();
$db->rollBack(); //It is VITALLY important that we rollBack, because we added a whole new set of xactions into the database and they must not remain
?></div>

