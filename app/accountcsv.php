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
$account = str_replace(" ","_",$_GET['account']);
header("Content-Disposition: attachment;filename=accounts-$account.csv\r\n");
header("Content-Type: text/csv\r\n");
require_once('./inc/db.inc');

$dstmt = $db->query('SELECT name,description FROM currency WHERE priority = 0');
$row = $dstmt->fetch(PDO::FETCH_ASSOC);
$dc = $row['name'];
$cname = $row['description'];

$stmt = $db->prepare("
    SELECT
        t.*,
        c.type AS ctype,
        c.description AS cdesc
    FROM (
        SELECT
            d.id AS tid,
            d.date AS seconds,
            date(d.date,'unixepoch') AS tdate,
            d.rno,
            d.description,
            CAST(-dfamount AS REAL)/100.0 AS amount,
            x.srcclear AS reconciled,  
            d.srccode AS cid,
            d.dst AS otheraccount,
            x.currency,
            CAST (-x.amount AS REAL)/100.0  AS currencyamount,
            d.repeat
        FROM 
            dfxaction d 
            JOIN xaction x ON d.id = x.id
        WHERE d.src = ?
        UNION
        SELECT
            d.id AS tid,
            d.date AS seconds,
            date(d.date,'unixepoch') AS tdate,
            d.rno,
            d.description,
            CAST(dfamount AS REAL)/100.0 AS amount,
            x.dstclear AS reconciled,  
            d.dstcode AS cid,
            d.src AS otheraccount,
            x.currency,
            CAST(x.amount AS REAL)/100.0  AS currencyamount,
            d.repeat
        FROM 
            dfxaction d 
            JOIN xaction x ON d.id = x.id
        WHERE d.dst = ?
    ) t 
    LEFT JOIN code c ON c.id = t.cid
    ORDER BY seconds");


out_csv(array("tid","date","ref","description","amount","reconciled","cid","other account","currency","currency amount","repeat","cid type","cid description"));
    $stmt->bindValue(1,$_GET['account']);
    $stmt->bindValue(2,$_GET['account']);
    $stmt->execute();
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        unset($row['seconds']);
        out_csv($row);
    }
    $stmt->closeCursor();
out_csv(Array());
out_csv(Array());
out_csv(Array());
out_csv(Array(null,null,null,"All transactions have been normalised to the default currency",null,null,null,$cname,$dc));    
?>

