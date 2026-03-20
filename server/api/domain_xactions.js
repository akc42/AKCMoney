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
import {insertRepeats} from '../utils.js';
import mdb from '@akc42/sqlite-db';

export default async function(user, params, responder) {
  try {
    await mdb.transactionAsync(async db => {
      const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
        repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
      const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
      const repeatCount = db.prepare(`SELECT COUNT(*) AS count FROM xaction t, account a, code c WHERE
        t.repeat <> 0 AND t.date <= ${params.end} AND c.id = '${params.code}' AND a.domain = '${params.domain}' AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);
    const repeats = db.prepare(`SELECT t.* FROM xaction t, account a, code c WHERE t.repeat <> 0 AND t.date <= ${params.end} AND
      c.id = ${params.code} AND a.domain = '${params.domain}' AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);
      insertRepeats(repeatCount,repeats,insertRepeat, updateRepeat);
      responder.addSection('transactions')
      for (const xaction of db.iterate`WITH p(startdate, endDate) AS (Select ${params.start} AS StartDate, ${params.end} AS Endate)
        SELECT t.id,t.date,t.version, t.src, t.srccode, t.dst, t.dstcode,t.description, t.rno, t.repeat, 
        t.dfamount * CASE WHEN c.type = 'B' AND c.id = t.srccode THEN -1 ELSE 1 END as amount, 0 as srcclear, 0 AS dstclear, 0 AS reconciled, 1 as trate, 
        cu.name AS currency, 0 AS version, CASE WHEN c.type = 'A' THEN CAST((CAST(t.dfamount AS REAL) / c.depreciateyear) *
        CASE WHEN t.date BETWEEN  p.startdate AND p.enddate THEN CAST((p.enddate - t.date)AS REAL)/(p.enddate - p.startdate)
        WHEN t.date + (c.depreciateyear * (p.enddate - p.startdate)) BETWEEN p.startdate AND p.enddate THEN 
        CAST((t.date + (c.depreciateyear * (p.enddate - p.startdate)) - p.startdate) AS REAL)/ (p.enddate - p.startdate) ELSE 1 END AS INTEGER) 
        ELSE 0 END As depreciation FROM dfxaction t, currency cu, p, code c JOIN account a ON (a.name = t.src AND t.srccode = c.id) OR (
        a.name = t.dst AND t.dstcode = c.id) WHERE cu.priority = 0 AND t.date BETWEEN p.startdate - CASE WHEN c.type = 'A' THEN 
        (c.depreciateyear * (p.enddate - p.startdate)) ELSE 0 END AND p.enddate AND a.domain = ${params.domain} AND c.id =  ${params.code} ORDER BY t.date`) {
        await responder.write(xaction);
      }
      throw new Error('Rollback');
    });
  } catch (e) {
    //expected - rollback
    if (e.message !== 'Rollback') throw e;
  
  }
};
