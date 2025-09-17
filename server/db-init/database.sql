
-- 	Copyright (c) 2009 - 2025 Alan Chandler
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

--   NOTE:
--       This file is used to establish the database if it does not already exist so the first time
--       the application is run it is likely this file will be used to create the database. It makes
--       some assumptions about the parameters to use, and ALSO puts in some default values for items 

BEGIN;


-- Account Code Types

CREATE TABLE codeType (
    type char(1) PRIMARY KEY,
    description character varying
);

INSERT INTO codeType VALUES ('C','Direct Costs') -- Direct Costs incurred by the business
, ('R','Revenue') -- Revenues Due
, ('A','Capital Asset') --Capital purchase of Computer Asset
, ('B','Balancing Account')  --Holds personal costs that are to be re-embersed by the business
, ('O','Off Balance Sheet');  --Items that should not appear in domain accounting

-- account codes define the accounting code associated with this account 

CREATE TABLE code (
    id integer PRIMARY KEY,
    version bigint DEFAULT 1 NOT NULL,
    type char(1) NOT NULL REFERENCES codeType(type),          
    description character varying,
    depreciateyear integer
);


INSERT INTO code (type,description) VALUES ( 'C','Operational Cost') -- such as hosting fees, insurance, phone 
, ( 'C', 'Billable Costs') -- costs incurred which will be invoiced from clients
, ( 'C', 'General Mileage @40p per mile') --Mileage Not Billable from Clients
, ( 'C', 'Customer Related Mileage @40p per mile') --Mileage Costed at 40p but only Billed at 20p
, ( 'C', 'Salaries') --Salaries and Related Costs (Tax and NI)
, ( 'C', 'Advertising and Marketing Services') --Advertising Costs
, ( 'C', 'Office Cost') --Stationary, Postage etc
, ('C','Professional Membership Fees') -- Fees for British Computer Society and PCG
, ( 'C', 'General Costs') -- costs not included elsewhere
, ( 'R', 'Invoices for Professional Service')
, ('R', 'Invoices for Web Design and Hosting') 
, ('A','Computer Equipment') --Depreciable Computer Equipment
, ('A', 'Motor Vehicles') -- Cars
, ('B','Outstanding Expenses') --Personally Incurred Expenses (to be re-embersed by the Business)
, ('B','Loans') --loans made to the company
, ('O','Profit and Dividends'); -- Off Balance Sheet Items we want to track

UPDATE code SET depreciateyear = 3 WHERE description = 'Computer Equipment';
UPDATE code set depreciateyear = 5 WHERE description = 'Motor Vehicles';

-- Define valid Repeat Values for Transactions

CREATE TABLE repeat (
    rkey integer PRIMARY KEY, -- key used in transaction 
    description character varying(25) NOT NULL,
    priority integer 
);

INSERT INTO repeat VALUES (0, 'No Repeat',0),
(1, 'Weekly',1),
(2, 'Fortnightly',2),
(3, 'Monthly',4),
(4, 'Monthly (at End)',5),
(5, 'Quarterly',6),
(6, 'Yearly',7),
(7, 'Four Weekly',3);

CREATE TABLE currency (
    name character(3) PRIMARY KEY, -- standard international symbol for currency
    rate real DEFAULT 1.0 NOT NULL, -- rate relative to default currency
    display boolean DEFAULT 0,   -- false
    priority smallint, -- if display is true (1) then this defines the order the currency will be displayed (0 highest, 1 next ...)
    description character varying,
    version bigint DEFAULT 1 NOT NULL -- used to check that currency has not been edited whilst someone else is viewing it.
);


