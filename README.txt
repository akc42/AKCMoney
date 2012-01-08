AKCMoney is an application to Manage Money, either for a private
individual or a small business.  It consist of two main concepts,
accounts which hold money, and transactions which transfer money from
one account to another (or just to or from a single account if the
transaction is with the outside world).  Multiple currencies are
supported, and can use exchange rates which are initially estimated,
but are then corrected when the actual value used in a transaction is
known.  This is the third release, based on personal use over the
past 5 years. The last release include multiple accounting domains, so
I am able to separate my personal accounts from my business accounts,
and a cost/revenue allocation system so that costs/revenue can be
broken down by type in order to calculate overall profitability.


More detailed information about this software, including installation
and user guide can be found in supporting/documentation.html.  This is
in the form of a tiddly wiki, so open in a javascript enabled browser.

The application is a combination of PHP and Javascript using the
mootools framework.

This version of the software uses an SQLite Database - previous
versions used Postgres.  

Copyright (c) 2011 Alan Chandler
This file is part of AKCMoney.

AKCMoney is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or (at your
option) any later version.

AKCMoney is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License
along with AKCMoney (file supporting/COPYING.txt).  If not, see
<http://www.gnu.org/licenses/>.
