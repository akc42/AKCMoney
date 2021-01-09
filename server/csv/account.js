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

const { end } = require('pdfkit');

(function() {
  'use strict';

  const debug = require('debug')('money:csvaccount');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name, 'with params', params );
    responder.setName(`Account-${params.account}`);
    responder.defineFields('tid:tdate:rno:description:amount:reconciled:otheraccount:currency:camount:ctype:cd');
    responder.makeHeader('tid:Date:Ref:Description:Amount:Reconciled:Other Account:Currency:Currency Amount:Code Type:Code Description');
    const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();    
    const transactions = db.prepare(`SELECT
        t.*,
        c.type AS ctype,
        c.description AS cd
    FROM (
        SELECT
            d.id AS tid,
            d.date AS seconds,
            date(d.date,'unixepoch') AS tdate,
            d.rno,
            d.description,
            CAST(-dfamount AS REAL)/100.0 AS amount,
            x.srcclear AS reconciled,  
            CASE WHEN sa.domain = da.domain THEN ifnull(d.srccode,d.dstcode) ELSE d.srccode END AS cid,
            d.dst AS otheraccount,
            x.currency,
            CAST (-x.amount AS REAL)/100.0  AS camount
        FROM 
            dfxaction d 
            JOIN xaction x ON d.id = x.id
            JOIN account sa ON d.src = sa.name
            LEFT JOIN account da ON d.dst = da.name
        WHERE d.src = ?
        UNION
        SELECT
            d.id AS tid,
            d.date AS seconds,
            date(d.date,'unixepoch') AS tdate,
            d.rno,
            d.description,
            CAST(dfamount AS REAL)/100.0 AS amount,
            x.dstclear AS reconciled,  
            CASE WHEN da.domain = sa.domain THEN ifnull(d.dstcode,d.srccode) ELSE d.dstcode END AS cid,
            d.src AS otheraccount,
            x.currency,
            CAST(x.amount AS REAL)/100.0  AS camount
        FROM 
            dfxaction d 
            JOIN xaction x ON d.id = x.id
            JOIN account da ON d.dst = da.name
            LEFT JOIN account sa ON d.src = sa.name
        WHERE d.dst = ?
    ) t 
    LEFT JOIN code c ON c.id = t.cid
    WHERE seconds BETWEEN ? AND ?
    ORDER BY seconds`);
    let xactions;
    db.transaction(() => {
      const yearEnd = s.get('year_end');
      const monthEnd = Math.floor(yearEnd / 100) - 1 //Range 0 to 11 for Dates 
      const dayEnd = yearEnd % 100;
      const endDate = new Date();
      const today = endDate.getTime();
      endDate.setHours(23,59,59); //last possible time
      debug('enddate setting time', endDate);
      endDate.setMonth(monthEnd);
      debug('enddate, setting month', endDate)
      endDate.setDate(dayEnd);
      debug('enddate, setting endDate', endDate)
      endDate.setMonth(monthEnd + 1);
      debug('endDate after Month Adjust', endDate);
      while (endDate.getTime() > today) {
        //ahead of the time, so go back a year
        debug('adjusting end date by a year');
        endDate.setFullYear(endDate.getFullYear() - 1);
      }
      debug('endDate Final Value ', endDate);
      const endTime = Math.ceil(endDate.getTime() / 1000);
      const startDate = new Date(endDate);
      debug('initial start date', startDate);
      startDate.setTime(startDate.getTime() + 120000); //should push us into next day
      debug('start date one day later', startDate)
      startDate.setMonth(startDate.getMonth() - 14); 
      debug('startDate 14 months earlier', startDate);
      const startTime = Math.floor(startDate.getTime()/1000);
     

      xactions = transactions.all(params.account,params.account, startTime, endTime)

      
    })();
    for (const transaction of xactions) {
      await responder.write(transaction);
    }
    debug('request complete')
  };
})();