INSERT INTO currency VALUES ('THB', 1, 0, NULL, 'Thailand, Baht', 1),
('TJS', 1, 0, NULL, 'Tajikistan, Somoni', 1),
('TMM', 1, 0, NULL, 'Turkmenistan, Manats', 1),
('TND', 1, 0, NULL, 'Tunisia, Dinars', 1),
('TOP', 1, 0, NULL, 'Tonga, Pa''anga', 1),
('TRL', 1, 0, NULL, 'Turkey, Liras [being phased out]', 1),
('TRY', 1, 0, NULL, 'Turkey, New Lira', 1),
('TTD', 1, 0, NULL, 'Trinidad and Tobago, Dollars', 1),
('TVD', 1, 0, NULL, 'Tuvalu, Tuvalu Dollars', 1),
('TWD', 1, 0, NULL, 'Taiwan, New Dollars', 1),
('TZS', 1, 0, NULL, 'Tanzania, Shillings', 1),
('UAH', 1, 0, NULL, 'Ukraine, Hryvnia', 1),
('UGX', 1, 0, NULL, 'Uganda, Shillings', 1),
('UYU', 1, 0, NULL, 'Uruguay, Pesos', 1),
('UZS', 1, 0, NULL, 'Uzbekistan, Sums', 1),
('VEB', 1, 0, NULL, 'Venezuela, Bolivares', 1),
('VND', 1, 0, NULL, 'Viet Nam, Dong', 1),
('VUV', 1, 0, NULL, 'Vanuatu, Vatu', 1),
('WST', 1, 0, NULL, 'Samoa, Tala', 1),
('XAU', 1, 0, NULL, 'Gold, Ounces', 1),
('XAF', 1, 0, NULL, 'Communaut&eacute, Financi&egrave,re Africaine BEAC, Francs', 1),
('XAG', 1, 0, NULL, 'Silver, Ounces', 1),
('XCD', 1, 0, NULL, 'East Caribbean Dollars', 1),
('XDR', 1, 0, NULL, 'International Monetary Fund (IMF) Special Drawing Rights', 1),
('XOF', 1, 0, NULL, 'Communaut&eacute, Financi&egrave,re Africaine BCEAO, Francs', 1),
('XPD', 1, 0, NULL, 'Palladium Ounces', 1),
('XPF', 1, 0, NULL, 'Comptoirs Fran&ccedil,ais du Pacifique Francs', 1),
('XPT', 1, 0, NULL, 'Platinum, Ounces', 1),
('YER', 1, 0, NULL, 'Yemen, Rials', 1),
('ZAR', 1, 0, NULL, 'South Africa, Rand', 1),
('ZMK', 1, 0, NULL, 'Zambia, Kwacha', 1),
('ZWD', 1, 0, NULL, 'Zimbabwe, Zimbabwe Dollars', 1),
('AED', 1, 0, NULL, 'United Arab Emirates, Dirhams', 1),
('AFA', 1, 0, NULL, 'Afghanistan, Afghanis', 1),
('ALL', 1, 0, NULL, 'Albania, Leke', 1),
('AMD', 1, 0, NULL, 'Armenia, Drams', 1),
('ANG', 1, 0, NULL, 'Netherlands Antilles, Guilders (also called Florins)', 1),
('AOA', 1, 0, NULL, 'Angola, Kwanza', 1),
('ARS', 1, 0, NULL, 'Argentina, Pesos', 1),
('AWG', 1, 0, NULL, 'Aruba, Guilders (also called Florins)', 1),
('AZM', 1, 0, NULL, 'Azerbaijan, Manats', 1),
('BAM', 1, 0, NULL, 'Bosnia and Herzegovina, Convertible Marka', 1),
('BBD', 1, 0, NULL, 'Barbados, Dollars', 1),
('BDT', 1, 0, NULL, 'Bangladesh, Taka', 1),
('BGN', 1, 0, NULL, 'Bulgaria, Leva', 1),
('BHD', 1, 0, NULL, 'Bahrain, Dinars', 1),
('BIF', 1, 0, NULL, 'Burundi, Francs', 1),
('BMD', 1, 0, NULL, 'Bermuda, Dollars', 1),
('BND', 1, 0, NULL, 'Brunei Darussalam, Dollars', 1),
('BOB', 1, 0, NULL, 'Bolivia, Bolivianos', 1),
('BRL', 1, 0, NULL, 'Brazil, Brazil Real', 1),
('BSD', 1, 0, NULL, 'Bahamas, Dollars', 1),
('BTN', 1, 0, NULL, 'Bhutan, Ngultrum', 1),
('BWP', 1, 0, NULL, 'Botswana, Pulas', 1),
('BYR', 1, 0, NULL, 'Belarus, Rubles', 1),
('BZD', 1, 0, NULL, 'Belize, Dollars', 1),
('CAD', 1, 0, NULL, 'Canada, Dollars', 1),
('CDF', 1, 0, NULL, 'Congo/Kinshasa, Congolese Francs', 1),
('CHF', 1, 0, NULL, 'Switzerland, Francs', 1),
('CLP', 1, 0, NULL, 'Chile, Pesos', 1),
('CNY', 1, 0, NULL, 'China, Yuan Renminbi', 1),
('COP', 1, 0, NULL, 'Colombia, Pesos', 1),
('CRC', 1, 0, NULL, 'Costa Rica, Colones', 1),
('CSD', 1, 0, NULL, 'Serbia, Dinars', 1),
('CUP', 1, 0, NULL, 'Cuba, Pesos', 1),
('CVE', 1, 0, NULL, 'Cape Verde, Escudos', 1),
('CYP', 1, 0, NULL, 'Cyprus, Pounds', 1),
('DJF', 1, 0, NULL, 'Djibouti, Francs', 1),
('ISK', 1, 0, NULL, 'Iceland, Kronur', 1),
('DOP', 1, 0, NULL, 'Dominican Republic, Pesos', 1),
('DZD', 1, 0, NULL, 'Algeria, Algeria Dinars', 1),
('EEK', 1, 0, NULL, 'Estonia, Krooni', 1),
('EGP', 1, 0, NULL, 'Egypt, Pounds', 1),
('ERN', 1, 0, NULL, 'Eritrea, Nakfa', 1),
('ETB', 1, 0, NULL, 'Ethiopia, Birr', 1),
('FJD', 1, 0, NULL, 'Fiji,Dollars', 1),
('FKP', 1, 0, NULL, 'Falkland Islands (Malvinas), Pounds', 1),
('GEL', 1, 0, NULL, 'Georgia, Lari', 1),
('GGP', 1, 0, NULL, 'Guernsey, Pounds', 1),
('GHC', 1, 0, NULL, 'Ghana, Cedis', 1),
('GIP', 1, 0, NULL, 'Gibraltar, Pounds', 1),
('GMD', 1, 0, NULL, 'Gambia, Dalasi', 1),
('GNF', 1, 0, NULL, 'Guinea, Francs', 1),
('GTQ', 1, 0, NULL, 'Guatemala, Quetzales', 1),
('GYD', 1, 0, NULL, 'Guyana, Dollars', 1),
('HKD', 1, 0, NULL, 'Hong Kong, Dollars', 1),
('HNL', 1, 0, NULL, 'Honduras, Lempiras', 1),
('HRK', 1, 0, NULL, 'Croatia, Kuna', 1),
('HTG', 1, 0, NULL, 'Haiti, Gourdes', 1),
('HUF', 1, 0, NULL, 'Hungary, Forint', 1),
('IDR', 1, 0, NULL, 'Indonesia, Rupiahs', 1),
('ILS', 1, 0, NULL, 'Israel, New Shekels', 1),
('IMP', 1, 0, NULL, 'Isle of Man, Pounds', 1),
('INR', 1, 0, NULL, 'India, Rupees', 1),
('IQD', 1, 0, NULL, 'Iraq, Dinars', 1),
('IRR', 1, 0, NULL, 'Iran, Rials', 1),
('JEP', 1, 0, NULL, 'Jersey, Pounds', 1),
('JMD', 1, 0, NULL, 'Jamaica, Dollars', 1),
('JOD', 1, 0, NULL, 'Jordan, Dinars', 1),
('JPY', 1, 0, NULL, 'Japan, Yen', 1),
('KES', 1, 0, NULL, 'Kenya, Shillings', 1),
('KGS', 1, 0, NULL, 'Kyrgyzstan, Soms', 1),
('KHR', 1, 0, NULL, 'Cambodia, Riels', 1),
('KMF', 1, 0, NULL, 'Comoros, Francs', 1),
('KPW', 1, 0, NULL, 'Korea (North), Won', 1),
('KRW', 1, 0, NULL, 'Korea (South), Won', 1),
('KWD', 1, 0, NULL, 'Kuwait, Dinars', 1),
('KYD', 1, 0, NULL, 'Cayman Islands, Dollars', 1),
('KZT', 1, 0, NULL, 'Kazakhstan, Tenge', 1),
('LAK', 1, 0, NULL, 'Laos, Kips', 1),
('LBP', 1, 0, NULL, 'Lebanon, Pounds', 1),
('LKR', 1, 0, NULL, 'Sri Lanka, Rupees', 1),
('LRD', 1, 0, NULL, 'Liberia, Dollars', 1),
('LSL', 1, 0, NULL, 'Lesotho, Maloti', 1),
('LTL', 1, 0, NULL, 'Lithuania, Litai', 1),
('LVL', 1, 0, NULL, 'Latvia, Lati', 1),
('LYD', 1, 0, NULL, 'Libya, Dinars', 1),
('MAD', 1, 0, NULL, 'Morocco, Dirhams', 1),
('MDL', 1, 0, NULL, 'Moldova, Lei', 1),
('MGA', 1, 0, NULL, 'Madagascar, Ariary', 1),
('MKD', 1, 0, NULL, 'Macedonia, Denars', 1),
('MMK', 1, 0, NULL, 'Myanmar (Burma), Kyats', 1),
('MNT', 1, 0, NULL, 'Mongolia, Tugriks', 1),
('MOP', 1, 0, NULL, 'Macau, Patacas', 1),
('MRO', 1, 0, NULL, 'Mauritania, Ouguiyas', 1),
('MTL', 1, 0, NULL, 'Malta, Liri', 1),
('MUR', 1, 0, NULL, 'Mauritius, Rupees', 1),
('MVR', 1, 0, NULL, 'Maldives (Maldive Islands), Rufiyaa', 1),
('MWK', 1, 0, NULL, 'Malawi, Kwachas', 1),
('MXN', 1, 0, NULL, 'Mexico, Pesos', 1),
('MYR', 1, 0, NULL, 'Malaysia, Ringgits', 1),
('MZM', 1, 0, NULL, 'Mozambique, Meticais', 1),
('NAD', 1, 0, NULL, 'Namibia, Dollars', 1),
('NGN', 1, 0, NULL, 'Nigeria, Nairas', 1),
('NIO', 1, 0, NULL, 'Nicaragua, Cordobas', 1),
('NPR', 1, 0, NULL, 'Nepal, Nepal Rupees', 1),
('NZD', 1, 0, NULL, 'New Zemoneyd, Dollars', 1),
('OMR', 1, 0, NULL, 'Oman, Rials', 1),
('PAB', 1, 0, NULL, 'Panama, Balboa', 1),
('PEN', 1, 0, NULL, 'Peru, Nuevos Soles', 1),
('PGK', 1, 0, NULL, 'Papua New Guinea, Kina', 1),
('PHP', 1, 0, NULL, 'Philippines, Pesos', 1),
('PKR', 1, 0, NULL, 'Pakistan, Rupees', 1),
('PLN', 1, 0, NULL, 'Poland, Zlotych', 1),
('PYG', 1, 0, NULL, 'Paraguay, Guarani', 1),
('QAR', 1, 0, NULL, 'Qatar, Rials', 1),
('RON', 1, 0, NULL, 'Romania, New Lei', 1),
('RUB', 1, 0, NULL, 'Russia, Rubles', 1),
('RWF', 1, 0, NULL, 'Rwanda, Rwanda Francs', 1),
('SAR', 1, 0, NULL, 'Saudi Arabia, Riyals', 1),
('SBD', 1, 0, NULL, 'Solomon Islands, Dollars', 1),
('SCR', 1, 0, NULL, 'Seychelles, Rupees', 1),
('SDD', 1, 0, NULL, 'Sudan, Dinars', 1),
('SGD', 1, 0, NULL, 'Singapore, Dollars', 1),
('SHP', 1, 0, NULL, 'Saint Helena, Pounds', 1),
('SIT', 1, 0, NULL, 'Slovenia, Tolars', 1),
('SKK', 1, 0, NULL, 'Slovakia, Koruny', 1),
('SLL', 1, 0, NULL, 'Sierra Leone, Leones', 1),
('SOS', 1, 0, NULL, 'Somalia, Shillings', 1),
('SPL', 1, 0, NULL, 'Seborga, Luigini', 1),
('SRD', 1, 0, NULL, 'Suriname, Dollars', 1),
('STD', 1, 0, NULL, 'S&atilde,o Tome and Principe, Dobras', 1),
('SVC', 1, 0, NULL, 'El Salvador, Colones', 1),
('SYP', 1, 0, NULL, 'Syria, Pounds', 1),
('SZL', 1, 0, NULL, 'Swaziland, Emmoneygeni', 1),
('CZK', 1, 0, NULL, 'Czech Republic, Koruny', 1),
--displayable at priority 0 defines GBP to be the default currency (see also the dfxaction view, if you wish to change it)
('GBP', 1, 1, 0, 'United Kingdom, Pounds',1), 
('SEK', 1, 0, NULL, 'Sweden, Kronor', 1),
('AUD', 1, 0, NULL, 'Australia, Dollars', 1),
('DKK', 1, 0, NULL, 'Denmark, Kroner', 1),
('NOK', 1, 0, NULL, 'Norway, Krone', 1),
('EUR', 0.85, 1, 1, 'Euro Member Countries,Euro', 1),
('USD', 0.636, 1, 2, 'United States of America, Dollars', 1);


