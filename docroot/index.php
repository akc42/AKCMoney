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

/* 
    This is a common instance file for defining instance specific data before directing the user to the 
    appropriate part of the application
*/
   
// Adjust the following for your installation

define('INC_DIR','/home/alan/dev/money/inc/');

define('DB_DIR','/home/alan/dev/money/db/');
    



//This is a convenient place to force everything we output to not be cached 
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // Date in the past

define('LOCK_WAIT_TIME',rand(5000,10000));  //time to wait to see if database is unlocked (between 5 and 10 ms)
class DBError extends Exception {

    function __construct ($message) {
        parent::__construct("<p> $messsage <br/></p>\n".
	                "<p>Please inform <i>alan@chandlerfamily.org.uk</i> that a database query failed and include the above text.\n".
	                "<br/><br/>Thank You</p>");
	}
    
};

function check_key() {
if( !isset($_POST['key']) || $_POST['key'] != $_SESSION['key'] ) die("<error>Hacking attempt - wrong key</error>");
}
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
function dbPostBoolean($text) {
  if ($text == '') return 'NULL';
  return ($text == 't')?'TRUE':'FALSE';
}

function dbBegin($ex) {
    global $db;
    $ext = $ex?'EXCLUSIVE':'';
    while (!@$db->exec("BEGIN $ext")) {
        if($db->lastErrorCode() != SQLITE_BUSY) {
            throw new DBError("In trying to BEGIN $ext got Database Error:".$db->lastErrorMsg());
        }
        usleep(LOCK_WAIT_TIME);
    }
}

function dbEnd() {
    global $db;
    $db->exec("COMMIT");
}
function dbRollBack() {
    global $db;
    $db->exec("ROLLBACK");
}    

    
//Install if we haven't already
if(!file_exists(DB_DIR.'money.db')) {
    $db = new SQLite3(DB_DIR.'money.db');
    $db->exec(file_get_contents(INC_DIR.'database.sql'));
} else {
    $db = new SQLite3(DB_DIR.'money.db');
}
$db->exec("PRAGMA foreign_keys = ON");

// if called without parameters then default to account
if(!isset($_REQUEST['q'])) $_REQUEST['q'] = 'account';

session_start();

require(INC_DIR.$_REQUEST['q'].'.php');  //do what we need to (will fail if doesn't exist)

