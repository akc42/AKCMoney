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
    <script type="text/javascript" src="offbalancesheet.js"></script>
<?php
}


function content() {
?><h1>Under Construction</h1>
<p>Sorry, but this facility has not yet been implemented.  We are just using this as a placeholder for the time being.</p>
<p>Eventually this will list the off balance sheet transactions since the begining of time for the accounting code selected.</p>
<?php
}
require_once($_SERVER['DOCUMENT_ROOT'].'/inc/template.inc'); 
?>
