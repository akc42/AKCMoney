AKCMoney is an application to Manage Money, either for a private
individual or a small business, or in the later releases both.  

It consist of three main concepts:-

Domains - which hold accounts, and for which we want to account

Accounts - which hold money (in a currency)

Transactions - which transfer money from one account to another (or 
just to or from a single account if the transaction is with the 
outside world).  

Multiple currencies are supported, and can use exchange rates which are 
initially estimated, but are then corrected when the actual value used 
in a transaction is known.  

Each side of the transaction can optionally be assigned an "Accounting Code"
which belongs to one of "Costs","Revenue","Assets" (Depreciated over 3 years),
"Balance" (items such as expensed and their re-embersment, which are therefore
expected to round out to zero) and "Offsheet" (Off balance sheet amounts, such
as profits declared and dividents paid which are separately accounted for
cumulatively over time to ensure that only the profits actually achieved are
paid out in dividends) 


This is the third release, based on personal use over the
past 10 years. The last release include multiple accounting domains, so
I am able to separate my personal accounts from my business accounts,
and a cost/revenue allocation system so that costs/revenue can be
broken down by type in order to calculate overall profitability.


More detailed information about this software, including installation
and user guide can be found in supporting/documentation.html.  This is
in the form of a tiddly wiki, so open in a javascript enabled browser.

The application is a combination of PHP and Javascript using the
mootools framework, although the roadmap contains the conversion to the
JQuery Mobile framework so that a version that works on the phone can be
provided.

This version of the software uses an SQLite Database - previous
versions used Postgres.

Copyright (c) 2014 Alan Chandler

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
