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


export default async function(user, params, responder) {
  responder.setName(`Account-${params.account}`);
  responder.defineFields('tid:tdate:rno:description:amount:reconciled:otheraccount:currency:camount:ctype:cd');
  responder.makeHeader('tid:Date:Ref:Description:Amount:Reconciled:Other Account:Currency:Currency Amount:Code Type:Code Description');
  
  await mdb.transactionAsync(async db => {
    const {value:yearEnd} = db.get`SELECT value FROM settings WHERE name = ${'year_end'}`??{value:1231};
    const monthEnd = Math.floor(yearEnd / 100) - 1 //Range 0 to 11 for Dates 
    const dayEnd = yearEnd % 100;
    const endDate = new Date();
    const today = endDate.getTime();
    endDate.setHours(23,59,59); //last possible time
    endDate.setMonth(monthEnd);
    endDate.setDate(dayEnd);
    endDate.setMonth(monthEnd + 1);
    while (endDate.getTime() > today) {
      //ahead of the time, so go back a year
      endDate.setFullYear(endDate.getFullYear() - 1);
    }
    const endTime = Math.ceil(endDate.getTime() / 1000);
    const startDate = new Date(endDate);
    startDate.setTime(startDate.getTime() + 120000); //should push us into next day
    startDate.setMonth(startDate.getMonth() - 14); 
    const startTime = Math.floor(startDate.getTime()/1000);
    for (const xaction of db.iterate`SELECT t.*, c.type AS ctype, c.description AS cd FROM (
        SELECT d.id AS tid, d.date AS seconds, date(d.date,'unixepoch') AS tdate, d.rno, d.description,
          CAST(-dfamount AS REAL)/100.0 AS amount, x.srcclear AS reconciled,  
          CASE WHEN sa.domain = da.domain THEN ifnull(d.srccode,d.dstcode) ELSE d.srccode END AS cid,
          d.dst AS otheraccount, x.currency, CAST (-x.amount AS REAL)/100.0  AS camount
        FROM dfxaction d JOIN xaction x ON d.id = x.id JOIN account sa ON d.src = sa.name LEFT JOIN account da ON d.dst = da.name
        WHERE d.src = ${params.account}
        UNION
        SELECT d.id AS tid, d.date AS seconds, date(d.date,'unixepoch') AS tdate, d.rno, d.description, 
          CAST(dfamount AS REAL)/100.0 AS amount, x.dstclear AS reconciled, 
          CASE WHEN da.domain = sa.domain THEN ifnull(d.dstcode,d.srccode) ELSE d.dstcode END AS cid,
          d.src AS otheraccount, x.currency, CAST(x.amount AS REAL)/100.0  AS camount
        FROM dfxaction d JOIN xaction x ON d.id = x.id JOIN account da ON d.dst = da.name LEFT JOIN account sa ON d.src = sa.name
        WHERE d.dst = ${params.account}
      ) t LEFT JOIN code c ON c.id = t.cid WHERE seconds BETWEEN ${startTime} AND ${endTime} ORDER BY seconds`) {
      await responder.write(xaction);
    }   
  });
};
