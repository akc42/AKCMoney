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

if(!isset($_POST['account'])) die('Hacking attempt - wrong parameters');

define ('MONEY',1);   //defined so we can control access to some of the files.
require_once('db.php');

dbQuery("BEGIN;");
$t = time();
dbQuery("INSERT INTO transaction (date,src,dst,rno,amount,namount,description) VALUES (".dbPostSafe($t).",".dbPostSafe($_POST['account']).", NULL,'    ', 0,0,' ');");
$result=dbQuery("SELECT currval('transaction_id_seq'::regclass);");
$row = dbFetch($result);
dbFree($result);
dbQuery("COMMIT;");
echo '{"tid":'.$row['currval'].',"date":'.$t.'}';
?>

