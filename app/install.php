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

if(isset($_POST['dbname'])) {
/* Need to write out the settings.php file */
    file_put_contents("settings.php",'<?php'."\n".'$dbserver="'.$_POST['dbserver']."\";\n".'$dbport="'.$_POST['dbport']."\";\n"
        .'$dbname="'.$_POST['dbname']."\";\n".'$dbuser="'.$_POST['dbuser']."\";\n".'$dbpassword="'.$_POST['dbpassword']."\";\n?>");

    define ('MONEY',1);   //defined so we can control access to some of the files.    
    include('db.php');
}

function head_content() {
?>
	<title>AKC Money Install Page</title>
	<link rel="stylesheet" type="text/css" href="money.css"/>
	<!--[if lt IE 7]>
		<link rel="stylesheet" type="text/css" href="money-ie.css"/>
	<![endif]-->
<?php
}

function menu_items () {
}

function content() {

if(!isset($_POST['dbname'])) {
/* if we get here, then this is the first time this has been called, so we must put up a form to get data we beed */
    if(file_exists(dirname(__FILE__) . '/settings.php')) {
        require('settings.php');
    } else {
        $dbserver = "localhost";
        $dbport = "5432";
        $dbname = "money";
        $dbuser = "money";
        $dbpassword = "";
    }
?>  
    <h1>Setup Main Parameters to Access the Database</h1>
    <p>Please fill in the fields below to the correct values for your database and hit the submit button</p>
    <p>Before clicking submit create the database with the shell command "createdb money" where money is the name of your database.</p>
    <p>Once created give your database user the ownership of the database with "ALTER DATABASE money OWNER TO money;" </p>
    <form action="install.php" method="post">
        <table>
            <tbody>
                <tr><td>Database Server: </td><td><input type="text" name="dbserver" value="<?php echo $dbserver;?>"/></td>
                    <td>Port: </td><td><input type="text" name="dbport" value="<?php echo $dbport; ?>" /></td></tr>
                <tr><td>Database Name: </td><td><input type="text" name="dbname" value="<?php echo $dbname; ?>" /></td>
                    <td></td><td></td></tr>
                <tr><td>Database User: </td><td><input type="text" name="dbuser" value="<?php echo $dbuser; ?>" /></td>
                    <td>Password: </td><td><input type="text" name="dbpassword" value="<?php echo $dbpassword; ?>" /></td></tr>
            </tbody>
        </table>
        <input type="submit" value="Submit" />
    </form>
<?php
} else {
/* see if the database is initialised yet */
    $result = dbQuery('SELECT schemaname, tablename FROM pg_tables WHERE schemaname = \'public\' AND tablename = \'config\';');
    $n = dbNumRows($result);
    dbFree($result);
    if($n == 0) {
        dbQuery(file_get_contents('database.sql')); 
    } else { 
        $result = dbQuery('SELECT * FROM config;');
        $row = dbFetch($result);
        if(!isset($row['db_version'])) {
// Database version is at version 1 (no version number if config table), so we need to update to version 2
            dbQuery(file_get_contents('update1.sql'));
            //Update config to have new version
            $row['db_version'] = 2;
        }
// TO BE ADDED WHEN THERE IS A NEXT UPDATE
/*      if($row['db_version'] < 3) { //update to version 3
            dbQuery(file_get_contents('update2.sql'));
            //Update config to have new version
            $row['db_version'] = 3;
        } */
     }
?> <p>Database is now ready for use click <a href="index.php">here</a> to start to use it</p>
<?php
}

}
require_once($_SERVER['DOCUMENT_ROOT'].'/template.php'); 
?>