-- domain is an area of the accounts that is a whole.  Used primarily so we can do special things to transactions between domains

CREATE TABLE domain (
    name character varying COLLATE NOCASE PRIMARY KEY,
    description character varying,
    version bigint DEFAULT 1 NOT NULL
);
INSERT INTO domain(name, description) VALUES ('Base', 'Main Domain For Accounting');


-- an account, the fundemental accounting vehicle within the system.      
CREATE TABLE account (
    name character varying COLLATE NOCASE PRIMARY KEY,    -- name of the account
    bversion bigint DEFAULT 1 NOT NULL,    -- this is incremented when the balance is updated to check that parallel edits are not happening
    dversion bigint DEFAULT 1 NOT NULL,    -- this is incremented when the details of the account are updated to check for parallel edits
    currency character(3) REFERENCES currency(name),  -- currency in which to show transactions
    balance bigint DEFAULT 0 NOT NULL, -- reconciled balance of the account 
    date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date when reconciled balance was set
    domain character varying COLLATE NOCASE DEFAULT NULL REFERENCES domain(name) ON UPDATE CASCADE ON DELETE SET NULL, -- domain that account belongs to
	startdate bigint, -- if null, account only shows unreconciled transactions, if 0 transactions from start of financial year, otherwise from this date
	archived boolean DEFAULT 0 NOT NULL --indicated if account is archived (does not appear in menus except Account Manager)
);

