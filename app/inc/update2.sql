-- 	Copyright (c) 2011 money Chandler
--  This file is part of AKCMoney.

--    AKCMoney is free software: you can redistribute it and/or modify
--    it under the terms of the GNU General Public License as published by
--    the Free Software Foundation, either version 3 of the License, or
--    (at your option) any later version.

--    AKCMoney is distributed in the hope that it will be useful,
--    but WITHOUT ANY WARRANTY; without even the implied warranty of
--    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--    GNU General Public License for more details.

--    You should have received a copy of the GNU General Public License
--    along with AKCMoney (file COPYING.txt).  If not, see <http://www.gnu.org/licenses/>.


-- add version to code table as we can now edit it online and need to check that it hasn't been altered by someone else

BEGIN IMMEDIATE;

-- if null, account only shows unreconciled transactions, if 0 transactions from start of financial year, otherwise from this date 
ALTER TABLE account ADD COLUMN startdate bigint ;

CREATE INDEX xaction_idx_date ON xaction(date);

UPDATE config SET version = version + 1, db_version = 3;

COMMIT;

