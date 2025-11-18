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

const debug = Debug('accountreconcile');

export default async function(user, params, responder) {
  const getVersion = db.prepare('SELECT bversion FROM account WHERE name = ?').pluck();
  const updateBalance = db.prepare(`UPDATE account SET bversion = bversion + 1, balance = ?, 
    date = (strftime('%s','now')) WHERE name = ?`);
  
  const getXactionVersion = db.prepare(`SELECT version FROM xaction WHERE id = ?`).pluck();
  const updateXaction = db.prepare(`WITH a(name) AS (SELECT ?) UPDATE xaction AS t SET version = t.version + 1, 
    srcclear = CASE WHEN a.name = t.src THEN 1 ELSE t.srcclear END,
    dstclear = CASE WHEN a.name = t.dst THEN 1 ELSE t.dstclear END   
    FROM a WHERE t.id = ?`);
  try {
    db.transaction(() => {
      const bversion = getVersion.get(params.account);
      if (params.bversion !== bversion) throw new Error(`Account ${params.account} has version ${bversion}, send ${params.bversion}, Stopping Reconciliation`)
      for (const transaction of params.transactions) {
        const version = getXactionVersion.get(transaction[0]);
        if (version !== transaction[1]) throw new Error(`Transaction ${transaction[0]} has version ${version}, sent ${transaction[1]}. Stopping Reconciliation`)
        updateXaction.run(params.account,transaction[0]);    
      }
      updateBalance.run(params.balance, params.account);
    })();
    responder.addSection('status','OK'); 
  } catch(e) {
    logger('error',e.message);
    responder.addSection('status',e.message); 
  }
};