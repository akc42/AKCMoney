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

$db->exec("BEGIN EXCLUSIVE");

$db->exec("INSERT INTO xaction (src,currency) VALUES (".dbPostSafe($_POST['account']).",".dbPostSafe($_POST['currency']).");");
$row = $db->querySingle("SELECT * FROM xaction WHERE id = ".$db->lastInsertRowID(),true);
?><transaction>
<div id="<?php echo 't'.$row['id']; ?>" class="xaction arow">
    <div class="wrapper">    
        <input type="hidden" class="version" name="version" value="<?php echo $row['version']; ?>"/>
        <div class="date clickable<?php 
        if($row['repeat'] != 0) {
            echo " repeat";
        } else {
            if ($row['date'] < time()) echo " passed"; //only indicate passed if not indicating repeat
        }
       ?>" ><input type="hidden" name="xxdate" value="<?php echo $row['date'];?>" class="dateawait"/></div>
        <div class="ref"><?php echo $row['rno'];?></div>
        <div class="description clickable"><?php echo $row['description'];?></div>
        <div class="amount aamount clickable"><?php echo fmtAmount(0);?></div>
        <div class="amount cumulative"><?php echo fmtAmount(0);?></div>
        <div class="codetype"><div class="code_">&nbsp;</div><span class="codeid">0</span><span class="codedesc"></span></div>
    </div>
</div>
<?php

$db->exec("COMMIT");
?></transaction>
