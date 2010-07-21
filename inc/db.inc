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

//This is a convenient place to force everything we output to not be cached 
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past

if( !isset($_REQUEST['key']) || $_REQUEST['key'] != $_SESSION['key'] ) die("<error>Hacking attempt - wrong key</error>");

function dbMakeSafe($value) {
	if (!get_magic_quotes_gpc()) {
		$value=pg_escape_string($value);
	}
	return "'".$value."'" ;
}
function dbPostSafe($text) {
  if (((string)$text) == '') return 'NULL';
  return dbMakeSafe(htmlentities($text,ENT_QUOTES,'UTF-8',false));
}
function fmtAmount($value) {
    return substr_replace(sprintf('%03d',$value),'.',-2,0);
}

$db = new SQLite3($_SESSION['database']);

//$db->setBusyTimeout(25000);  //set 25 second timeout on obtaining a lock
$db->exec("PRAGMA foreign_keys = ON");

?>
