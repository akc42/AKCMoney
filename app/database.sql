
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


COMMENT ON DATABASE money IS 'AKC Money Database';

CREATE SEQUENCE version
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


SELECT pg_catalog.setval('version', 1, true);

CREATE TABLE account_type (
    atype char(6) NOT NULL,
    description character varying(100)
);

ALTER TABLE ONLY account_type
    ADD CONSTRAINT account_type_pkey PRIMARY KEY (atype);

INSERT INTO account_type VALUES ('Debit ', 'This account is normally the source of a transaction');
INSERT INTO account_type VALUES ('Credit', 'This account is normally the destination of a transaction');

CREATE TABLE repeat (
    rkey integer NOT NULL,
    description character varying(25) NOT NULL
);

ALTER TABLE ONLY repeat
    ADD CONSTRAINT repeat_pkey PRIMARY KEY (rkey);

INSERT INTO repeat VALUES (0, 'No Repeat');
INSERT INTO repeat VALUES (1, 'Weekly');
INSERT INTO repeat VALUES (2, 'Fortnightly');
INSERT INTO repeat VALUES (3, 'Monthly');
INSERT INTO repeat VALUES (4, 'Monthly (at End)');
INSERT INTO repeat VALUES (5, 'Quarterly');
INSERT INTO repeat VALUES (6, 'Yearly');

CREATE TABLE currency (
    name character(3) NOT NULL,
    rate real DEFAULT 1.0 NOT NULL,
    display boolean DEFAULT false,
    priority smallint,
    description character varying,
    version bigint DEFAULT nextval(('version'::text)::regclass) NOT NULL
);

ALTER TABLE ONLY currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (name);

