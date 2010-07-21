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
    This is a the initialisation file that is called to start the application
*/
session_start();
   
/*
    The following two session variables define the two key parameters for the installation.  Adjust
    these to match THIS INSTANCE of potentially multiple instances of the software on the server
*/ 

$_SESSION['inc_dir'] = '/home/alan/dev/money/inc/';
$_SESSION['database'] = '/home/alan/dev/money/db/money.db';

//Install if we haven't already
if(!file_exists($_SESSION['database'])) {
    $db = new Sqlite3($_SESSION['database']);
    $db->exec(file_get_contents($_SESSION['inc_dir'].'database.sql'));
    /*
    // TO BE ADDED WHEN THERE IS A NEXT UPDATE
} else {
    $db = new Sqlite3($_SESSION['database']);
//    $db->setAttribute(PDO::ATTR_TIMEOUT,25);  //set 25 second timeout on obtaining a lock

    $dbversion = $db->querySingle('SELECT db-version FROM config;');
    if($dbversion < 2) { //update to version 2
        $db->exec(file_get_contents($_SESSION['inc_dir'].'update1.sql'));
    }
*/ 
}
$charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
$key='';
for ($i=0; $i<30; $i++) $key .= $charset[(mt_rand(0,(strlen($charset)-1)))];
$_SESSION['key'] = $key;

header('Location: /money/index.php?key='.$key);  //get going with actual application
?>
