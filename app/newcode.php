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

require_once('./inc/db.inc');

$istmt =  $db->prepare("INSERT INTO code (type,version,description) VALUES ( ? , 1, ? );");
$istmt->bindValue(1,$_POST['codetype']);
$istmt->bindValue(2,$_POST['description']);


$db->exec("BEGIN IMMEDIATE");

$istmt->execute();
$istmt->closeCursor();
?><div class="xcode">
        <form action="updatecode.php" method="post" onSubmit="return false;" >
            <input type="hidden" name="version" value="1"/>
            <input type="hidden" name="id" value="<?php echo $db->lastInsertId(); ?>" />
            <input type="hidden" name="original" value="<?php echo $_POST['description']; ?>" />
            <div class="description"><input type="text" name="description" value="<?php echo $_POST['description']; ?>"/></div>
		    <div class="codetype">
		    	<select name="codetype" value="">
<?php
$result = $db->query("SELECT * FROM codeType ORDER BY type ASC;");
while($row = $result->fetch(PDO::FETCH_ASSOC)){
?>					<option value="<?php echo $row['type']; ?>" <?php 
						if($row['type'] == $_POST['codetype']) echo 'selected="selected"'; ?> class="code_<?php echo $row['type']; ?>"><?php echo $row['description'];?></option>
<?php
}
$result->closeCursor();
?>			</select>
        </div>
        </form>
        <div class="button">
            <div class="buttoncontainer">
                <a class="button"><span><img src="delete.png"/>Delete code</span></a>
            </div>
        </div>
</div>
<?php
$db->exec("COMMIT");
?>