INSERT INTO account (name,currency,balance, domain) VALUES ('Cash', 'GBP', 0, 'Base');



-- a transaction, the key component related to movement of money, or notional money, between accounts

CREATE TABLE xaction (
    id integer PRIMARY KEY,
    date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date of transaction
    version bigint DEFAULT 1 NOT NULL,   -- version of transaction, used to check for parallel updates
    amount bigint DEFAULT 0 NOT NULL, -- amount of transaction (times 100 to make it an integer) of transaction in currency below
    currency character(3) NOT NULL REFERENCES currency(name),   -- currency transaction was conducted in
    src character varying COLLATE NOCASE REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL, -- source account (debits this account when amount is +ve [the normal case])
    srcamount bigint,                 -- if the source account is a different currency then this is the amount (same sign as) in that currency
    srcclear boolean DEFAULT 0 NOT NULL,  -- the amount is cleared in the source account
    srccode integer REFERENCES code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to account for this transaction
    dst character varying COLLATE NOCASE REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL, -- destination account (credits this account when amount is +ve [the normal case])
    dstamount bigint,                 -- if the destination account is a different currency then this is the amount in that currency
    dstclear boolean DEFAULT 0 NOT NULL, -- if the amount is cleared in the destination account
    dstcode integer REFERENCES code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to account for this transaction
    description character varying,      -- details of the transaction
    rno character varying,              -- reference number for the transaction
    repeat integer DEFAULT 0 NOT NULL REFERENCES repeat(rkey) -- if the transaction is repeating
);


