/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

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
import { insertRepeats } from '../utils.js';
import mdb from '@akc42/sqlite-db';

export default async function (user, params, responder) {

  await mdb.transactionAsync(async db => {
    const {repeatDays} = db.get`SELECT value AS repeatDays FROM Settings WHERE name = ${'repeat_days'}`??{repeatDays:0}
    const repeatTime = Math.round(new Date().getTime() / 1000) + repeatDays * 86400;
    const repeatCount = db.prepare(`SELECT COUNT(*) AS count FROM xaction WHERE (src = '${params.account}' OR dst = '${params.account}' ) 
      AND repeat <> 0 AND date < ${repeatTime}`);
    const repeats = db.prepare(`SELECT * FROM xaction WHERE(src = '${params.account}' OR dst = '${params.account}' ) AND repeat <> 0 AND date < ${repeatTime}`)
    const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno , repeat, currency, amount, description)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
    insertRepeats(repeatCount,repeats,insertRepeat,updateRepeat);
    let account = db.get`SELECT a.name AS name, bversion, dversion,balance,date, a.domain AS domain, 
    a.currency, a.startdate,c.description AS cdesc, c.rate 
    FROM account AS a JOIN currency AS c ON a.currency = c.name,
    user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
    WHERE a.name = ${params.account} AND u.uid = ${user.uid} AND (u.isAdmin = 1 OR c.domain = a.domain)`
    if (account !== undefined && account.name.length > 0) {
      const {assets} = db.get`SELECT COUNT(*) as assets FROM xaction t JOIN Code c ON t.dstcode = c.id AND t.dst = ${account.name} 
        WHERE c.type = 'A'`??{assets:0}
      responder.addSection('assets', assets);
      if (params.tid !== 0) {
        const taction = db.get`SELECT t.date, CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END 
          AS reconciled FROM xaction t JOIN account a ON (t.src = a.name OR t.dst = a.name) WHERE id = ${params.tid} AND a.name = ${params.account}`;
        if (account.startdate === null && taction.reconciled === 1) account.startdate = Math.floor(taction.date/86400) * 86400; //set start date to start of day
      }
      if (account.startdate === null) {
        responder.addSection('starttype', 'U');
        responder.addSection('startdate', account.date); //use account reconciliation date 
        responder.addSection('transactions');
        for(const xaction of db.iterate`SELECT t.*, tc.rate AS trate, 
          CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
          CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
          FROM account a JOIN xaction t ON (t.src = a.name OR t.dst = a.name) 
          LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
          LEFT JOIN currency tc ON tc.name = t.currency  
          WHERE a.name = ${params.account} AND CASE WHEN t.src = a.name THEN t.srcclear ELSE t.dstclear END = 0 ORDER BY t.date`) {
            await responder.write(xaction);
        }

      } else {
        let start;
        const startDate = new Date();
        startDate.setHours(3,0,0,0);
        if (account.startdate === 0) {
          responder.addSection('starttype', 'F');
          const {yearEnd} = db.get`SELECT value AS yearEnd FROM Settings WHERE name = ${'year_end'}`??{yearEnd:1231};
          if (yearEnd > 0) {
            const monthEnd = Math.floor(yearEnd / 100) - 1; //Range 0 to 11 for Dates
            const dayEnd = yearEnd % 100;
            if (startDate.getMonth() > monthEnd) {
              startDate.setMonth(monthEnd);
            } else if (startDate.getMonth() < monthEnd) {
              startDate.setFullYear(startDate.getFullYear() - 1);
              startDate.setMonth(monthEnd);
            } else if (startDate.getDate() <= dayEnd) {
              startDate.setFullYear(startDate.getFullYear() - 1);
              startDate.setMonth(monthEnd);
            }
            startDate.setDate(dayEnd + 1); //transactions
            if (params.tid !== 0) {
              start = Math.min(Math.floor(startDate.getTime() / 1000), Math.floor(xaction.date / 86400) * 86400);
            } else {
              start = Math.floor(startDate.getTime() / 1000)
            }
          } else {
            start = 0;
          }
        } else {
          responder.addSection('starttype', 'D');
          startDate.setTime(account.startdate * 1000);
          if (params.tid !== 0) {
            start= Math.min(account.startdate, Math.floor(xaction.date / 86400) * 86400)
          } else {
            start = account.startdate;
          }
        }
        responder.addSection('startdate', start);
        if (start > 0) {
          responder.addSection('transactions');
          for(const xaction of db.iterate`SELECT t.*, tc.rate AS trate, 
            CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
            CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
            FROM account a JOIN xaction t ON (t.src = a.name OR t.dst = a.name) 
            LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
            LEFT JOIN currency tc ON tc.name = t.currency 
            WHERE a.name = ${params.account} AND t.date >= ${start} ORDER BY t.date`) {
            await responder.write(xaction);
          }
        } else { 
          responder.addSection('transactions', []); 
        }
      }
      responder.addSection('account', account);
    } else {
      responder.addSection('Account',{name: ''});
    }
  });

};
