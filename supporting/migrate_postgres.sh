#!/bin/sh
#  Copyright (c) 2010 Alan Chandler
#  This file is part of AKCMoney.
#
#  AKCMoney is free software: you can redistribute it and/or modify it
#  under the terms of the GNU General Public License as published by the
#  Free Software Foundation, either version 3 of the License, or (at your
#  option) any later version.
#
#  AKCMoney is distributed in the hope that it will be useful, but
#  WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with AKCMoney (file supporting/COPYING.txt).  If not, see
#  <http://www.gnu.org/licenses/>.
#
# Run as a valid database user on machine with Postgres Database.  Transmit output file (money.sql) to new host and
# run sqlite3 .read money.sql
# 

# Deal with currency - its easier to just delete and reload the whole table rather than just look for updates

echo "DELETE FROM currency;\n" > money.sql
echo "DELETE FROM config;\n" >> money.sql
echo "DELETE FROM account;\n" >> money.sql
pg_dump -a --column-inserts -t currency money | sed 's/true/1/g' | sed 's/false/0/g' | sed '/^SE/d' >> money.sql
pg_dump -a --column-inserts -t account money | sed 's/, atype//'  | sed "s/, 'Debit.'//"|sed "s/, 'Credit'//" | sed '/^SE/d' >> money.sql
pg_dump -a --column-inserts -t config money | sed 's/true/1/g' | sed 's/false/0/g' | sed '/^SE/d' >> money.sql
pg_dump -a --column-inserts -t transaction money | sed 's/transaction/xaction/' | sed 's/true/1/g' | sed 's/false/0/g' | sed '/^SE/d' >> money.sql 


