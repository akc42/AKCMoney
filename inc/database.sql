
-- 	Copyright (c) 2009,2010 money Chandler
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


BEGIN;

-- account codes define the accounting code associated with this account (

CREATE TABLE account_code (
    id character varying PRIMARY KEY,
    type char(1) NOT NULL,          -- 'C' = cost, 'R' = revenue
    description character varying
);


INSERT INTO account_code VALUES ('OpCost', 'C','Operational Cost'); -- such as hosting fees, insurance, phone 
INSERT INTO account_code VALUES ('BillCos', 'C', 'Billable Costs');
INSERT INTO account_code VALUES ('Invoice', 'R', 'Invoice to Client'); 
INSERT INTO account_code VALUES ('Salary', 'C', 'Salaries');
INSERT INTO account_code VALUES ('OfEqup', 'C', 'Office Equipment');
INSERT INTO account_code VALUES ('GenCos', 'C', 'General Costs'); -- costs not included elsewhere
INSERT INTO account_code VALUES ('Miles', 'C', 'Mileage @40p per mile');
INSERT INTO account_code VALUES ('Advert', 'C', 'Advertising');


CREATE TABLE repeat (
    rkey integer PRIMARY KEY, -- key used in transaction 
    description character varying(25) NOT NULL 
);

INSERT INTO repeat VALUES (0, 'No Repeat');
INSERT INTO repeat VALUES (1, 'Weekly');
INSERT INTO repeat VALUES (2, 'Fortnightly');
INSERT INTO repeat VALUES (3, 'Monthly');
INSERT INTO repeat VALUES (4, 'Monthly (at End)');
INSERT INTO repeat VALUES (5, 'Quarterly');
INSERT INTO repeat VALUES (6, 'Yearly');

CREATE TABLE currency (
    name character(3) PRIMARY KEY, -- standard international symbol for currency
    rate real DEFAULT 1.0 NOT NULL, -- rate relative to default currency
    display boolean DEFAULT 0,   -- false
    priority smallint, -- if display is true (1) then this defines the order the currency will be displayed (0 highest, 1 next ...)
    description character varying,
    version bigint DEFAULT 1 NOT NULL -- used to check that currency has not been edited whilst someone else is viewing it.
);


INSERT INTO currency VALUES ('THB', 1, 0, NULL, 'Thailand, Baht', 1);
INSERT INTO currency VALUES ('TJS', 1, 0, NULL, 'Tajikistan, Somoni', 1);
INSERT INTO currency VALUES ('TMM', 1, 0, NULL, 'Turkmenistan, Manats', 1);
INSERT INTO currency VALUES ('TND', 1, 0, NULL, 'Tunisia, Dinars', 1);
INSERT INTO currency VALUES ('TOP', 1, 0, NULL, 'Tonga, Pa''anga', 1);
INSERT INTO currency VALUES ('TRL', 1, 0, NULL, 'Turkey, Liras [being phased out]', 1);
INSERT INTO currency VALUES ('TRY', 1, 0, NULL, 'Turkey, New Lira', 1);
INSERT INTO currency VALUES ('TTD', 1, 0, NULL, 'Trinidad and Tobago, Dollars', 1);
INSERT INTO currency VALUES ('TVD', 1, 0, NULL, 'Tuvalu, Tuvalu Dollars', 1);
INSERT INTO currency VALUES ('TWD', 1, 0, NULL, 'Taiwan, New Dollars', 1);
INSERT INTO currency VALUES ('TZS', 1, 0, NULL, 'Tanzania, Shillings', 1);
INSERT INTO currency VALUES ('UAH', 1, 0, NULL, 'Ukraine, Hryvnia', 1);
INSERT INTO currency VALUES ('UGX', 1, 0, NULL, 'Uganda, Shillings', 1);
INSERT INTO currency VALUES ('UYU', 1, 0, NULL, 'Uruguay, Pesos', 1);
INSERT INTO currency VALUES ('UZS', 1, 0, NULL, 'Uzbekistan, Sums', 1);
INSERT INTO currency VALUES ('VEB', 1, 0, NULL, 'Venezuela, Bolivares', 1);
INSERT INTO currency VALUES ('VND', 1, 0, NULL, 'Viet Nam, Dong', 1);
INSERT INTO currency VALUES ('VUV', 1, 0, NULL, 'Vanuatu, Vatu', 1);
INSERT INTO currency VALUES ('WST', 1, 0, NULL, 'Samoa, Tala', 1);
INSERT INTO currency VALUES ('XAU', 1, 0, NULL, 'Gold, Ounces', 1);
INSERT INTO currency VALUES ('XAF', 1, 0, NULL, 'Communaut&eacute; Financi&egrave;re Africaine BEAC, Francs', 1);
INSERT INTO currency VALUES ('XAG', 1, 0, NULL, 'Silver, Ounces', 1);
INSERT INTO currency VALUES ('XCD', 1, 0, NULL, 'East Caribbean Dollars', 1);
INSERT INTO currency VALUES ('XDR', 1, 0, NULL, 'International Monetary Fund (IMF) Special Drawing Rights', 1);
INSERT INTO currency VALUES ('XOF', 1, 0, NULL, 'Communaut&eacute; Financi&egrave;re Africaine BCEAO, Francs', 1);
INSERT INTO currency VALUES ('XPD', 1, 0, NULL, 'Palladium Ounces', 1);
INSERT INTO currency VALUES ('XPF', 1, 0, NULL, 'Comptoirs Fran&ccedil;ais du Pacifique Francs', 1);
INSERT INTO currency VALUES ('XPT', 1, 0, NULL, 'Platinum, Ounces', 1);
INSERT INTO currency VALUES ('YER', 1, 0, NULL, 'Yemen, Rials', 1);
INSERT INTO currency VALUES ('ZAR', 1, 0, NULL, 'South Africa, Rand', 1);
INSERT INTO currency VALUES ('ZMK', 1, 0, NULL, 'Zambia, Kwacha', 1);
INSERT INTO currency VALUES ('ZWD', 1, 0, NULL, 'Zimbabwe, Zimbabwe Dollars', 1);
INSERT INTO currency VALUES ('AED', 1, 0, NULL, 'United Arab Emirates, Dirhams', 1);
INSERT INTO currency VALUES ('AFA', 1, 0, NULL, 'Afghanistan, Afghanis', 1);
INSERT INTO currency VALUES ('ALL', 1, 0, NULL, 'Albania, Leke', 1);
INSERT INTO currency VALUES ('AMD', 1, 0, NULL, 'Armenia, Drams', 1);
INSERT INTO currency VALUES ('ANG', 1, 0, NULL, 'Netherlands Antilles, Guilders (also called Florins)', 1);
INSERT INTO currency VALUES ('AOA', 1, 0, NULL, 'Angola, Kwanza', 1);
INSERT INTO currency VALUES ('ARS', 1, 0, NULL, 'Argentina, Pesos', 1);
INSERT INTO currency VALUES ('AWG', 1, 0, NULL, 'Aruba, Guilders (also called Florins)', 1);
INSERT INTO currency VALUES ('AZM', 1, 0, NULL, 'Azerbaijan, Manats', 1);
INSERT INTO currency VALUES ('BAM', 1, 0, NULL, 'Bosnia and Herzegovina, Convertible Marka', 1);
INSERT INTO currency VALUES ('BBD', 1, 0, NULL, 'Barbados, Dollars', 1);
INSERT INTO currency VALUES ('BDT', 1, 0, NULL, 'Bangladesh, Taka', 1);
INSERT INTO currency VALUES ('BGN', 1, 0, NULL, 'Bulgaria, Leva', 1);
INSERT INTO currency VALUES ('BHD', 1, 0, NULL, 'Bahrain, Dinars', 1);
INSERT INTO currency VALUES ('BIF', 1, 0, NULL, 'Burundi, Francs', 1);
INSERT INTO currency VALUES ('BMD', 1, 0, NULL, 'Bermuda, Dollars', 1);
INSERT INTO currency VALUES ('BND', 1, 0, NULL, 'Brunei Darussalam, Dollars', 1);
INSERT INTO currency VALUES ('BOB', 1, 0, NULL, 'Bolivia, Bolivianos', 1);
INSERT INTO currency VALUES ('BRL', 1, 0, NULL, 'Brazil, Brazil Real', 1);
INSERT INTO currency VALUES ('BSD', 1, 0, NULL, 'Bahamas, Dollars', 1);
INSERT INTO currency VALUES ('BTN', 1, 0, NULL, 'Bhutan, Ngultrum', 1);
INSERT INTO currency VALUES ('BWP', 1, 0, NULL, 'Botswana, Pulas', 1);
INSERT INTO currency VALUES ('BYR', 1, 0, NULL, 'Belarus, Rubles', 1);
INSERT INTO currency VALUES ('BZD', 1, 0, NULL, 'Belize, Dollars', 1);
INSERT INTO currency VALUES ('CAD', 1, 0, NULL, 'Canada, Dollars', 1);
INSERT INTO currency VALUES ('CDF', 1, 0, NULL, 'Congo/Kinshasa, Congolese Francs', 1);
INSERT INTO currency VALUES ('CHF', 1, 0, NULL, 'Switzerland, Francs', 1);
INSERT INTO currency VALUES ('CLP', 1, 0, NULL, 'Chile, Pesos', 1);
INSERT INTO currency VALUES ('CNY', 1, 0, NULL, 'China, Yuan Renminbi', 1);
INSERT INTO currency VALUES ('COP', 1, 0, NULL, 'Colombia, Pesos', 1);
INSERT INTO currency VALUES ('CRC', 1, 0, NULL, 'Costa Rica, Colones', 1);
INSERT INTO currency VALUES ('CSD', 1, 0, NULL, 'Serbia, Dinars', 1);
INSERT INTO currency VALUES ('CUP', 1, 0, NULL, 'Cuba, Pesos', 1);
INSERT INTO currency VALUES ('CVE', 1, 0, NULL, 'Cape Verde, Escudos', 1);
INSERT INTO currency VALUES ('CYP', 1, 0, NULL, 'Cyprus, Pounds', 1);
INSERT INTO currency VALUES ('DJF', 1, 0, NULL, 'Djibouti, Francs', 1);
INSERT INTO currency VALUES ('ISK', 1, 0, NULL, 'Iceland, Kronur', 1);
INSERT INTO currency VALUES ('DOP', 1, 0, NULL, 'Dominican Republic, Pesos', 1);
INSERT INTO currency VALUES ('DZD', 1, 0, NULL, 'Algeria, Algeria Dinars', 1);
INSERT INTO currency VALUES ('EEK', 1, 0, NULL, 'Estonia, Krooni', 1);
INSERT INTO currency VALUES ('EGP', 1, 0, NULL, 'Egypt, Pounds', 1);
INSERT INTO currency VALUES ('ERN', 1, 0, NULL, 'Eritrea, Nakfa', 1);
INSERT INTO currency VALUES ('ETB', 1, 0, NULL, 'Ethiopia, Birr', 1);
INSERT INTO currency VALUES ('FJD', 1, 0, NULL, 'Fiji,Dollars', 1);
INSERT INTO currency VALUES ('FKP', 1, 0, NULL, 'Falkland Islands (Malvinas), Pounds', 1);
INSERT INTO currency VALUES ('GEL', 1, 0, NULL, 'Georgia, Lari', 1);
INSERT INTO currency VALUES ('GGP', 1, 0, NULL, 'Guernsey, Pounds', 1);
INSERT INTO currency VALUES ('GHC', 1, 0, NULL, 'Ghana, Cedis', 1);
INSERT INTO currency VALUES ('GIP', 1, 0, NULL, 'Gibraltar, Pounds', 1);
INSERT INTO currency VALUES ('GMD', 1, 0, NULL, 'Gambia, Dalasi', 1);
INSERT INTO currency VALUES ('GNF', 1, 0, NULL, 'Guinea, Francs', 1);
INSERT INTO currency VALUES ('GTQ', 1, 0, NULL, 'Guatemala, Quetzales', 1);
INSERT INTO currency VALUES ('GYD', 1, 0, NULL, 'Guyana, Dollars', 1);
INSERT INTO currency VALUES ('HKD', 1, 0, NULL, 'Hong Kong, Dollars', 1);
INSERT INTO currency VALUES ('HNL', 1, 0, NULL, 'Honduras, Lempiras', 1);
INSERT INTO currency VALUES ('HRK', 1, 0, NULL, 'Croatia, Kuna', 1);
INSERT INTO currency VALUES ('HTG', 1, 0, NULL, 'Haiti, Gourdes', 1);
INSERT INTO currency VALUES ('HUF', 1, 0, NULL, 'Hungary, Forint', 1);
INSERT INTO currency VALUES ('IDR', 1, 0, NULL, 'Indonesia, Rupiahs', 1);
INSERT INTO currency VALUES ('ILS', 1, 0, NULL, 'Israel, New Shekels', 1);
INSERT INTO currency VALUES ('IMP', 1, 0, NULL, 'Isle of Man, Pounds', 1);
INSERT INTO currency VALUES ('INR', 1, 0, NULL, 'India, Rupees', 1);
INSERT INTO currency VALUES ('IQD', 1, 0, NULL, 'Iraq, Dinars', 1);
INSERT INTO currency VALUES ('IRR', 1, 0, NULL, 'Iran, Rials', 1);
INSERT INTO currency VALUES ('JEP', 1, 0, NULL, 'Jersey, Pounds', 1);
INSERT INTO currency VALUES ('JMD', 1, 0, NULL, 'Jamaica, Dollars', 1);
INSERT INTO currency VALUES ('JOD', 1, 0, NULL, 'Jordan, Dinars', 1);
INSERT INTO currency VALUES ('JPY', 1, 0, NULL, 'Japan, Yen', 1);
INSERT INTO currency VALUES ('KES', 1, 0, NULL, 'Kenya, Shillings', 1);
INSERT INTO currency VALUES ('KGS', 1, 0, NULL, 'Kyrgyzstan, Soms', 1);
INSERT INTO currency VALUES ('KHR', 1, 0, NULL, 'Cambodia, Riels', 1);
INSERT INTO currency VALUES ('KMF', 1, 0, NULL, 'Comoros, Francs', 1);
INSERT INTO currency VALUES ('KPW', 1, 0, NULL, 'Korea (North), Won', 1);
INSERT INTO currency VALUES ('KRW', 1, 0, NULL, 'Korea (South), Won', 1);
INSERT INTO currency VALUES ('KWD', 1, 0, NULL, 'Kuwait, Dinars', 1);
INSERT INTO currency VALUES ('KYD', 1, 0, NULL, 'Cayman Islands, Dollars', 1);
INSERT INTO currency VALUES ('KZT', 1, 0, NULL, 'Kazakhstan, Tenge', 1);
INSERT INTO currency VALUES ('LAK', 1, 0, NULL, 'Laos, Kips', 1);
INSERT INTO currency VALUES ('LBP', 1, 0, NULL, 'Lebanon, Pounds', 1);
INSERT INTO currency VALUES ('LKR', 1, 0, NULL, 'Sri Lanka, Rupees', 1);
INSERT INTO currency VALUES ('LRD', 1, 0, NULL, 'Liberia, Dollars', 1);
INSERT INTO currency VALUES ('LSL', 1, 0, NULL, 'Lesotho, Maloti', 1);
INSERT INTO currency VALUES ('LTL', 1, 0, NULL, 'Lithuania, Litai', 1);
INSERT INTO currency VALUES ('LVL', 1, 0, NULL, 'Latvia, Lati', 1);
INSERT INTO currency VALUES ('LYD', 1, 0, NULL, 'Libya, Dinars', 1);
INSERT INTO currency VALUES ('MAD', 1, 0, NULL, 'Morocco, Dirhams', 1);
INSERT INTO currency VALUES ('MDL', 1, 0, NULL, 'Moldova, Lei', 1);
INSERT INTO currency VALUES ('MGA', 1, 0, NULL, 'Madagascar, Ariary', 1);
INSERT INTO currency VALUES ('MKD', 1, 0, NULL, 'Macedonia, Denars', 1);
INSERT INTO currency VALUES ('MMK', 1, 0, NULL, 'Myanmar (Burma), Kyats', 1);
INSERT INTO currency VALUES ('MNT', 1, 0, NULL, 'Mongolia, Tugriks', 1);
INSERT INTO currency VALUES ('MOP', 1, 0, NULL, 'Macau, Patacas', 1);
INSERT INTO currency VALUES ('MRO', 1, 0, NULL, 'Mauritania, Ouguiyas', 1);
INSERT INTO currency VALUES ('MTL', 1, 0, NULL, 'Malta, Liri', 1);
INSERT INTO currency VALUES ('MUR', 1, 0, NULL, 'Mauritius, Rupees', 1);
INSERT INTO currency VALUES ('MVR', 1, 0, NULL, 'Maldives (Maldive Islands), Rufiyaa', 1);
INSERT INTO currency VALUES ('MWK', 1, 0, NULL, 'Malawi, Kwachas', 1);
INSERT INTO currency VALUES ('MXN', 1, 0, NULL, 'Mexico, Pesos', 1);
INSERT INTO currency VALUES ('MYR', 1, 0, NULL, 'Malaysia, Ringgits', 1);
INSERT INTO currency VALUES ('MZM', 1, 0, NULL, 'Mozambique, Meticais', 1);
INSERT INTO currency VALUES ('NAD', 1, 0, NULL, 'Namibia, Dollars', 1);
INSERT INTO currency VALUES ('NGN', 1, 0, NULL, 'Nigeria, Nairas', 1);
INSERT INTO currency VALUES ('NIO', 1, 0, NULL, 'Nicaragua, Cordobas', 1);
INSERT INTO currency VALUES ('NPR', 1, 0, NULL, 'Nepal, Nepal Rupees', 1);
INSERT INTO currency VALUES ('NZD', 1, 0, NULL, 'New Zemoneyd, Dollars', 1);
INSERT INTO currency VALUES ('OMR', 1, 0, NULL, 'Oman, Rials', 1);
INSERT INTO currency VALUES ('PAB', 1, 0, NULL, 'Panama, Balboa', 1);
INSERT INTO currency VALUES ('PEN', 1, 0, NULL, 'Peru, Nuevos Soles', 1);
INSERT INTO currency VALUES ('PGK', 1, 0, NULL, 'Papua New Guinea, Kina', 1);
INSERT INTO currency VALUES ('PHP', 1, 0, NULL, 'Philippines, Pesos', 1);
INSERT INTO currency VALUES ('PKR', 1, 0, NULL, 'Pakistan, Rupees', 1);
INSERT INTO currency VALUES ('PLN', 1, 0, NULL, 'Poland, Zlotych', 1);
INSERT INTO currency VALUES ('PYG', 1, 0, NULL, 'Paraguay, Guarani', 1);
INSERT INTO currency VALUES ('QAR', 1, 0, NULL, 'Qatar, Rials', 1);
INSERT INTO currency VALUES ('RON', 1, 0, NULL, 'Romania, New Lei', 1);
INSERT INTO currency VALUES ('RUB', 1, 0, NULL, 'Russia, Rubles', 1);
INSERT INTO currency VALUES ('RWF', 1, 0, NULL, 'Rwanda, Rwanda Francs', 1);
INSERT INTO currency VALUES ('SAR', 1, 0, NULL, 'Saudi Arabia, Riyals', 1);
INSERT INTO currency VALUES ('SBD', 1, 0, NULL, 'Solomon Islands, Dollars', 1);
INSERT INTO currency VALUES ('SCR', 1, 0, NULL, 'Seychelles, Rupees', 1);
INSERT INTO currency VALUES ('SDD', 1, 0, NULL, 'Sudan, Dinars', 1);
INSERT INTO currency VALUES ('SGD', 1, 0, NULL, 'Singapore, Dollars', 1);
INSERT INTO currency VALUES ('SHP', 1, 0, NULL, 'Saint Helena, Pounds', 1);
INSERT INTO currency VALUES ('SIT', 1, 0, NULL, 'Slovenia, Tolars', 1);
INSERT INTO currency VALUES ('SKK', 1, 0, NULL, 'Slovakia, Koruny', 1);
INSERT INTO currency VALUES ('SLL', 1, 0, NULL, 'Sierra Leone, Leones', 1);
INSERT INTO currency VALUES ('SOS', 1, 0, NULL, 'Somalia, Shillings', 1);
INSERT INTO currency VALUES ('SPL', 1, 0, NULL, 'Seborga, Luigini', 1);
INSERT INTO currency VALUES ('SRD', 1, 0, NULL, 'Suriname, Dollars', 1);
INSERT INTO currency VALUES ('STD', 1, 0, NULL, 'S&atilde;o Tome and Principe, Dobras', 1);
INSERT INTO currency VALUES ('SVC', 1, 0, NULL, 'El Salvador, Colones', 1);
INSERT INTO currency VALUES ('SYP', 1, 0, NULL, 'Syria, Pounds', 1);
INSERT INTO currency VALUES ('SZL', 1, 0, NULL, 'Swaziland, Emmoneygeni', 1);
INSERT INTO currency VALUES ('CZK', 1, 0, NULL, 'Czech Republic, Koruny', 1);
INSERT INTO currency VALUES ('GBP', 1, 1, 0, 'United Kingdom, Pounds',1);
INSERT INTO currency VALUES ('SEK', 1, 0, NULL, 'Sweden, Kronor', 1);
INSERT INTO currency VALUES ('AUD', 1, 0, NULL, 'Australia, Dollars', 1);
INSERT INTO currency VALUES ('DKK', 1, 0, NULL, 'Denmark, Kroner', 1);
INSERT INTO currency VALUES ('NOK', 1, 0, NULL, 'Norway, Krone', 1);
INSERT INTO currency VALUES ('EUR', 0.93041664, 1, 1, 'Euro Member Countries,Euro', 1);
INSERT INTO currency VALUES ('USD', 0.63499999, 1, 2, 'United States of America, Dollars', 1);


-- domain is an area of the accounts that is a whole.  Used primarily so we can do special things to transactions between domains


-- an account, the fundemental accounting vehicle within the system.      
CREATE TABLE account (
    name character varying PRIMARY KEY,    -- name of the account
    bversion bigint DEFAULT 1 NOT NULL,    -- this is incremented when the balance is updated to check that parallel edits are not happening
    dversion bigint DEFAULT 1 NOT NULL,    -- this is incremented when the details of the account are updated to check for parallel edits
    currency character(3) REFERENCES currency(name),  -- currency in which to show transactions
    code integer REFERENCES account_code(id) ON DELETE SET NULL ON UPDATE CASCADE, -- account code for formal accounting (NULL says not used)
    balance bigint DEFAULT 0 NOT NULL, -- opening balance of the account 
    date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date when opening balance was set
    domain character varying -- domain that account belongs to (free text at the moment)
);

INSERT INTO account (name,currency,balance,domain) VALUES ('Cash', 'GBP', 0, 'personal');



-- a transaction, the key component related to movement of money, or notional money, between accounts

CREATE TABLE xaction (
    id integer PRIMARY KEY,
    date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date of transaction
    version bigint DEFAULT 1 NOT NULL,   -- version of transaction, used to check for parallel updates
    amount bigint DEFAULT 0 NOT NULL, -- amount of transaction (times 100 to make it an integer) of transaction in currency below
    currency character(3) NOT NULL REFERENCES currency(name),   -- currency transaction was conducted in
    src character varying REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL, -- source account (debits this account when amount is +ve [the normal case])
    srcamount bigint,                 -- if the source account is a different currency then this is the amount (same sign as) in that currency
    srcclear boolean DEFAULT 0 NOT NULL,  -- the amount is cleared in the source account
    srccode character varying REFERENCES account_code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to increment with this transaction
    dst character varying REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL, -- destination account (credits this account when amount is +ve [the normal case])
    dstamount bigint,                 -- if the destination account is a different currency then this is the ammount in that currency
    dstclear boolean DEFAULT 0 NOT NULL, -- if the amount is cleared in the destination account
    dstcode character varying REFERENCES account_code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to decrement with this transaction
    description character varying,      -- details of the transaction
    rno character varying,              -- reference number for the transaction
    repeat integer DEFAULT 0 NOT NULL REFERENCES repeat(rkey) -- if the transaction is repeating
);


CREATE INDEX xaction_idx_dst ON xaction (dst);
CREATE INDEX xaction_idx_src ON xaction (src);


CREATE TABLE config (
    version integer DEFAULT 1 NOT NULL,
    db_version integer,
    home_account character varying REFERENCES account(name) ON DELETE SET NULL ON UPDATE CASCADE,
    extn_account character varying REFERENCES account(name) ON DELETE SET NULL ON UPDATE CASCADE,
    repeat_days integer,
    default_currency character(3) REFERENCES currency(name) ON UPDATE CASCADE,
    demo boolean DEFAULT 0 NOT NULL
);

INSERT INTO config(db_version,home_account,extn_account,repeat_days,default_currency) VALUES (1,'Cash','Cash', 90, 'GBP');

END TRANSACTION;
