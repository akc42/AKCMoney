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


BEGIN IMMEDIATE;

-- if null, account only shows unreconciled transactions, if 0 transactions from start of financial year, otherwise from this date 
ALTER TABLE account ADD COLUMN startdate bigint;
ALTER TABLE account ADD COLUMN archived boolean DEFAULT 0 NOT NULL; -- True if account is archived (Means it will not appear in menus for selection)

CREATE INDEX xaction_idx_date ON xaction(date);

-- Account Opening Balances now become Reconcilled Balances, so for each account we need to sum all the cleared transactions and apply them to the balance

UPDATE account SET
    bversion = bversion + 1,
    balance = balance + (
        SELECT 
            SUM (
                CASE
                    WHEN t.src = account.name AND t.srcclear = 1 THEN
                        CASE 
                            WHEN t.currency = account.currency THEN -t.amount
                            WHEN t.srcamount IS NOT NULL THEN -t.srcamount  
                            ELSE -CAST (((CAST (t.amount AS REAL) * ac.rate)/ tc.rate) AS INTEGER)
                        END
                    WHEN t.dst = account.name AND t.dstclear = 1 THEN
                        CASE 
                            WHEN t.currency = account.currency THEN t.amount
                            WHEN t.dstamount IS NOT NULL THEN t.dstamount  
                            ELSE CAST (((CAST (t.amount AS REAL) * ac.rate)/ tc.rate) AS INTEGER)
                        END
                    ELSE 0                                            
                END )
        FROM
            xaction t
            JOIN currency tc ON t.currency = tc.name  
            JOIN currency ac ON account.currency = ac.name  
    );

UPDATE config SET version = version + 1, db_version = 3;

COMMIT;

