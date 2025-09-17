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
import {Debug} from '@akc42/server-utils';
import {insertRepeats,dbDateToString} from '../utils.js';
import DB from '@akc42/sqlite-db';
const db = DB();
const debug = Debug('csvdomain');

export default async function(user, params, responder) {

  debug('new request from', user.name, 'with params', params);

  const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
  const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
    repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
  const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
  const getCodes = db.prepare(`SELECT
      c.id AS id, 
      c.type AS type, 
      c.description AS description,
      sum(t.dfamount/CASE WHEN c.type='A' THEN 3 WHEN c.type = 'B' AND c.id = t.srccode THEN -1 ELSE 1 END) AS tamount           
  FROM 
      dfxaction AS t, account AS a, code AS c
  WHERE
      t.date >= ? - CASE WHEN c.type = 'A' THEN 63072000 ELSE 0 END AND t.date <= ? AND
      c.type <> 'O' AND
      a.domain = ? AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
  GROUP BY
      c.id, c.type, c.description
  ORDER BY 
    CASE c.type WHEN 'A' THEN 1 WHEN 'C' THEN 2 WHEN 'R' THEN 0 ELSE 3 END,
    description COLLATE NOCASE ASC`);
  const getXactions = db.prepare(`SELECT t.id,t.date,t.description, t.rno, 
    t.dfamount * CASE WHEN c.type = 'B' AND c.id = t.srccode THEN -1 ELSE 1 END as amount, a.name AS account
    FROM dfxaction t,
    currency cu, 
    code c JOIN account a ON (a.name = t.src AND t.srccode = c.id) 
    OR (a.name = t.dst AND t.dstcode = c.id)
    WHERE cu.priority = 0 AND t.date BETWEEN ?- CASE WHEN c.type = 'A' THEN 63072000 ELSE 0 END AND ? 
    AND a.domain = ? AND c.id = ? ORDER BY t.date`);

  const yearEnd = s.get('year_end');
  const monthEnd = Math.floor(yearEnd / 100) - 1 //Range 0 to 11 for Dates 
  const dayEnd = yearEnd % 100;
  const endDate = new Date();
  const today = endDate.getTime();
  endDate.setHours(23, 59, 59); //last possible time
  debug('enddate setting time', endDate);
  endDate.setMonth(monthEnd);
  debug('enddate, setting month', endDate)
  endDate.setDate(dayEnd);
  debug('enddate, setting endDate', endDate)
  endDate.setFullYear(params.year);
  debug('enddate, setting endDate', endDate);
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);
  debug('startdate, setting startDate', startDate);
  const start = Math.floor(startDate.getTime() / 1000) + 1;
  const end = Math.ceil(endDate.getTime() / 1000);

  debug('start and end are:', start, end);
  const repeatCount = db.prepare(`SELECT COUNT(*) FROM xaction t, account a, code c   
  WHERE
      t.repeat <> 0 AND
      t.date <= ? AND
      c.type <> 'O' AND
      a.domain = ? AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`)
    .pluck().bind(end, params.domain);
  const repeats = db.prepare(`SELECT t.* FROM xaction t, account a, code c WHERE
      t.repeat <> 0 AND
      t.date <= ? AND
      c.type <> 'O' AND
      a.domain = ? AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`).bind(end, params.domain);
  let codes;
  let profit = 0;
  try {
    db.transaction(() => {
      insertRepeats(repeatCount, repeats, insertRepeat, updateRepeat);


      codes = getCodes.all(start, end, params.domain);
      
      for(const code of codes) {
        switch (code.type) {
          case 'R':
          case 'B':
            profit += code.tamount;
            break;
          case 'C':
          case 'A':
            profit -= code.tamount;
            break;

        }
        code.profit = (profit/100).toFixed(2);
        code.tamount = (code.tamount/100).toFixed(2);

        code.transactions = getXactions.all(start, end, params.domain, code.id);   
        debug('read', code.transactions.length, 'transactions for code', code.id); 
        let cumulative = 0;
        responder.defineFields('id,date,rno,description,amount,cumulative,x,x,x')   
        for(const transaction of code.transactions) {
          cumulative += Math.round(transaction.amount / (code.type === 'A' ? 3 : 1));  
          transaction.cumulative = (cumulative/100).toFixed(2); 
          transaction.amount = (transaction.amount/100).toFixed(2);
          transaction.date = dbDateToString(transaction.date);
        }
      }

      throw new Error('Rollback'); //force a rollback
    })();
  } catch (e) {
    //expected - rollback
    if (e.message !== 'Rollback') {
      debug('Rollback error', e);
      throw e;
    }
  }
  responder.setName(`Domain-${params.domain}_${params.year}`);
  responder.makeHeader('TID:Date:Ref:Description:Amount:Cumulative:Account:Contribution:Profit:Code');
  for (const code of codes) {
    responder.defineFields('x:x:x:description:x:x:x:tamount:profit:type');
    await responder.write(code);
    responder.defineFields('id:date:rno:description:amount:cumulative:account:x:x:x');
    for(const transaction of code.transactions) {
      await responder.write(transaction);
    }
  }
  responder.defineFields('x:x:x:description:x:x:x:x:profit:x');
  responder.write({});
  responder.write({ description: 'Overall Profit', profit: (profit/100).toFixed(2) });
  debug('request complete')

};