INSERT INTO currency VALUES ('THB', 1, false, NULL, 'Thailand, Baht', 1);
INSERT INTO currency VALUES ('TJS', 1, false, NULL, 'Tajikistan, Somoni', 1);
INSERT INTO currency VALUES ('TMM', 1, false, NULL, 'Turkmenistan, Manats', 1);
INSERT INTO currency VALUES ('TND', 1, false, NULL, 'Tunisia, Dinars', 1);
INSERT INTO currency VALUES ('TOP', 1, false, NULL, 'Tonga, Pa''anga', 1);
INSERT INTO currency VALUES ('TRL', 1, false, NULL, 'Turkey, Liras [being phased out]', 1);
INSERT INTO currency VALUES ('TRY', 1, false, NULL, 'Turkey, New Lira', 1);
INSERT INTO currency VALUES ('TTD', 1, false, NULL, 'Trinidad and Tobago, Dollars', 1);
INSERT INTO currency VALUES ('TVD', 1, false, NULL, 'Tuvalu, Tuvalu Dollars', 1);
INSERT INTO currency VALUES ('TWD', 1, false, NULL, 'Taiwan, New Dollars', 1);
INSERT INTO currency VALUES ('TZS', 1, false, NULL, 'Tanzania, Shillings', 1);
INSERT INTO currency VALUES ('UAH', 1, false, NULL, 'Ukraine, Hryvnia', 1);
INSERT INTO currency VALUES ('UGX', 1, false, NULL, 'Uganda, Shillings', 1);
INSERT INTO currency VALUES ('UYU', 1, false, NULL, 'Uruguay, Pesos', 1);
INSERT INTO currency VALUES ('UZS', 1, false, NULL, 'Uzbekistan, Sums', 1);
INSERT INTO currency VALUES ('VEB', 1, false, NULL, 'Venezuela, Bolivares', 1);
INSERT INTO currency VALUES ('VND', 1, false, NULL, 'Viet Nam, Dong', 1);
INSERT INTO currency VALUES ('VUV', 1, false, NULL, 'Vanuatu, Vatu', 1);
INSERT INTO currency VALUES ('WST', 1, false, NULL, 'Samoa, Tala', 1);
INSERT INTO currency VALUES ('XAU', 1, false, NULL, 'Gold, Ounces', 1);
INSERT INTO currency VALUES ('XAF', 1, false, NULL, 'Communaut&eacute; Financi&egrave;re Africaine BEAC, Francs', 1);
INSERT INTO currency VALUES ('XAG', 1, false, NULL, 'Silver, Ounces', 1);
INSERT INTO currency VALUES ('XCD', 1, false, NULL, 'East Caribbean Dollars', 1);
INSERT INTO currency VALUES ('XDR', 1, false, NULL, 'International Monetary Fund (IMF) Special Drawing Rights', 1);
INSERT INTO currency VALUES ('XOF', 1, false, NULL, 'Communaut&eacute; Financi&egrave;re Africaine BCEAO, Francs', 1);
INSERT INTO currency VALUES ('XPD', 1, false, NULL, 'Palladium Ounces', 1);
INSERT INTO currency VALUES ('XPF', 1, false, NULL, 'Comptoirs Fran&ccedil;ais du Pacifique Francs', 1);
INSERT INTO currency VALUES ('XPT', 1, false, NULL, 'Platinum, Ounces', 1);
INSERT INTO currency VALUES ('YER', 1, false, NULL, 'Yemen, Rials', 1);
INSERT INTO currency VALUES ('ZAR', 1, false, NULL, 'South Africa, Rand', 1);
INSERT INTO currency VALUES ('ZMK', 1, false, NULL, 'Zambia, Kwacha', 1);
INSERT INTO currency VALUES ('ZWD', 1, false, NULL, 'Zimbabwe, Zimbabwe Dollars', 1);
INSERT INTO currency VALUES ('AED', 1, false, NULL, 'United Arab Emirates, Dirhams', 1);
INSERT INTO currency VALUES ('AFA', 1, false, NULL, 'Afghanistan, Afghanis', 1);
INSERT INTO currency VALUES ('ALL', 1, false, NULL, 'Albania, Leke', 1);
INSERT INTO currency VALUES ('AMD', 1, false, NULL, 'Armenia, Drams', 1);
INSERT INTO currency VALUES ('ANG', 1, false, NULL, 'Netherlands Antilles, Guilders (also called Florins)', 1);
INSERT INTO currency VALUES ('AOA', 1, false, NULL, 'Angola, Kwanza', 1);
INSERT INTO currency VALUES ('ARS', 1, false, NULL, 'Argentina, Pesos', 1);
INSERT INTO currency VALUES ('AWG', 1, false, NULL, 'Aruba, Guilders (also called Florins)', 1);
INSERT INTO currency VALUES ('AZM', 1, false, NULL, 'Azerbaijan, Manats', 1);
INSERT INTO currency VALUES ('BAM', 1, false, NULL, 'Bosnia and Herzegovina, Convertible Marka', 1);
INSERT INTO currency VALUES ('BBD', 1, false, NULL, 'Barbados, Dollars', 1);
INSERT INTO currency VALUES ('BDT', 1, false, NULL, 'Bangladesh, Taka', 1);
INSERT INTO currency VALUES ('BGN', 1, false, NULL, 'Bulgaria, Leva', 1);
INSERT INTO currency VALUES ('BHD', 1, false, NULL, 'Bahrain, Dinars', 1);
INSERT INTO currency VALUES ('BIF', 1, false, NULL, 'Burundi, Francs', 1);
INSERT INTO currency VALUES ('BMD', 1, false, NULL, 'Bermuda, Dollars', 1);
INSERT INTO currency VALUES ('BND', 1, false, NULL, 'Brunei Darussalam, Dollars', 1);
INSERT INTO currency VALUES ('BOB', 1, false, NULL, 'Bolivia, Bolivianos', 1);
INSERT INTO currency VALUES ('BRL', 1, false, NULL, 'Brazil, Brazil Real', 1);
INSERT INTO currency VALUES ('BSD', 1, false, NULL, 'Bahamas, Dollars', 1);
INSERT INTO currency VALUES ('BTN', 1, false, NULL, 'Bhutan, Ngultrum', 1);
INSERT INTO currency VALUES ('BWP', 1, false, NULL, 'Botswana, Pulas', 1);
INSERT INTO currency VALUES ('BYR', 1, false, NULL, 'Belarus, Rubles', 1);
INSERT INTO currency VALUES ('BZD', 1, false, NULL, 'Belize, Dollars', 1);
INSERT INTO currency VALUES ('CAD', 1, false, NULL, 'Canada, Dollars', 1);
INSERT INTO currency VALUES ('CDF', 1, false, NULL, 'Congo/Kinshasa, Congolese Francs', 1);
INSERT INTO currency VALUES ('CHF', 1, false, NULL, 'Switzerland, Francs', 1);
INSERT INTO currency VALUES ('CLP', 1, false, NULL, 'Chile, Pesos', 1);
INSERT INTO currency VALUES ('CNY', 1, false, NULL, 'China, Yuan Renminbi', 1);
INSERT INTO currency VALUES ('COP', 1, false, NULL, 'Colombia, Pesos', 1);
INSERT INTO currency VALUES ('CRC', 1, false, NULL, 'Costa Rica, Colones', 1);
INSERT INTO currency VALUES ('CSD', 1, false, NULL, 'Serbia, Dinars', 1);
INSERT INTO currency VALUES ('CUP', 1, false, NULL, 'Cuba, Pesos', 1);
INSERT INTO currency VALUES ('CVE', 1, false, NULL, 'Cape Verde, Escudos', 1);
INSERT INTO currency VALUES ('CYP', 1, false, NULL, 'Cyprus, Pounds', 1);
INSERT INTO currency VALUES ('DJF', 1, false, NULL, 'Djibouti, Francs', 1);
INSERT INTO currency VALUES ('ISK', 1, false, NULL, 'Iceland, Kronur', 1);
INSERT INTO currency VALUES ('DOP', 1, false, NULL, 'Dominican Republic, Pesos', 1);
INSERT INTO currency VALUES ('DZD', 1, false, NULL, 'Algeria, Algeria Dinars', 1);
INSERT INTO currency VALUES ('EEK', 1, false, NULL, 'Estonia, Krooni', 1);
INSERT INTO currency VALUES ('EGP', 1, false, NULL, 'Egypt, Pounds', 1);
INSERT INTO currency VALUES ('ERN', 1, false, NULL, 'Eritrea, Nakfa', 1);
INSERT INTO currency VALUES ('ETB', 1, false, NULL, 'Ethiopia, Birr', 1);
INSERT INTO currency VALUES ('FJD', 1, false, NULL, 'Fiji,Dollars', 1);
INSERT INTO currency VALUES ('FKP', 1, false, NULL, 'Falkland Islands (Malvinas), Pounds', 1);
INSERT INTO currency VALUES ('GEL', 1, false, NULL, 'Georgia, Lari', 1);
INSERT INTO currency VALUES ('GGP', 1, false, NULL, 'Guernsey, Pounds', 1);
INSERT INTO currency VALUES ('GHC', 1, false, NULL, 'Ghana, Cedis', 1);
INSERT INTO currency VALUES ('GIP', 1, false, NULL, 'Gibraltar, Pounds', 1);
INSERT INTO currency VALUES ('GMD', 1, false, NULL, 'Gambia, Dalasi', 1);
INSERT INTO currency VALUES ('GNF', 1, false, NULL, 'Guinea, Francs', 1);
INSERT INTO currency VALUES ('GTQ', 1, false, NULL, 'Guatemala, Quetzales', 1);
INSERT INTO currency VALUES ('GYD', 1, false, NULL, 'Guyana, Dollars', 1);
INSERT INTO currency VALUES ('HKD', 1, false, NULL, 'Hong Kong, Dollars', 1);
INSERT INTO currency VALUES ('HNL', 1, false, NULL, 'Honduras, Lempiras', 1);
INSERT INTO currency VALUES ('HRK', 1, false, NULL, 'Croatia, Kuna', 1);
INSERT INTO currency VALUES ('HTG', 1, false, NULL, 'Haiti, Gourdes', 1);
INSERT INTO currency VALUES ('HUF', 1, false, NULL, 'Hungary, Forint', 1);
INSERT INTO currency VALUES ('IDR', 1, false, NULL, 'Indonesia, Rupiahs', 1);
INSERT INTO currency VALUES ('ILS', 1, false, NULL, 'Israel, New Shekels', 1);
INSERT INTO currency VALUES ('IMP', 1, false, NULL, 'Isle of Man, Pounds', 1);
INSERT INTO currency VALUES ('INR', 1, false, NULL, 'India, Rupees', 1);
INSERT INTO currency VALUES ('IQD', 1, false, NULL, 'Iraq, Dinars', 1);
INSERT INTO currency VALUES ('IRR', 1, false, NULL, 'Iran, Rials', 1);
INSERT INTO currency VALUES ('JEP', 1, false, NULL, 'Jersey, Pounds', 1);
INSERT INTO currency VALUES ('JMD', 1, false, NULL, 'Jamaica, Dollars', 1);
INSERT INTO currency VALUES ('JOD', 1, false, NULL, 'Jordan, Dinars', 1);
INSERT INTO currency VALUES ('JPY', 1, false, NULL, 'Japan, Yen', 1);
INSERT INTO currency VALUES ('KES', 1, false, NULL, 'Kenya, Shillings', 1);
INSERT INTO currency VALUES ('KGS', 1, false, NULL, 'Kyrgyzstan, Soms', 1);
INSERT INTO currency VALUES ('KHR', 1, false, NULL, 'Cambodia, Riels', 1);
INSERT INTO currency VALUES ('KMF', 1, false, NULL, 'Comoros, Francs', 1);
INSERT INTO currency VALUES ('KPW', 1, false, NULL, 'Korea (North), Won', 1);
INSERT INTO currency VALUES ('KRW', 1, false, NULL, 'Korea (South), Won', 1);
INSERT INTO currency VALUES ('KWD', 1, false, NULL, 'Kuwait, Dinars', 1);
INSERT INTO currency VALUES ('KYD', 1, false, NULL, 'Cayman Islands, Dollars', 1);
INSERT INTO currency VALUES ('KZT', 1, false, NULL, 'Kazakhstan, Tenge', 1);
INSERT INTO currency VALUES ('LAK', 1, false, NULL, 'Laos, Kips', 1);
INSERT INTO currency VALUES ('LBP', 1, false, NULL, 'Lebanon, Pounds', 1);
INSERT INTO currency VALUES ('LKR', 1, false, NULL, 'Sri Lanka, Rupees', 1);
INSERT INTO currency VALUES ('LRD', 1, false, NULL, 'Liberia, Dollars', 1);
INSERT INTO currency VALUES ('LSL', 1, false, NULL, 'Lesotho, Maloti', 1);
INSERT INTO currency VALUES ('LTL', 1, false, NULL, 'Lithuania, Litai', 1);
INSERT INTO currency VALUES ('LVL', 1, false, NULL, 'Latvia, Lati', 1);
INSERT INTO currency VALUES ('LYD', 1, false, NULL, 'Libya, Dinars', 1);
INSERT INTO currency VALUES ('MAD', 1, false, NULL, 'Morocco, Dirhams', 1);
INSERT INTO currency VALUES ('MDL', 1, false, NULL, 'Moldova, Lei', 1);
INSERT INTO currency VALUES ('MGA', 1, false, NULL, 'Madagascar, Ariary', 1);
INSERT INTO currency VALUES ('MKD', 1, false, NULL, 'Macedonia, Denars', 1);
INSERT INTO currency VALUES ('MMK', 1, false, NULL, 'Myanmar (Burma), Kyats', 1);
INSERT INTO currency VALUES ('MNT', 1, false, NULL, 'Mongolia, Tugriks', 1);
INSERT INTO currency VALUES ('MOP', 1, false, NULL, 'Macau, Patacas', 1);
INSERT INTO currency VALUES ('MRO', 1, false, NULL, 'Mauritania, Ouguiyas', 1);
INSERT INTO currency VALUES ('MTL', 1, false, NULL, 'Malta, Liri', 1);
INSERT INTO currency VALUES ('MUR', 1, false, NULL, 'Mauritius, Rupees', 1);
INSERT INTO currency VALUES ('MVR', 1, false, NULL, 'Maldives (Maldive Islands), Rufiyaa', 1);
INSERT INTO currency VALUES ('MWK', 1, false, NULL, 'Malawi, Kwachas', 1);
INSERT INTO currency VALUES ('MXN', 1, false, NULL, 'Mexico, Pesos', 1);
INSERT INTO currency VALUES ('MYR', 1, false, NULL, 'Malaysia, Ringgits', 1);
INSERT INTO currency VALUES ('MZM', 1, false, NULL, 'Mozambique, Meticais', 1);
INSERT INTO currency VALUES ('NAD', 1, false, NULL, 'Namibia, Dollars', 1);
INSERT INTO currency VALUES ('NGN', 1, false, NULL, 'Nigeria, Nairas', 1);
INSERT INTO currency VALUES ('NIO', 1, false, NULL, 'Nicaragua, Cordobas', 1);
INSERT INTO currency VALUES ('NPR', 1, false, NULL, 'Nepal, Nepal Rupees', 1);
INSERT INTO currency VALUES ('NZD', 1, false, NULL, 'New Zemoneyd, Dollars', 1);
INSERT INTO currency VALUES ('OMR', 1, false, NULL, 'Oman, Rials', 1);
INSERT INTO currency VALUES ('PAB', 1, false, NULL, 'Panama, Balboa', 1);
INSERT INTO currency VALUES ('PEN', 1, false, NULL, 'Peru, Nuevos Soles', 1);
INSERT INTO currency VALUES ('PGK', 1, false, NULL, 'Papua New Guinea, Kina', 1);
INSERT INTO currency VALUES ('PHP', 1, false, NULL, 'Philippines, Pesos', 1);
INSERT INTO currency VALUES ('PKR', 1, false, NULL, 'Pakistan, Rupees', 1);
INSERT INTO currency VALUES ('PLN', 1, false, NULL, 'Poland, Zlotych', 1);
INSERT INTO currency VALUES ('PYG', 1, false, NULL, 'Paraguay, Guarani', 1);
INSERT INTO currency VALUES ('QAR', 1, false, NULL, 'Qatar, Rials', 1);
INSERT INTO currency VALUES ('RON', 1, false, NULL, 'Romania, New Lei', 1);
INSERT INTO currency VALUES ('RUB', 1, false, NULL, 'Russia, Rubles', 1);
INSERT INTO currency VALUES ('RWF', 1, false, NULL, 'Rwanda, Rwanda Francs', 1);
INSERT INTO currency VALUES ('SAR', 1, false, NULL, 'Saudi Arabia, Riyals', 1);
INSERT INTO currency VALUES ('SBD', 1, false, NULL, 'Solomon Islands, Dollars', 1);
INSERT INTO currency VALUES ('SCR', 1, false, NULL, 'Seychelles, Rupees', 1);
INSERT INTO currency VALUES ('SDD', 1, false, NULL, 'Sudan, Dinars', 1);
INSERT INTO currency VALUES ('SGD', 1, false, NULL, 'Singapore, Dollars', 1);
INSERT INTO currency VALUES ('SHP', 1, false, NULL, 'Saint Helena, Pounds', 1);
INSERT INTO currency VALUES ('SIT', 1, false, NULL, 'Slovenia, Tolars', 1);
INSERT INTO currency VALUES ('SKK', 1, false, NULL, 'Slovakia, Koruny', 1);
INSERT INTO currency VALUES ('SLL', 1, false, NULL, 'Sierra Leone, Leones', 1);
INSERT INTO currency VALUES ('SOS', 1, false, NULL, 'Somalia, Shillings', 1);
INSERT INTO currency VALUES ('SPL', 1, false, NULL, 'Seborga, Luigini', 1);
INSERT INTO currency VALUES ('SRD', 1, false, NULL, 'Suriname, Dollars', 1);
INSERT INTO currency VALUES ('STD', 1, false, NULL, 'S&atilde;o Tome and Principe, Dobras', 1);
INSERT INTO currency VALUES ('SVC', 1, false, NULL, 'El Salvador, Colones', 1);
INSERT INTO currency VALUES ('SYP', 1, false, NULL, 'Syria, Pounds', 1);
INSERT INTO currency VALUES ('SZL', 1, false, NULL, 'Swaziland, Emmoneygeni', 1);
INSERT INTO currency VALUES ('CZK', 1, false, NULL, 'Czech Republic, Koruny', 1);
INSERT INTO currency VALUES ('GBP', 1, true, 0, 'United Kingdom, Pounds',1);
INSERT INTO currency VALUES ('SEK', 1, false, NULL, 'Sweden, Kronor', 1);
INSERT INTO currency VALUES ('AUD', 1, false, NULL, 'Australia, Dollars', 1);
INSERT INTO currency VALUES ('DKK', 1, false, NULL, 'Denmark, Kroner', 1);
INSERT INTO currency VALUES ('NOK', 1, false, NULL, 'Norway, Krone', 1);
INSERT INTO currency VALUES ('EUR', 0.93041664, true, 1, 'Euro Member Countries,Euro', 1);
INSERT INTO currency VALUES ('USD', 0.63499999, true, 2, 'United States of America, Dollars', 1);