CREATE INDEX xaction_idx_dst ON xaction (dst);
CREATE INDEX xaction_idx_src ON xaction (src);
CREATE INDEX xaction_idx_scode ON xaction(srccode);
CREATE INDEX xaction_idx_dcode ON xaction(dstcode);
CREATE INDEX xaction_idx_date ON xaction(date);

CREATE TABLE user (
    uid integer primary key,
    name character varying COLLATE NOCASE UNIQUE,
    version bigint DEFAULT 1 NOT NULL, --version of this record
    password character varying, -- bcrypt hash of password
    isAdmin boolean NOT NULL DEFAULT 0,  -- if admin has capability of everything
    domain character varying  REFERENCES domain(name) ON UPDATE CASCADE ON DELETE SET NULL, --default domain to use for accounting
    account character varying REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL-- initial account to use when displaying
);

CREATE INDEX user_idx_name ON user(name);

INSERT INTO user (uid, name, isAdmin, account, domain) VALUES (1, 'Admin', 1, 'Cash', 'Base');  --make the admin user with at least the Cash account and Base domain

CREATE TABLE capability (
    uid integer REFERENCES user(uid) ON UPDATE CASCADE ON DELETE CASCADE,
    domain character COLLATE NOCASE REFERENCES domain(name) ON UPDATE CASCADE ON DELETE CASCADE,
    primary key (uid,domain)
);

