<?php
/*
 	Copyright (c) 2014 Alan Chandler
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

require_once('./inc/db.inc');

if(isset($_GET['code'])) {
    $code = $_GET['code'];
    // We do this complicated statement as a repeat of the menu selection query so that
    // we can check that it is still valid
    $stmt = $db->prepare("
        SELECT c.description FROM code c INNER JOIN xaction t ON t.id = (
            SELECT x.id FROM user u,xaction x INNER JOIN account a ON (x.src = a.name AND x.srccode = c.id) 
            OR (x.dst = a.name AND x.dstcode = c.id) LEFT JOIN capability p ON p.uid = u.uid 
            AND p.domain = a.domain WHERE u.uid = ? AND (u.isAdmin = 1 OR p.uid IS NOT NULL) LIMIT 1)
        WHERE c.type = 'O' AND c.id = ?;
        ");
    $stmt->bindValue(1,$user['uid'],PDO::PARAM_INT);
    $stmt->bindValue(2,$code,PDO::PARAM_INT);
    $stmt->execute();
    If(!$codename = $stmt->fetchColumn()) $code = 0;
    $stmt->closeCursor();

} else {
    $code=0;
}

function head_content() {

?><title>AKCMoney Reporting Page</title>
<META NAME="Description" CONTENT="AKC Money is an application to Manage Money, either for a private individual or a small business.  This page
provides an off balance sheet reports for the requested account code"/>
<meta name="keywords" content=""/>
    <link rel="shortcut icon" type="image/png" href="favicon.ico" />
    <link rel="stylesheet" type="text/css" href="money.css"/>
    <link rel="stylesheet" type="text/css" href="print.css" media="print" />
    <script type="text/javascript" src="/js/mootools-core-1.3.2-yc.js"></script>
    <script type="text/javascript" src="mootools-money-1.3.2.1-yc.js"></script>
    <script type="text/javascript" src="/js/utils.js" ></script>
    <script type="text/javascript" src="offbalancesheet.js" ></script>
<?php
}


function content() {
    global $db,$user,$code,$codename;

    $stmt=$db->prepare("
        SELECT name,description FROM currency WHERE display = 1 AND priority = 0 LIMIT 1;
        ");
    $stmt->execute();
    if(!$row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $code = 0;
    } else {
        $currency = $row['name'];
        $cdesc = $row['description'];
    }
    $stmt->closeCursor();

    if ($code == 0) {
?><h1>Problem with Offsheet Balance Code</h1>
<p>It appears this code is either no longer in the database or is no longer accessable to the user.  The most likely cause of this is that someone
    else has edited the database in parallel.  Return to the menu and see what you can now select.</p>
<?php
        return;
    }
?>
<h1>Off Balance Sheet Transactions</h1>
<?php

    if ($user['demo']) {
?>    <h2>Beware - Demo - Do not use real data, as others may have access to it.</h2>
<?php
    }
?>      <div id="accountinfo">
            <div id="positive">
                <span class="title">Accounting Code:</span> <?php echo $codename;
?>          </div> 
            <div id="currency">
                <span class="title">Default Currency:</span> <span class="currency"><?php echo $currency ;?></span><br/>
                <?php echo $cdesc;?>
            </div>
            <div style="clear:both"></div>
        </div>

<p>All transactions have been normalised to the default currency</p>
<script type="text/javascript">

window.addEvent('domready', function() {
//Turn all dates to the correct local time
    Utils.dateAdjust($('transactions'),'dateawait','dateconvert');
    var xactions = document.id('transactions');
    xactions.getChildren().each(function(xaction) {
        var tac =xaction.getElement('.taccount');
        xaction.getElement('.aamount').addEvents({
            'mouseenter':function(e) {
                tac.removeClass('hidden');
            },
            'mouseleave':function(e) {
                tac.addClass('hidden');
            },
            'click':function(e) {
                var a;
                e.stop();
                if (e.control) {
                    //user clicked with control pressed - we go to the src account
                    a = tac.getElement('.src').get('text');
                    if (a != '') {
                        window.location='index.php?'+Object.toQueryString({'account':a,'tid':xaction.get('id').substr(1)});
                    }
                } 
                if (e.shift) {
                    //user clicked with shift pressed - we go to the dst account
                    a = tac.getElement('.dst').get('text');
                    if (a != '') {
                        window.location='index.php?'+Object.toQueryString({'account':a,'tid':xaction.get('id').substr(1)});
                    }
                }
            }
        });
    });

});
</script>
<h2>Transaction List</h2>
<div id="transactions">
<?php
    $stmt = $db->prepare("
        SELECT
            t.id as id,t.date as date,t.version as version, t.description as description, rno, repeat, 
            CASE 
                WHEN t.src = a.name THEN -dfamount
                ELSE dfamount 
            END AS amount,
            src,srccode, dst, dstcode
        FROM  
            user u,dfxaction t,code c 
            INNER JOIN account a ON 
                (t.src = a.name AND t.srccode = c.id) 
                OR (t.dst = a.name AND t.dstcode = c.id) 
            LEFT JOIN capability p ON 
                p.uid = u.uid 
                AND p.domain = a.domain 
        WHERE 
            u.uid = ? 
            AND (u.isAdmin = 1 OR p.uid IS NOT NULL) 
            AND c.id = ?
        ORDER BY 
            t.Date
        ");
    $stmt->bindValue(1,$user['uid'],PDO::PARAM_INT);
    $stmt->bindValue(2,$code,PDO::PARAM_INT);
    $stmt->execute();
    $r=0;
    $cumulative = 0;
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $r++;
        $cumulative += $row['amount'];
        $dual = (!(is_null($row['src']) || is_null($row['dst'])));
?><div id="<?php echo 't'.$row['id']; ?>" class="xaction arow<?php if($r%2 == 0) echo ' even';?>">
    <div class="wrapper">    
       <input type="hidden" class="version" name="version" value="<?php echo $row['version']; ?>"/>
        <div class="date <?php
        if($row['repeat'] != 0) {
            echo ' repeat';
        } else {
            if ($row['date'] < time()) echo ' passed'; //only indicate passed if not indicating cleared
        }
       ?>" ><input type="hidden" name="xxdate" value="<?php echo $row['date'];?>" class="dateawait"/></div>
        <div class="ref"><?php echo $row['rno'];?></div>
        <div class="description<?php if ($dual) echo " dual";?>"><?php echo $row['description'];?></div>
        <div class="amount aamount<?php 
            if ($dual) echo ' dual';?>"><?php echo fmtAmount($row['amount']);?></div>
        <div class="amount cumulative<?php if ($dual) echo ' dual';?>"><?php echo fmtAmount((isset($row['famount']))?$row['famount']:$cumulative);?></div>
        <div class="taccount hidden">
            <span class="src"><?php if(!is_null($row['src'])) echo $row['src'];?></span><?php if($dual) echo " -> ";?>
            <span class="dst"><?php if(!is_null($row['dst'])) echo $row['dst'];?></span>
        </div>
    </div>
</div>
<?php    
    }
?></div>
<?php
$stmt->closeCursor();

}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
