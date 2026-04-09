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



import {Logger} from '@akc42/server-utils';
import mdb from '@akc42/sqlite-db';

const logger = Logger('accountreconcile', 'error');

export default async function(user, params, responder) {
  
  try {
    mdb.transaction(db => {
      const {bversion} = db.get`SELECT bversion FROM account WHERE name = ${params.account}`??{bversion:0};
      if (params.bversion !== bversion) throw new Error(`Account ${params.account} has version ${bversion}, send ${params.bversion}, Stopping Reconciliation`)
      for (const transaction of params.transactions) {
        const {version} = db.get`SELECT version FROM xaction WHERE id = ${transaction[0]}`??{version:0};
        if (version !== transaction[1]) throw new Error(`Transaction ${transaction[0]} has version ${version}, sent ${transaction[1]}. Stopping Reconciliation`)
        db.run`WITH a(name) AS (SELECT ${params.account}) UPDATE xaction AS t SET version = t.version + 1, 
          srcclear = CASE WHEN a.name = t.src THEN 1 ELSE t.srcclear END, dstclear = CASE WHEN a.name = t.dst THEN 1 ELSE t.dstclear END   
          FROM a WHERE t.id = ${transaction[0]}`;
      }
      db.run`UPDATE account SET bversion = bversion + 1, balance = ${params.balance},  date = (strftime('%s','now')) WHERE name = ${params.account}`;
    });
    responder.addSection('status','OK'); 
  } catch(e) {
    logger('Transaction failed with',e);
    responder.addSection('status',e.message); 
  }
};