CREATE TABLE account (
    name character varying NOT NULL,
    bversion bigint DEFAULT nextval(('version'::text)::regclass) NOT NULL,
    dversion bigint DEFAULT nextval(('version'::text)::regclass) NOT NULL,
    currency character(3),
    atype character(6) DEFAULT 'Debit ' NOT NULL,
    balance bigint DEFAULT 0 NOT NULL,
    date bigint DEFAULT date_part('epoch'::text,now())
);

ALTER TABLE ONLY account
    ADD CONSTRAINT account_pkey PRIMARY KEY (name),
    ADD CONSTRAINT account_currency_fkey FOREIGN KEY (currency) REFERENCES currency(name),
    ADD CONSTRAINT account_atype_fkey FOREIGN KEY (atype) REFERENCES account_type(atype);

INSERT INTO account (name,bversion,dversion,currency,atype,balance,date) VALUES ('Cash', DEFAULT, DEFAULT, 'GBP', 'Debit ', 0, DEFAULT);

CREATE SEQUENCE transaction_id_seq
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

SELECT pg_catalog.setval('transaction_id_seq', 1, true);

CREATE TABLE transaction (
    id integer DEFAULT nextval('transaction_id_seq'::regclass) NOT NULL,
    date bigint DEFAULT date_part('epoch'::text,now()) NOT NULL,
    version bigint DEFAULT nextval(('version'::text)::regclass) NOT NULL,
    amount bigint DEFAULT 0 NOT NULL,
    currency character(3) DEFAULT 'GBP'::bpchar NOT NULL,
    src character varying,
    srcamount bigint,
    srcclear boolean DEFAULT false NOT NULL,
    dst character varying,
    dstamount bigint,
    dstclear boolean DEFAULT false NOT NULL,
    description character varying,
    rno character varying,
    repeat integer DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY transaction
    ADD CONSTRAINT transaction_pkey PRIMARY KEY (id);


CREATE INDEX transaction_idx_dst ON transaction USING btree (dst);
CREATE INDEX transaction_idx_src ON transaction USING btree (src);

ALTER TABLE ONLY transaction
    ADD CONSTRAINT transaction_src_fkey FOREIGN KEY (src) REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT transaction_dst_fkey FOREIGN KEY (dst) REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT transaction_currency_fkey FOREIGN KEY (currency) REFERENCES currency(name),
    ADD CONSTRAINT transaction_repeat_fkey FOREIGN KEY (repeat) REFERENCES repeat(rkey);

CREATE TABLE config (
    version bigint DEFAULT nextval(('version'::text)::regclass) NOT NULL,
    db_version integer,
    home_account character varying,
    extn_account character varying,
    repeat_days integer,
    default_currency character(3),
    demo boolean DEFAULT false NOT NULL
);

INSERT INTO config(db_version,home_account,extn_account,repeat_days,default_currency) VALUES (2,'Cash','Cash', 90, 'GBP');
ALTER TABLE ONLY config
    ADD CONSTRAINT config_home_account_fkey FOREIGN KEY (home_account) REFERENCES account(name) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT config_extn_account_fkey FOREIGN KEY (extn_account) REFERENCES account(name) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT config_default_currency_fkey FOREIGN KEY (default_currency) REFERENCES currency(name) ON UPDATE CASCADE;

 
