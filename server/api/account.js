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

(function () {
  'use strict';

  const debug = require('debug')('money:account');
  const db = require('@akc42/server-utils/database');

  module.exports = async function (user, params, responder) {
    debug('new request from', user.name);
    const getAccount = db.prepare(`SELECT a.name AS name, bversion, dversion,balance,date, a.domain AS domain, 
      a.currency, a.startdate,c.description AS cdesc, c.rate 
      FROM account AS a JOIN currency AS c ON a.currency = c.name,
      user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
      WHERE a.name = ? AND u.uid = ? AND (u.isAdmin = 1 OR c.domain = a.domain)`);
    const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
    const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
      repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
    const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
    const xactionsByDate =  db.prepare(`SELECT t.*, tc.rate AS trate, c.type As ctype, c.description AS cd,
      CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled
      FROM account a JOIN xaction t ON (t.src = a.name OR t.dst = a.name) 
      LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
      LEFT JOIN code c ON c.id = CASE WHEN t.src = a.name THEN 
        CASE WHEN t.srccode IS NOT NULL THEN t.srccode WHEN a.domain = aa.domain THEN t.dstcode END 
        ELSE CASE WHEN t.dstcode IS NOT NULL THEN t.dstcode WHEN a.domain = aa.domain THEN t.dstcode END END
      LEFT JOIN currency tc ON tc.name = t.currency 
      WHERE a.name = ? AND t.date >= ? ORDER BY t.date`)
    const xactionsUnReconciled = db.prepare(`SELECT t.*, tc.rate AS trate, c.type As ctype, c.description AS cd
      FROM account a JOIN xaction t ON (t.src = a.name OR t.dst = a.name) 
      LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
      LEFT JOIN code c ON c.id = CASE WHEN t.src = a.name THEN 
        CASE WHEN t.srccode IS NOT NULL THEN t.srccode WHEN a.domain = aa.domain THEN t.dstcode END 
        ELSE CASE WHEN t.dstcode IS NOT NULL THEN t.dstcode WHEN a.domain = aa.domain THEN t.dstcode END END
      LEFT JOIN currency tc ON tc.name = t.currency  
      WHERE a.name = ? AND CASE WHEN t.src = a.name THEN t.srcclear ELSE t.dstclear END = 0 ORDER BY t.date`)


    db.transaction(() => {
      const repeatTime = Math.round(new Date().getTime() / 1000) + s.get('repeat_days') * 86400;
      debug('In transaction with repeat time of', repeatTime);
      const repeatCount = db.prepare('SELECT COUNT(*) FROM xaction WHERE(src = ? OR dst = ? ) AND repeat <> 0 AND date < ?')
        .pluck().bind(params.account, params.account, repeatTime);
      const repeats = db.prepare('SELECT * FROM xaction WHERE(src = ? OR dst = ? ) AND repeat <> 0 AND date < ?').bind(params.account, params.account, repeatTime);
      while (repeatCount.get() > 0) {
        debug('Found some repeats');
        const newTransactions = [];
        for (const xaction of repeats.iterate()) {
          let nextDate;
          const xactionDate = new Date();
          xactionDate.setTime(xaction.date * 1000);
          debug('working on transaction id', xaction.id, 'with date', xactionDate.toLocaleString());
          switch (xaction.repeat) {
            case 1:
              debug('weekly repeat')
              nextDate = xaction.date + 604800;  //add on a week
              break;
            case 2:
              debug('fortnight repeat');
              nextDate = xaction.date + 1209600; //add on a fortnight
              break;
            case 3:

              const nextMonth = new Date(xactionDate);
              nextMonth.setMonth(xactionDate.getMonth() + 1);
              debug('monthly repeat', nextMonth.toUTC());
              //In an additional Month (relative to start of month)
              nextDate = Math.round(nextMonth.getTime() / 1000);
              break;
            case 4:

              //in an additional Month (relative to end of month);
              const startOfNextMonth = new Date(xactionDate);
              startOfNextMonth.setMonth(xactionDate.getMonth() + 1)
              startOfNextMonth.setDate(1);
              const distanceToEnd = Math.round(startOfNextMonth.getTime() / 1000) - xaction.date;
              const secondMonth = new Date(xactionDate);
              secondMonth.setMonth(xactionDate.getMonth() + 2);
              debug('End of month repeat', startOfNextMonth.toLocaleString(), ' SecondMonth', secondMonth.toLocaleString(), 'distance', distanceToEnd);
              nextDate = Math.round(secondMonth.getTime() / 1000) - distanceToEnd;
              break;
            case 5:
              //in a quarter
              const nextQuarter = new Date(xactionDate);
              nextQuarter.setMonth(xactionDate.getMonth() + 3);
              debug('Quarter Repeat', nextQuarter.toLocaleString());
              nextDate = Math.round(nextQuarter.getTime() / 1000);
            case 6:
              //in a year
              const nextYear = new Date(xactionDate);
              nextYear.setFullYear(xactionDate.getFullYear() + 1);
              debug('Yearly Repeat', nextYear.toLocaleString());
              nextDate = Math.round(nextYear.getTime() / 1000);
              break;
            case 7:
              debug('fortnight repeat');
              nextDate = xaction.date + 2419200; //add on 4 weeks
              break;

            default:
              throw new Error('Invalid repeat period on database')
          }
          //save the need to update 
          newTransactions.push({...xaction, date: nextDate});
          //make a new transaction at the repeat distance

        }
        debug('insert', newTransactions.length, 'new Transactions');
        for (const xaction of newTransactions) {
          insertRepeat.run(
            xaction.date,
            xaction.src,
            xaction.dst,
            xaction.srcamount,
            xaction.dstamount,
            xaction.srccode,
            xaction.dstcode,
            xaction.rno,
            xaction.repeat,
            xaction.currency,
            xaction.amount,
            xaction.description);
          debug('Update Current Transaction to Remove Repeat')
          updateRepeat.run(xaction.id); //remove repeat from current transaction

        }
        //repeat until there are no more repeats within range (the recent insertions may have created some more)
      }
      debug('done all repeats');
      const account = getAccount.get(params.account, user.uid);
      if (account !== null && account.name.length > 0) {
        responder.addSection('account', account);
        if (account.startdate === null) {
          debug('add unreconciled transactions');
          responder.addSection('starttype', 'U');
          responder.addSection('startdate', account.date); //use account reconciliation date 
          responder.addSection('transactions', xactionsUnReconciled.all(params.account));
        } else {
          let start;
          const startDate = new Date();
          startDate.setHours(0,0,0,0);
          if (account.startdate === 0) {
            responder.addSection('starttype', 'F');
            const yearEnd = s.get('year_end');
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
            start = Math.floor(startDate.getTime()/1000)
          } else {
            responder.addSection('starttype', 'D');
            startDate.setTime(account.start * 1000);
            start = account.start;
          }
          responder.addSection('startdate', start);  
          debug('add transactions from startdate', startDate.toLocaleString());
          responder.addSection('transactions', xactionsByDate.all(params.account, start));
        }

      } else {
        responder.addSection('Account',{name: ''});
      }
    })();
    debug('request complete');
  };
})();