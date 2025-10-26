/**
@licence
    Copyright (c) 2021 Alan Chandler, all rights reserved

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
    along with AKCMoney.  If not, see <http://www.gnu.org/licenses/>.
*/
import {Debug, logger} from '@akc42/server-utils';
import DB from '@akc42/sqlite-db';
const db = DB();

const debug = Debug('accountcurrency');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const getAccount = db.prepare('SELECT dversion, currency, balance, bversion FROM account WHERE name = ?');
  const updateAccount = db.prepare(`WITH items (rate, name, currency) AS (
    SELECT CASE 
        WHEN d.name = c.name AND d.name <> a.currency THEN 1/ac.rate
        WHEN d.name <> c.name AND d.name <> a.currency THEN  c.rate/ac.rate
        WHEN d.name <> c.name AND d.name = a.currency THEN c.rate
        ELSE 1
    END As Rate, a.name, c.name as currency
    FROM Currency c, Account a, Currency d, Currency ac 
    WHERE a.name = ? AND c.name = ? AND d.priority = 0 AND ac.name = a.currency)
    UPDATE account SET dversion = dversion + 1, currency = items.currency , balance = balance * items.rate, bversion = bversion + 1 FROM items WHERE account.name = items.name`);
  const getAccounts = db.prepare('SELECT name, domain, currency, archived, dversion FROM account ORDER BY archived, domain, name'); 
  //we can update all the transactions in the account with the following sql
  const updateXactions = db.prepare(`WITH items (rate, name, acurrency, ncurrency) AS (
    SELECT CASE 
        WHEN d.name = c.name AND d.name <> a.currency THEN 1/ac.rate
        WHEN d.name <> c.name AND d.name <> a.currency THEN  c.rate/ac.rate
        WHEN d.name <> c.name AND d.name = a.currency THEN c.rate
        ELSE 1
    END As Rate, a.name, a.currency AS acurrency, c.name AS ncurrency
    FROM Currency c, Account a, Currency d, Currency ac 
    WHERE a.name = ? AND c.name = ? AND d.priority = 0 AND ac.name = a.currency
)
UPDATE xaction AS t  
    SET srcamount = 
    CAST(CASE WHEN t.src = items.name THEN
        CASE WHEN t.currency = items.acurrency THEN t.amount * items.rate
        WHEN t.currency = items.ncurrency THEN NULL
        ELSE t.srcamount * items.rate END
    ELSE t.srcamount END AS INTEGER) ,
    dstamount = CAST(CASE WHEN t.dst = items.name THEN
        CASE WHEN t.currency = items.acurrency THEN t.amount * items.rate
        WHEN t.currency = items.ncurrency THEN NULL
        ELSE t.dstamount * items.rate END
    ELSE t.dstamount END AS INTEGER)
FROM items, currency c 
WHERE 
    (items.name = t.src OR items.name = t.dst)
    AND t.currency = c.name ;`);

  db.transaction(() => {
    //first version is still the same
    const {dversion,currency, balance, bversion} = getAccount.get(params.name);
    if (dversion === params.dversion) {
      updateXactions.run(params.name, params.currency);
      updateAccount.run(params.name, params.currency);
      responder.addSection('status', 'OK');
      responder.addSection('accounts', getAccounts.all())
    } else {
      responder.addSection('status', `Version Error Disk:${v}, Param:${params.dversion}`)
      logger('error', ` Account Currency Version Error Disk:${v}, Param:${params.dversion}`)
    }
  
  })();
  debug('request complete')
};