CREATE INDEX capability_idx_uid ON capability(uid);

CREATE TABLE priority (
    uid integer REFERENCES user(uid) ON UPDATE CASCADE ON DELETE CASCADE,
    domain character varying COLLATE NOCASE REFERENCES domain(name) ON UPDATE CASCADE ON DELETE CASCADE,
    account character varying COLLATE NOCASE REFERENCES account(name) ON UPDATE CASCADE ON DELETE CASCADE,
    sort smallint NOT NULL, --a sort order (lowest first) for account in list for this user when using this domain
    PRIMARY KEY (uid,domain,account)
);

CREATE INDEX priority_idx_account ON priority(account);
CREATE INDEX priority_idx_uid_domain ON priority(uid,domain);



CREATE TABLE login_log (
    lid integer primary key,
    time bigint DEFAULT (strftime('%s','now')) NOT NULL,
    ipaddress character varying, --ip address of login attempt
    track_uid character varying, --track uid
    track_ip character varying,
    username character varying COLLATE NOCASE,
    isSuccess boolean NOT NULL
);

CREATE TABLE settings (
  name character varying(20) PRIMARY KEY, --name of setting
  value integer -- although an integer can store strings.
);
-- Basic settings not alterable in different configs.
INSERT INTO settings (name,value) VALUES('version',2), --version of this configuration
('creation_date', strftime('%s','now')),  -- record the date the database is first installed,
('token_key', 'newTokenKey'), --key used to encrypt/decrypt cookie token (new value set during db create)
('repeat_days', 90), -- number of days ahead that the repeated transactions are replicated (with the lower date transactions set to no repeat)
('year_end', 1231), -- Month and Date (100* MM + DD) as a numeric of financial year end.
('client_log',':error:'), --if none empty string should specify colon separated function areas client should log or 'all' for every thing 
('client_uid', 0), --if non zero this uid logs everything
('token_expires', 720), --hours until expire for standard logged on token
('min_pass_len', 6), --minimum password length
('dwell_time', 2000), --time to elapse before new urls get to be pushed to the history stack (rather than update)
('webmaster', 'developer@example.com'),  --site web master NOTE change once database created to correct person
('server_port', 2010), --api server port (needs to match what nginx conf says),
('track_cookie', 'm_user'), --cookie name for tracking cookie
('auth_cookie', 'm_auth'), --authcookie name
('null_account', '-- Select (Optional) Other Account --'), --NUll account text (dst or src)
('null_code', '-- Select (Optional) Account Code --'), --NULL code text
('debug',''), --this should be a colon separated list of client debug topics to actually log
('server_debug',''), -- this should be a colon separated list of server debug topics to actually log
('debug_cache',50); --size of server side debug cache



CREATE VIEW dfxaction AS
    SELECT t.id,t.date,t.version, src, srccode, dst, dstcode,t.description, rno, repeat,
        CASE 
            WHEN t.currency = 'GBP' THEN t.amount
            WHEN t.srcamount IS NOT NULL AND sa.currency = 'GBP' THEN t.srcamount
            WHEN t.dstamount IS NOT NULL AND da.currency = 'GBP' THEN t.dstamount
            ELSE CAST ((CAST (t.amount AS REAL) / currency.rate) AS INTEGER)
        END AS dfamount
    FROM
        xaction AS t
        LEFT JOIN account AS sa ON t.src = sa.name
        LEFT JOIN account AS da ON t.dst = da.name
        LEFT JOIN currency ON 
            t.currency != 'GBP' AND
            (t.srcamount IS NULL OR sa.currency != 'GBP') AND
            (t.dstamount IS NULL OR da.currency != 'GBP') AND 
            t.currency = currency.name;


END TRANSACTION;

-- set it all up as Write Ahead Log for max performance and minimum contention with other users.
PRAGMA journal_mode=WAL;

