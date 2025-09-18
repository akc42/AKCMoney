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
import {nullIfZeroLength, booleanToDbValue, nullOrAmount, nullOrNumber} from '../utils.js';
import DB from '@akc42/sqlite-db';
const db = DB();
const debug = Debug('xactionupdate');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'for transaction', params.tid );
  const getAccount = db.prepare('SELECT currency, balance, bversion FROM account WHERE name = ?');
  const newXaction = db.prepare(`INSERT INTO xaction (version, date, amount, currency, src, srcamount, srcclear, srccode, 
    dst, dstamount, dstclear, dstcode, rno, repeat, description) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const getXaction = db.prepare(`SELECT version, amount, currency, src, srcclear, srcamount, dst, dstclear, dstamount 
    FROM xaction  WHERE id = ?`);
  const swapSrcDst = db.prepare(`UPDATE xaction SET src = dst, dst = src, srcclear = dstclear, dstclear = srcclear,
      srccode = dstcode, dstcode = srccode, srcamount = dstamount, dstamount = srcamount   WHERE id = ?`);
  const updateXactionSrc = db.prepare(`UPDATE xaction SET version = version + 1, amount = ?, srcamount = ?, srcclear = ?, srccode = ?,
    currency = ?, date = ?, description = ? , rno = ?, repeat = ?, dst = ?  WHERE id = ?`);
  const updateXactionDst = db.prepare(`UPDATE xaction SET version = version + 1, amount = ?, dstamount = ?, dstclear = ?, dstcode = ?,
    currency = ?, date = ?, description = ? , rno = ?, repeat = ?, src = ?  WHERE id = ?`);
  const changeXactionSrc = db.prepare('UPDATE xaction SET src = ? WHERE id = ?');
  const changeXactionDst = db.prepare('UPDATE xaction SET dst = ? WHERE id = ?');
  const getUpdatedXaction = db.prepare(`SELECT t.*, tc.rate AS trate, 
  CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
  CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
  FROM account a JOIN xaction t ON(t.src = a.name OR t.dst = a.name)
  LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
  LEFT JOIN currency tc ON tc.name = t.currency
  WHERE t.id = ? AND a.name = ?`)
  const updateAccountBalance = db.prepare(`UPDATE account SET bversion = bversion + 1, balance = ?, 
    date = (strftime('%s','now')) WHERE name = ?`);
  db.transaction(() => {
    const tid = parseInt(params.tid, 10);
    if (tid === 0) {
      const {currency, balance, bversion} = getAccount.get(params.account);
      const {lastInsertRowid } = newXaction.run(
        parseInt(params.date,10),
        nullOrAmount(params.amount),
        params.currency,
        nullIfZeroLength(params.src),
        params.account === params.src && currency !== params.currency ? nullOrAmount(params.accountamount) : null,
        params.account === params.src ? booleanToDbValue(params.cleared) : 0,
        params.account === params.src ? nullOrNumber(params.code) : null,
        nullIfZeroLength(params.dst),
        params.account === params.dst && currency !== params.currency ? nullOrAmount(params.accountamount) : null,
        params.account === params.dst ? booleanToDbValue(params.cleared) : 0,
        params.account === params.dst ? nullOrNumber(params.code) : null,
        nullIfZeroLength(params.rno),
        nullOrNumber(params.repeat),
        params.description
        );
      debug('made new transaction with id = ', lastInsertRowid);
      if (params.cleared !== undefined && ((currency === params.currency && nullOrAmount(params.amount) !== null) ||
        (currency !== params.currency && nullOrAmount(params.accountamount !== null))) ) {
        const balanceChange = nullOrAmount((params.account === params.src ? '-': '') + 
          currency !== params.currency ? params.accountamount : params.amount)
        updateAccountBalance.run(balance + balanceChange, params.account);
        debug('updated account',params.account,'with new balance change of', balanceChange);
        responder.addSection('bversion', bversion+1);
        responder.addSection('balance', balance+balanceChange);
      }
      responder.addSection('status', 'OK');
      responder.addSection('transaction', getUpdatedXaction.get(lastInsertRowid, params.account));
    } else {
      const { version, amount, currency, src, srcclear, srcamount, dst, dstclear, dstamount} = getXaction.get(tid);
      if (version === parseInt(params.version,10)) {
        // This is a valid update to the transaction, so lets see if we have to worry about adjustments to any account balance 
        if (!(params.cleared === undefined && srcclear === 0 && dstclear=== 0)) {
          debug('transaction update is changing accounts balances');
          /*
            There are potentially three account balances that may be effected.  They are:-
              - the account we are working with (defined by params.account)
              - the second account of the transaction (if its a dual account transaction) before we edited it
              - the second account of the transaction (if its a dual account transaction) after we edited and it different to the before
            On top of that the accounts may be in different currencies
            
            Our approach in each case is the same - find the contribution to the balance by this transaction is its "before" state in the accounts currency (srcamount or dstamount if currency not the same as the transaction currency or just amount if it is)
            Find the contribution in the "after" state; subtract the two and then update the account appropriately.
          */
          //start with params.account first which we have already read.
          const { currency:acurrency, balance, bversion } = getAccount.get(params.account);
          let contribution = acurrency === currency ? (params.account === src ? amount : -amount) : (params.account === src ? srcamount : -dstamount);
          //now add in contribution by the after state - only true if we are not moving or other account was previously not null
          if (params.type === 'save' || (params.account === src && dst !== null) || (params.account === dst && src !== null) ) {
            contribution += acurrency === params.currency ? 
              (params.account === params.src ? -1 * nullOrAmount(params.amount) : nullOrAmount(params.amount)):
              (params.account === params.src ? -1 * nullOrAmount(params.accountamount) : nullOrAmount(params.accountamount));
          }
          updateAccountBalance.run(balance + contribution,params.account);
          responder.addSection('balance', balance + contribution);
          responder.addSection('bversion', bversion + 1);
          debug('updated account', params.account, 'with balance change of', contribution);
          //lets work out what the previous alterative account
          const prevAltAccount = params.account === src ? dst:src;
          const newAltAccount = nullIfZeroLength(params.account === params.src ? params.dst: params.src);
          if (prevAltAccount !== null) {
            debug('previous account needs update', prevAltAccount);
            const { currency: acurrency, balance } = getAccount.get(prevAltAccount);
            contribution = acurrency === params.currency ?
              (prevAltAccount === src ? amount : -amount) : (prevAltAccount === src ? srcamount : -dstamount);
            if (newAltAccount === prevAltAccount) {
              debug('previous alt is same as new alt');
              //not changed altAccount so we now add in the new contribution
              contribution += acurrency === params.currency ?
                (prevAltAccount === params.src ? -1 * nullOrAmount(params.amount) : nullOrAmount(params.amount)) :
                (prevAltAccount === params.src ? -1 * nullOrAmount(params.accountamount) : nullOrAmount(params.accountamount));
            }
            updateAccountBalance.run(balance + contribution, prevAltAccount);
            debug('previous account needs update', prevAltAccount, 'balance change of', contribution);
          }
          if (newAltAccount !== null && newAltAccount !== prevAltAccount) {
            const { currency: acurrency, balance } = getAccount.get(newAltAccount);
            contribution = acurrency === params.currency ?
              (newAltAccount === params.src ? -1 * nullOrAmount(params.amount) : nullOrAmount(params.amount)) :
              (newAltAccount === params.src ? -1 * nullOrAmount(params.accountamount) : nullOrAmount(params.accountamount));
            updateAccountBalance.run(balance + contribution, newAltAccount);
            debug('new alt account',newAltAccount,'balance change of', contribution);
          }
        }
        //updated the account balance, so now handle the update to the transaction itself
        if (params.account === params.src) {

          debug('type src - source account', src, 'account', params.account);
          if (params.account !== src) swapSrcDst.run(tid); //we have to swap first
          if (params.type === 'move' && dst === null && params.dst.length > 0) {
            debug('Previous dst was null, but we moved to it, so make src', params.dst,'and make dst null (later update)');
            changeXactionSrc.run(params.dst, tid);
            params.account = params.dst
            params.dst = '';
          }
          updateXactionSrc.run(
            nullOrAmount(params.amount),
            nullOrAmount(params.accountamount),
            params.cleared !== undefined ? 1 : 0,
            nullOrNumber(params.code), 
            params.currency,
            parseInt(params.date,10),
            params.description,
            params.rno,
            parseInt(params.repeat,10),
            nullIfZeroLength(params.dst),
            tid
          );

        } else if (params.account === params.dst){
          debug('type dst - dst account', dst, 'account', params.account);
          if (params.account !== dst) swapSrcDst.run(tid); //we have to swap first
          if (params.saver === 'move' && src === null && params.src.length > 0) {
            debug('Previous src was null, but we moved to it, so make dst', params.src, 'and make src null (later update)');
            changeXactionDst.run(params.src, tid);
            params.account = params.src;
            params.src = '';
          }
          updateXactionDst.run(
            nullOrAmount(params.amount),
            nullOrAmount(params.accountamount),
            params.cleared !== undefined ? 1 : 0,
            nullOrNumber(params.code),
            params.currency,
            parseInt(params.date, 10),
            params.description,
            params.rno,
            parseInt(params.repeat, 10),
            nullIfZeroLength(params.src),
            tid
          );
        } else {
          debug('Invalid Account:', params.account, ',source:', params.src, ',destination:', params.dst);
          responder.addSection('status', 'Fail Invalid Account');
          return;
        }
        debug('tid', tid, 'params.account', params.account);
        const transaction = getUpdatedXaction.get(tid, params.account)
        debug('transaction', transaction)
        responder.addSection('transaction', transaction);
        responder.addSection('status', 'OK');
        
      } else {
        debug('params version', params.version, 'database version', version,'tid', tid);
        responder.addSection('status', 'Fail version mismatch');
      }
    }
  })();
  debug('request complete')
};
