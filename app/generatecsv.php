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

session_start();

function out_csv($row) {
    $out = '';
    foreach($row as $field) {
        if($out != '') $out.=',';
        $out .= '"'.str_replace('"','""',$field).'"';
    }
    $out .= "\r\n"; 
    echo $out;   
}

require_once('./inc/db.inc');
header("Content-Type: text/csv");
header('Content-Dispositon: attachment; filename="accounts.csv"');
	if(isset($GET['year'])) {
		$year = round($_GET['year']);
	} else {
		$year = round(date("Y"));
	}
	
	$result = $db->query("SELECT year_end FROM config LIMIT 1");
	$yearend = $result->fetchColumn();
	$result->closeCursor();

	/* start and end times of the financial year */

	$starttime = mktime(0,0,0,substr($yearend,0,2),substr($yearend,2)+1,$year-1);
	$endtime = mktime(23,59,59,substr($yearend,0,2),substr($yearend,2),$year);

//Standard Cost and Revenue Codes
$acrstmt = $db->prepare("
SELECT
    c.id AS cid, c.type AS ctype, c.description AS cdesc, sum(t.dfamount) AS tamount
              
FROM 
    dfxaction AS t, account AS a, code AS c
WHERE
    t.date >= ? AND t.date <= ? AND
    c.type = ? AND
    a.domain = ? AND (
    (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
    (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
GROUP BY
    c.id
ORDER BY cdesc COLLATE NOCASE ASC
    ");
$acrstmt->bindValue(1,$starttime,PDO::PARAM_INT);
$acrstmt->bindValue(2,$endtime,PDO::PARAM_INT);
$acrstmt->bindParam(3,$codetype);
$acrstmt->bindValue(4,$_GET['domain']);

$tcrstmt = $db->prepare("
SELECT
    t.id AS tid,t.date AS date,rno, t.description AS description, dfamount AS amount,
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
$tcrstmt->bindValue(1,$starttime,PDO::PARAM_INT);
$tcrstmt->bindValue(2,$endtime,PDO::PARAM_INT);
$tcrstmt->bindValue(3,$_GET['domain']);
$tcrstmt->bindParam(4,$codeid,PDO::PARAM_INT);
$tcrstmt->bindParam(5,$codeid,PDO::PARAM_INT);

//Asset Codes, where depreciation Matters
$aastmt = $db->prepare("
SELECT
    c.id AS cid, c.type AS ctype, c.description AS cdesc,
    sum(
        CASE 
            WHEN t.date < ? AND t.date + 94608000 >= ? THEN dfamount/3
            WHEN t.date >= ? THEN (CAST((? - t.date) AS REAL)/94608000) * dfamount
            ELSE (CAST((t.date + 94608000 - ?) AS REAL)/94608000) * dfamount
        END
    ) AS tamount
              
FROM 
    dfxaction AS t, account AS a, code AS c
WHERE
    t.date >= ? - 94608000 AND t.date <= ? AND
    c.type = 'A' AND
    a.domain = ? AND (
    (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
    (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
GROUP BY
    c.id
ORDER BY cdesc COLLATE NOCASE ASC
    ");
$aastmt->bindValue(1,$starttime,PDO::PARAM_INT);
$aastmt->bindValue(2,$endtime,PDO::PARAM_INT);
$aastmt->bindValue(3,$starttime,PDO::PARAM_INT);
$aastmt->bindValue(4,$endtime,PDO::PARAM_INT);
$aastmt->bindValue(5,$starttime,PDO::PARAM_INT);
$aastmt->bindValue(6,$starttime,PDO::PARAM_INT);
$aastmt->bindValue(7,$endtime,PDO::PARAM_INT);
$aastmt->bindValue(8,$_GET['domain']);

$tastmt = $db->prepare("
SELECT
    t.id AS tid,t.date AS date,rno, t.description AS description, 
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

$tastmt->bindValue(1,$starttime,PDO::PARAM_INT);
$tastmt->bindValue(2,$endtime,PDO::PARAM_INT);
$tastmt->bindValue(3,$starttime,PDO::PARAM_INT);
$tastmt->bindValue(4,$endtime,PDO::PARAM_INT);
$tastmt->bindValue(5,$starttime,PDO::PARAM_INT);
$tastmt->bindValue(6,$starttime,PDO::PARAM_INT);
$tastmt->bindValue(7,$endtime,PDO::PARAM_INT);
$tastmt->bindValue(8,$_GET['domain']);
$tastmt->bindParam(9,$codeid,PDO::PARAM_INT);
$tastmt->bindParam(10,$codeid,PDO::PARAM_INT);

//Balance Codes, where source/destination determines the sign
$abstmt = $db->prepare("
    SELECT
        c.id AS cid, c.type AS ctype, c.description AS cdesc,
        sum(
            CASE WHEN t.src = a.name THEN -t.dfamount
            ELSE t.dfamount
            END) AS tamount
                  
    FROM 
        dfxaction AS t, account AS a, code AS c
    WHERE
        t.date >= ? AND t.date <= ? AND
        c.type = 'B' AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
    GROUP BY
        c.id
    ORDER BY cdesc COLLATE NOCASE ASC
");
$abstmt->bindValue(1,$starttime,PDO::PARAM_INT);
$abstmt->bindValue(2,$endtime,PDO::PARAM_INT);
$abstmt->bindValue(3,$_GET['domain']);
        
$tbstmt = $db->prepare("
    SELECT
        t.id AS tid,t.date AS date,rno, t.description AS description, 
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


$tbstmt->bindValue(1,$starttime,PDO::PARAM_INT);
$tbstmt->bindValue(2,$endtime,PDO::PARAM_INT);
$tbstmt->bindValue(3,$_GET['domain']);
$tbstmt->bindParam(4,$codeid,PDO::PARAM_INT);
$tbstmt->bindParam(5,$codeid,PDO::PARAM_INT);

out_csv(array("tid","date","ref","description","amount","full amount","account","code","type","description","total"));
$profit = 0;

$db->beginTransaction();

/*
    Deal with repeating entries, by copying any that are below the repeat threshold to their
    new repeat position, and removing the repeat flag from the current entry.
    
    
    IMPORTANT NOTE - We MUST rollback at the end of all of this, so these updates to the database don't remain.
*/
    $repeats_to_do = true;
    $stmt = $db->prepare('SELECT * FROM xaction WHERE repeat <> 0 AND date <= ? ;');
    $stmt->bindValue(1,$endtime,PDO::PARAM_INT);
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
            if ($row['date'] < $endtime) $repeats_to_do = true; //still have to do some more after this, since this didn't finish the job
            $ins->execute(array($row['date'],$row['src'],$row['dst'],$row['srcamount'],$row['dstamount'],$row['srccode'],$row['dstcode'],
                                $row['rno'],$row['repeat'],$row['currency'],$row['amount'],$row['description']));
            $ins->closeCursor();
        }
        $stmt->closeCursor();
    }
	




$codetype="C";
$acrstmt->execute();

while($row = $acrstmt->fetch(PDO::FETCH_NUM)) { 
    $codeid = $row[0];
    $tcrstmt->execute();
    while($trow = $tcrstmt->fetch(PDO::FETCH_NUM)) {
        $trow[1]=date('d-M-Y',$trow[1]);
        $trow[4] = fmtAmount($trow[4]);
        if($trow[6] == $codeid) {
            $trow[6] = $trow[5];
        } else {
            $trow[6] = $trow[7];
        }
        $trow[5] = null;
        $trow[7] = $codeid;
        unset($trow[8]);
        out_csv($trow);
    }
    $tcrstmt->closeCursor();
    $profit -= $row[3];
    $row[3]=fmtAmount($row[3]);
    out_csv(array_merge(array(null,null,null,null,null,null,null),$row));
}
$acrstmt->closeCursor();

$aastmt->execute();
while($row = $aastmt->fetch(PDO::FETCH_NUM)) { 
    $codeid = $row[0];
    $tastmt->execute();
    while($trow = $tastmt->fetch(PDO::FETCH_NUM)) {
        $trow[1]=date('d-M-Y',$trow[1]);
        $trow[4] = fmtAmount($trow[4]);
        $trow[5] = fmtAmount($trow[5]);
        if($trow[7] != $codeid) {
            $trow[6] = $trow[8];
        }
        $trow[7] = $codeid;
        unset($trow[8]);
        unset($trow[9]);
        out_csv($trow);
    }
    $tastmt->closeCursor();
    $profit -= $row[3];
    $row[3]=fmtAmount($row[3]);
    out_csv(array_merge(array(null,null,null,null,null,null,null),$row));
}
$aastmt->closeCursor();
unset($aastmt);
unset($tastmt);

$codetype="R";
$acrstmt->execute();

while($row = $acrstmt->fetch(PDO::FETCH_NUM)) { 
    $codeid = $row[0];
    $tcrstmt->execute();
    while($trow = $tcrstmt->fetch(PDO::FETCH_NUM)) {
        $trow[1]=date('d-M-Y',$trow[1]);
        $trow[4] = fmtAmount($trow[4]);
        if($trow[6] == $codeid) {
            $trow[6] = $trow[5];
        } else {
            $trow[6] = $trow[7];
        }
        $trow[5] = null;
        $trow[7] = $codeid;
        unset($trow[8]);
        out_csv($trow);
    }
    $tcrstmt->closeCursor();
    $profit += $row[3];
    $row[3]=fmtAmount($row[3]);
    out_csv(array_merge(array(null,null,null,null,null,null,null),$row));
}
$acrstmt->closeCursor();
unset($acrstmt);
unset($tcrstmt);

$abstmt->execute();

while($row = $abstmt->fetch(PDO::FETCH_NUM)) { 
    $codeid = $row[0];
    $tbstmt->execute();
    while($trow = $tbstmt->fetch(PDO::FETCH_NUM)) {
        $trow[1]=date('d-M-Y',$trow[1]);
        $trow[4] = fmtAmount($trow[4]);
        if($trow[6] == $codeid) {
            $trow[6] = $trow[5];
        } else {
            $trow[6] = $trow[7];
        }
        $trow[5] = null;
        $trow[7] = $codeid;
        unset($trow[8]);
        out_csv($trow);
    }
    $tbstmt->closeCursor();
    $row[3]=fmtAmount($row[3]);
    out_csv(array_merge(array(null,null,null,null,null,null,null),$row));
}
$abstmt->closeCursor();
unset($abstmt);
unset($tbstmt);

out_csv(array(null,null,null,null,null,null,null,0,null,"Overall Profit",fmtAmount($profit)));

$db->rollBack();
?>

