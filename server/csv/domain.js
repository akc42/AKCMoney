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
import {insertRepeats,dbDateToString} from '../utils.js';
import mdb from '@akc42/sqlite-db';


export default async function(user, params, responder) {
  try {
    await mdb.transaction(async db => {
      responder.setName(`Domain-${params.domain}_${params.year}`);
      responder.makeHeader('TID:Date:Ref:Description:Amount:Depreciation:Cumulative:Contribution:Profit:Code:Account');
      const {yearEnd} = db.get`SELECT value AS yearEnd FROM settings WHERE name = ${'year_end'}`??{yearEnd:1231};
      const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
        repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
      const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
      const monthEnd = Math.floor(yearEnd / 100) - 1 //Range 0 to 11 for Dates 
      const dayEnd = yearEnd % 100;
      const endDate = new Date();
      endDate.setHours(23, 59, 59); //last possible time
      endDate.setMonth(monthEnd);
      endDate.setDate(dayEnd);
      endDate.setFullYear(params.year);
      const startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      const start = Math.floor(startDate.getTime() / 1000) + 1;
      const end = Math.ceil(endDate.getTime() / 1000);

      const repeatCount = db.prepare(`SELECT COUNT(*) AS count FROM xaction t, account a, code c WHERE
          t.repeat <> 0 AND t.date <= ${end} AND c.type <> 'O' AND a.domain = '${params.domain}' AND (
          (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
          (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);
      const repeats = db.prepare(`SELECT t.* FROM xaction t, account a, code c WHERE
          t.repeat <> 0 AND t.date <= end AND c.type <> 'O' AND a.domain = '${params.domain}' AND (
          (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
          (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);
      let codes;
      let profit = 0;
      insertRepeats(repeatCount, repeats, insertRepeat, updateRepeat);
      for (const code of db.iterate`WITH p(startdate, endDate) AS (Select ${start} AS StartDate, ${end} AS Enddate)
        SELECT c.id AS id, c.type AS type, c.description AS description, CAST(sum(CASE WHEN c.type='A' THEN 
          (CAST(t.dfamount AS REAL) / c.depreciateyear) * CASE WHEN t.date BETWEEN  p.startdate AND p.enddate THEN 
            CAST((p.enddate - t.date)AS REAL)/(p.enddate - p.startdate) WHEN t.date + (c.depreciateyear * (p.enddate - p.startdate)) 
            BETWEEN p.startdate AND p.enddate THEN CAST((t.date + (c.depreciateyear * (p.enddate - p.startdate)) - p.startdate) AS REAL)/ (p.enddate - p.startdate)
            ELSE 1 END WHEN c.type = 'B' AND c.id = t.srccode THEN -t.dfamount ELSE t.dfamount END) AS INTEGER) AS tamount           
        FROM dfxaction AS t, account AS a, code AS c, p WHERE
          t.date + (CASE WHEN c.type = 'A' THEN (c.depreciateyear * (p.enddate - p.startdate)) ELSE 0 END) >= p.startdate AND t.date <= p.enddate 
          AND c.type <> 'O' AND a.domain = ${params.domain} AND ((t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
          (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id)) GROUP BY c.id, c.type, c.description,c.depreciateyear, 
          p.startdate, p.enddate ORDER BY CASE c.type WHEN 'A' THEN 1 WHEN 'C' THEN 2 WHEN 'R' THEN 0 ELSE 3 END, description COLLATE NOCASE ASC`) {
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
        if (code.type === 'A') {
          responder.defineFields('id:date:rno:description:amount:depreciation:cumulative:x:x:x:account');
        } else {
          responder.defineFields('id:date:rno:description:amount:x:cumulative:x:x:x:account');
        }
        code.profit = (profit/100).toFixed(2);
        code.tamount = (code.tamount/100).toFixed(2);
        let cumulative = 0;
        for(const xaction of db.iterate`WITH p(startdate, endDate) AS (Select ${start} AS StartDate, ${end} AS Endate)
          SELECT t.id,t.date,t.rno,t.version, t.src, t.srccode, t.dst, t.dstcode,t.description, t.rno, t.repeat, 
          t.dfamount * CASE WHEN c.type = 'B' AND c.id = t.srccode THEN -1 ELSE 1 END as amount, 0 as srcclear, 0 AS dstclear, 0 AS reconciled, 
          1 as trate, cu.name AS currency, 0 AS version, CASE WHEN c.type = 'A' THEN CAST((CAST(t.dfamount AS REAL) / c.depreciateyear) *
          CASE WHEN t.date BETWEEN  p.startdate AND p.enddate THEN CAST((p.enddate - t.date)AS REAL)/(p.enddate - p.startdate)
            WHEN t.date + (c.depreciateyear * (p.enddate - p.startdate)) BETWEEN p.startdate AND p.enddate 
            THEN CAST((t.date + (c.depreciateyear * (p.enddate - p.startdate)) - p.startdate) AS REAL)/ (p.enddate - p.startdate) ELSE 1 END AS INTEGER) 
            ELSE 0 END As depreciation, a.name AS account FROM dfxaction t, currency cu, p, code c JOIN account a ON (a.name = t.src AND t.srccode = c.id) 
            OR (a.name = t.dst AND t.dstcode = c.id) WHERE cu.priority = 0 AND t.date BETWEEN p.startdate - CASE WHEN c.type = 'A' THEN 
            (c.depreciateyear * (p.enddate - p.startdate)) ELSE 0 END AND p.enddate AND a.domain = ${params.domain} AND c.id =  ${code.id} ORDER BY t.dat`) {
          cumulative += code.type === 'A'? xaction.depreciation: xaction.amount;
          xaction.cumulative = (cumulative/100).toFixed(2); 
          xaction.amount = (xaction.amount/100).toFixed(2);
          if (code.type === 'A') xaction.depreciation = (xaction.depreciation/100).toFixed(2);
          xaction.date = dbDateToString(xaction.date);
          await responder.write(xaction);
        }
        responder.defineFields('x:x:x:description:x:x:x:tamount:profit:type:x');
        await responder.write(code);
      }
      responder.defineFields('x:x:x:description:x:x:x:x:profit:x');
      responder.write({});
      responder.write({ description: 'Overall Profit', profit: (profit/100).toFixed(2) });
      throw new Error('Rollback'); //force a rollback
    });
  } catch (e) {
    //expected - rollback
    if (e.message !== 'Rollback') {
      debug('Rollback error', e);
      throw e;
    }
  }
}
