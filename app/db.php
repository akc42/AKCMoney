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

	if (!defined('MONEY'))
		die('Hacking attempt...');

    require_once('settings.php');
    
	pg_connect("host=$dbserver dbname=$dbname user=$dbuser password=$dbpassword") 
			or die('Could not connect to database: ' . pg_last_error());
	function dbQuery($sql) {
		$result = pg_query($sql);
		if (!$result) {
			echo '<tt>';
			echo "<br/><br/>\n";
			print_r(debug_backtrace());			
			echo "<br/><br/>\n";
			echo $sql;
			echo "<br/><br/>\n\n";
			echo pg_last_error();
			echo "<br/><br/>\n\n";
			echo '</tt>';
			die('<p>Please inform <i>alan@chandlerfamily.org.uk</i> that a database query failed and include the above text.<br/><br/>Thank You</p>');
		}
		return $result;
	}
	function dbMakeSafe($value) {
		if (!get_magic_quotes_gpc()) {
			$value=pg_escape_string($value);
		}
		return "'".$value."'" ;
	}
	function dbPostSafe($text) {
	  if ($text == '') return 'NULL';
	  return dbMakeSafe(htmlentities($text,ENT_QUOTES,'UTF-8',false));
	}
	function dbPostBoolean($text) {
	  if ($text == '') return 'NULL';
	  return ($text == 't')?'TRUE':'FALSE';
	}
	function dbNumRows($result) {
		return pg_num_rows($result);
	}
	function dbFetch($result) {
		return pg_fetch_assoc($result);
	}
	function dbFree($result){
		pg_free_result($result);
	}
	function dbRestartQuery($result) {
		pg_result_seek($result,0);
	}
	function fmtAmount($value) {
        return substr_replace(sprintf('%03d',$value),'.',-2,0);
    }

?>
