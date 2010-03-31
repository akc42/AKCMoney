-- 	Copyright (c) 2009 money Chandler
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

ALTER TABLE account
    DROP CONSTRAINT "$1",
    DROP CONSTRAINT "$2";

ALTER TABLE xaction_type DROP CONSTRAINT xaction_type_pkey;
ALTER TABLE xaction_type RENAME TO account_type;
ALTER TABLE account_type RENAME COLUMN type TO atype;

ALTER TABLE account_type
    ALTER COLUMN atype TYPE char(6) USING CASE WHEN atype=0 THEN 'Debit ' ELSE 'Credit' END,
    ADD CONSTRAINT account_type_pkey PRIMARY KEY (atype);

ALTER TABLE account
    ALTER COLUMN atype TYPE char(6) USING CASE WHEN atype=0 THEN 'Debit ' ELSE 'Credit' END,
    ALTER COLUMN atype SET DEFAULT 'Debit ',
    ALTER COLUMN balance TYPE bigint USING balance*100,
    ALTER COLUMN name TYPE character varying,
    ALTER COLUMN date DROP DEFAULT,
    ALTER COLUMN date TYPE bigint USING date_part('epoch'::text,date),
    ALTER COLUMN date SET DEFAULT date_part('epoch'::text,now()),
    ADD CONSTRAINT account_currency_fkey FOREIGN KEY (currency) REFERENCES currency(name),
    ADD CONSTRAINT account_atype_fkey FOREIGN KEY (atype) REFERENCES account_type(atype);

ALTER TABLE transaction
    DROP CONSTRAINT "$1",
    DROP CONSTRAINT "$2",
    DROP CONSTRAINT "$3",
    DROP CONSTRAINT "$4",
    ALTER COLUMN namount TYPE bigint USING namount*100,
    ADD COLUMN srcamount bigint,
    ADD COLUMN dstamount bigint,
    ALTER COLUMN amount TYPE bigint USING amount*100,
    ALTER COLUMN src TYPE character varying,
    ALTER COLUMN dst TYPE character varying,
    ALTER COLUMN description TYPE character varying,
    ALTER COLUMN description DROP NOT NULL,
    ALTER COLUMN rno TYPE character varying,
    ALTER COLUMN date DROP DEFAULT,
    ALTER COLUMN date TYPE bigint USING date_part('epoch'::text,date),
    ALTER COLUMN date SET DEFAULT date_part('epoch'::text,now()),
    ADD CONSTRAINT transaction_src_fkey FOREIGN KEY (src) REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT transaction_dst_fkey FOREIGN KEY (dst) REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT transaction_currency_fkey FOREIGN KEY (currency) REFERENCES currency(name),
    ADD CONSTRAINT transaction_repeat_fkey FOREIGN KEY (repeat) REFERENCES repeat(rkey);
    
ALTER TABLE currency
    ALTER COLUMN description TYPE character varying;

UPDATE currency SET rate = 1/rate ;

UPDATE transaction SET srcamount = (CASE WHEN transaction.currency = account.currency THEN NULL ELSE CASE WHEN transaction.namount IS NULL THEN -transaction.amount / currency.rate ELSE -transaction.namount END END) FROM account, currency WHERE
transaction.src = account.name AND transaction.currency = currency.name;

UPDATE transaction SET dstamount = (CASE WHEN transaction.currency = account.currency THEN NULL ELSE CASE WHEN transaction.namount IS NULL THEN transaction.amount / currency.rate ELSE transaction.namount  END END) FROM account, currency WHERE
transaction.dst = account.name AND transaction.currency = currency.name;

ALTER TABLE transaction DROP COLUMN namount;

ALTER TABLE config  RENAME COLUMN start_account TO extn_account;

ALTER TABLE config
    ADD COLUMN version bigint,
    ALTER COLUMN version SET DEFAULT nextval(('version'::text)::regclass),
    ADD COLUMN home_account character varying,
    ALTER COLUMN extn_account TYPE character varying, 
    ADD COLUMN db_version integer,
    ADD demo boolean,
    ALTER COLUMN demo SET DEFAULT false,
    ADD CONSTRAINT config_home_account_fkey FOREIGN KEY (home_account) REFERENCES account(name) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT config_extn_account_fkey FOREIGN KEY (extn_account) REFERENCES account(name) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT config_default_currency_fkey FOREIGN KEY (default_currency) REFERENCES currency(name) ON UPDATE CASCADE;
UPDATE CONFIG SET home_account = 'Cash', db_version = 2 , demo = DEFAULT, version = DEFAULT;

ALTER TABLE config     
    ALTER COLUMN version SET NOT NULL,
    ALTER COLUMN demo SET NOT NULL;


