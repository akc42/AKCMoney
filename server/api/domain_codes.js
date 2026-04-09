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
import mdb from '@akc42/sqlite-db';
import { insertRepeats } from '../utils.js';

  
export default async function(user, params, responder) {
  try {
    await mdb.transactionAsync(async db => {
      const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
        repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
      const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');


      const {value:yearEnd} = db.get`SELECT value  FROM settings WHERE name = ${'year_end'}`??{value:1231};
      const monthEnd = Math.floor(yearEnd / 100) - 1 //Range 0 to 11 for Dates 
      const dayEnd = yearEnd % 100;
      const endDate = new Date();
      endDate.setHours(23, 59, 59); //last possible time
      endDate.setMonth(monthEnd);
      endDate.setDate(dayEnd);
      endDate.setFullYear(params.year);
      const startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      const start = Math.floor(startDate.getTime()/1000) + 1; //This gets the very beginning of the financial year
      const end = Math.floor(endDate.getTime()/1000); //This gets the very last second of the financial year
      const repeatCount = db.prepare(`SELECT COUNT(*) AS count FROM xaction t, account a, code c   
        WHERE t.repeat <> 0 AND t.date <= ${end} AND c.type <> 'O' AND a.domain = '${params.domain}' AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);
      const repeats = db.prepare(`SELECT t.* FROM xaction t, account a, code c WHERE t.repeat <> 0 AND
        t.date <= ${end} AND c.type <> 'O' AND a.domain = '${params.domain}' AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);

      insertRepeats(repeatCount,repeats,insertRepeat, updateRepeat);
      responder.addSection('codes');
      for (const code of db.iterate`WITH p(startdate, endDate) AS (Select ${start} AS StartDate, ${end} AS Enddate)
        SELECT c.id AS id, c.type AS type, c.description AS description,
        CAST(sum(CASE WHEN a.register = 1 AND t.src <> a.name THEN 0 ELSE t.dfamount END) AS INTEGER) AS tamount
        FROM dfxaction AS t, (SELECT account.*, CASE WHEN ta.id IS NOT NULL THEN 1 ELSE 0 END as Register, ta.dstcode AS code 
        FROM account LEFT JOIN xaction ta ON ta.id = (
          SELECT x.id FROM xaction x JOIN code c ON x.dstcode = c.id WHERE x.dst = account.name AND c.type = 'A' LIMIT 1)) AS a, code AS c, p
          WHERE t.date   >= p.startdate AND t.date <= p.enddate AND c.type <> 'O' AND
          a.domain = ${params.domain} AND  ((t.src IS NOT NULL AND t.src = a.name AND t.srccode IS NOT NULL AND t.srccode = c.id) OR
          (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id AND a.register = 0) OR
          (t.src IS NOT NULL AND t.src = a.name AND a.register = 1 and a.code = c.id))
        GROUP BY c.id, c.type, c.description, p.startdate, p.enddate
        ORDER BY CASE c.type WHEN 'A' THEN 1 WHEN 'C' THEN 2 WHEN 'R' THEN 0 ELSE 3 END, description COLLATE NOCASE ASC`) {
        await responder.write(code);
      }
      responder.addSection('start', start);
      responder.addSection('end', end);
      throw new Error('Rollback'); //force a rollback
    });
  } catch (e) {
    //expected - rollback
    if (e.message !== 'Rollback')  throw e;
  
  }
};
