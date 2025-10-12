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
import {Debug} from '@akc42/server-utils';
import { insertRepeats } from '../utils.js';
import DB from '@akc42/sqlite-db';
const db = DB();
const debug = Debug('account');

export default async function (user, params, responder) {
  debug('new request from', user.name, 'account ',params.account,'tid', params.tid);
  const getAccount = db.prepare(`SELECT a.name AS name, bversion, dversion,balance,date, a.domain AS domain, 
    a.currency, a.startdate,c.description AS cdesc, c.rate 
    FROM account AS a JOIN currency AS c ON a.currency = c.name,
    user AS u LEFT JOIN capability AS c ON c.uid = u.uid 
    WHERE a.name = ? AND u.uid = ? AND (u.isAdmin = 1 OR c.domain = a.domain)`);
  const checkRegister = db.prepare(`SELECT COUNT(*) as assets FROM xaction t JOIN Code c ON t.dstcode = c.id AND t.dst = ? WHERE c.type = 'A'`)
  const getXaction = db.prepare(`SELECT t.date, 
    CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled
    FROM xaction t JOIN account a ON (t.src = a.name OR t.dst = a.name) WHERE id = ? AND a.name = ?`);
  const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
  const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
    repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
  const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
  const xactionsByDate =  db.prepare(`SELECT t.*, tc.rate AS trate, 
    CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
    CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
    FROM account a JOIN xaction t ON (t.src = a.name OR t.dst = a.name) 
    LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
    LEFT JOIN currency tc ON tc.name = t.currency 
    WHERE a.name = ? AND t.date >= ? ORDER BY t.date`)
  const xactionsUnReconciled = db.prepare(`SELECT t.*, tc.rate AS trate, 
    CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
    CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
    FROM account a JOIN xaction t ON (t.src = a.name OR t.dst = a.name) 
    LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
    LEFT JOIN currency tc ON tc.name = t.currency  
    WHERE a.name = ? AND CASE WHEN t.src = a.name THEN t.srcclear ELSE t.dstclear END = 0 ORDER BY t.date`)

  db.transaction(() => {
    const repeatTime = Math.round(new Date().getTime() / 1000) + s.get('repeat_days') * 86400;
    debug('In transaction with repeat time of', repeatTime);
    const repeatCount = db.prepare('SELECT COUNT(*) FROM xaction WHERE(src = ? OR dst = ? ) AND repeat <> 0 AND date < ?')
      .pluck().bind(params.account, params.account, repeatTime);
    const repeats = db.prepare('SELECT * FROM xaction WHERE(src = ? OR dst = ? ) AND repeat <> 0 AND date < ?').bind(params.account, params.account, repeatTime);
    insertRepeats(repeatCount,repeats,insertRepeat,updateRepeat);
    debug('done all repeats');
    let account = getAccount.get(params.account, user.uid);
    if (account !== null && account.name.length > 0) {
      const assetCount = checkRegister.get(account.name);
      debug('assetCount', assetCount);
      responder.addSection('assets', assetCount.assets);
      let xaction;
      if (params.tid !== 0) xaction = getXaction.get(params.tid, params.account);
      if (account.startdate === null && params.tid !== 0 && xaction.reconciled === 1) {
        debug('looking for an reconciled transaction , so we set the start date to', new Date(xaction.date * 1000).toLocaleDateString());
        account.startdate = Math.floor(xaction.date/86400) * 86400; //set start date to start of day
      }
      if (account.startdate === null) {
        debug('add unreconciled transactions');
        responder.addSection('starttype', 'U');
        responder.addSection('startdate', account.date); //use account reconciliation date 
        responder.addSection('transactions', xactionsUnReconciled.all(params.account));
      } else {
        let start;
        const startDate = new Date();
        startDate.setHours(3,0,0,0);
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
          if (params.tid !== 0) {
            start = Math.min(Math.floor(startDate.getTime() / 1000), Math.floor(xaction.date / 86400) * 86400);
          } else {
            start = Math.floor(startDate.getTime() / 1000)
          }
        } else {
          responder.addSection('starttype', 'D');
          startDate.setTime(account.startdate * 1000);
          if (params.tid !== 0) {
            debug('make sure we have a date that includes the transaction')
            start= Math.min(account.startdate, Math.floor(xaction.date / 86400) * 86400)
          } else {
            start = account.startdate;
          }
        }
        responder.addSection('startdate', start);  
        debug('add transactions from startdate', startDate.toLocaleString());
        responder.addSection('transactions', xactionsByDate.all(params.account, start));
      }
      responder.addSection('account', account);
    } else {
      responder.addSection('Account',{name: ''});
    }
  })();

  debug('request complete');
};
