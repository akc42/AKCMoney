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
$starttime = mktime(0,0,0,substr($_SESSION['year_end'],0,2),substr($_SESSION['year_end'],2)+1,$_SESSION['year']-1);
$endtime = mktime(23,59,59,substr($_SESSION['year_end'],0,2),substr($_SESSION['year_end'],2),$_SESSION['year']);

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
ORDER BY c.id ASC
    ");
$acrstmt->bindValue(1,$starttime);
$acrstmt->bindValue(2,$endtime);
$acrstmt->bindParam(3,$codetype);
$acrstmt->bindValue(4,$_SESSION['domain']);

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
$tcrstmt->bindValue(1,$starttime);
$tcrstmt->bindValue(2,$endtime);
$tcrstmt->bindValue(3,$_SESSION['domain']);
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
ORDER BY c.id ASC
    ");
$aastmt->bindValue(1,$starttime);
$aastmt->bindValue(2,$endtime);
$aastmt->bindValue(3,$starttime);
$aastmt->bindValue(4,$endtime);
$aastmt->bindValue(5,$starttime);
$aastmt->bindValue(6,$starttime);
$aastmt->bindValue(7,$endtime);
$aastmt->bindValue(8,$_SESSION['domain']);

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

$tastmt->bindValue(1,$starttime);
$tastmt->bindValue(2,$endtime);
$tastmt->bindValue(3,$starttime);
$tastmt->bindValue(4,$endtime);
$tastmt->bindValue(5,$starttime);
$tastmt->bindValue(6,$starttime);
$tastmt->bindValue(7,$endtime);
$tastmt->bindValue(8,$_SESSION['domain']);
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
    ORDER BY c.id ASC
");
$abstmt->bindValue(1,$starttime);
$abstmt->bindValue(2,$endtime);
$abstmt->bindValue(3,$_SESSION['domain']);
        
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


$tbstmt->bindValue(1,$starttime);
$tbstmt->bindValue(2,$endtime);
$tbstmt->bindValue(3,$_SESSION['domain']);
$tbstmt->bindParam(4,$codeid,PDO::PARAM_INT);
$tbstmt->bindParam(5,$codeid,PDO::PARAM_INT);

out_csv(array("tid","date","ref","description","amount","full amount","account","code","type","description","total"));
$profit = 0;

$db->beginTransaction();

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

$db->commit();
?>
