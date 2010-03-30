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

if( !isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] ) die("<error>Hacking attempt - wrong key should have been '".$_SESSION['key']."'</error>");

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");

$result=dbQuery("SELECT name FROM account WHERE name =".dbMakeSafe($_POST['account']).";");

if (!($row = dbFetch($result)) ) {
    dbFree($result);
    dbQuery("ROLLBACK;");
/* Refresh the page and session.  If this account is no longer there (as is suspected) this will then cause an error
    message to be displayed - but allowing the user to restart without the account selected */
    header("Location: index.php?account=".$_POST['account']."&refresh=1"); 
    exit;
}
dbFree($result);

$result = dbQuery("INSERT INTO transaction (id,version, description,".(($_POST['issrc'] == "true")?"src":"dst").
            ",currency) VALUES(DEFAULT,DEFAULT,'NEW TRANSACTION',".dbPostSafe($_POST['account']).
            ",".dbPostSafe($_POST['currency']).") RETURNING * ;");

$row = dbFetch($result);

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
    </div>
</div>
<?php
dbFree($result);
dbQuery("COMMIT;");
?></transaction>
