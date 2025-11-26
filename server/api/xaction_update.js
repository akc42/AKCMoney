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
  const moveXactionToDst = db.prepare('UPDATE xaction SET src = ?, dst = NULL, dstamount = NULL, dstclear = 0  WHERE id = ?'); //updateXaction will handle other src values
  const moveXactionToSrc = db.prepare('UPDATE xaction SET dst = ? , src = NULL, srcamount = NULL, srcclear = 0 WHERE id = ?'); //updateXaction will handly other dst values
  const getUpdatedXaction = db.prepare(`SELECT t.*, tc.rate AS trate, 
  CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
  CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
  FROM account a JOIN xaction t ON(t.src = a.name OR t.dst = a.name)
  LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
  LEFT JOIN currency tc ON tc.name = t.currency
  WHERE t.id = ? AND a.name = ?`)
  const updateXaction = db.prepare(`WITH items (rate, name,altname, acurrency, tcurrency, amount, aamount, clear, code ) AS (
    SELECT CASE
        WHEN a.name IS NULL OR c.name IS NULL THEN 0 
        WHEN d.name = c.name AND d.name <> a.currency THEN ac.rate
        WHEN d.name <> c.name AND d.name <> a.currency THEN  ac.rate/c.rate
        WHEN d.name <> c.name AND d.name = a.currency THEN 1/c.rate
        ELSE 1
    END As Rate, ? AS name, a.name AS altname, a.currency AS acurrency, c.name AS tcurrency, 
    ? AS amount, ? AS aamount, ? AS clear, ? AS code
    FROM Currency d LEFT JOIN Account a ON a.name = ? LEFT JOIN Currency c ON c.name = ? LEFT JOIN Currency ac ON ac.name = a.currency 
    WHERE d.priority = 0 
)
UPDATE xaction AS t  SET
    date = ?, version = t.version + 1, amount = items.amount, currency = items.tcurrency,
    src = CASE WHEN COALESCE(items.name,'') = COALESCE(t.src,'') THEN t.src ELSE items.altname END,
    dst = CASE WHEN COALESCE(items.name,'') = COALESCE(t.dst,'') AND COALESCE(items.name,'') <> COALESCE(t.src,'') THEN t.dst ELSE items.altname END,
    srcamount = CAST(CASE WHEN COALESCE(t.src,'') = COALESCE(items.altname,'') OR t.src IS NULL THEN 
        CASE WHEN items.tcurrency = items.acurrency OR items.altname IS NULL THEN NULL
        ELSE t.amount * items.rate END
        ELSE items.aamount END AS INTEGER) ,
    dstamount = CAST(CASE WHEN COALESCE(t.dst,'') = COALESCE(items.altname,'') OR t.dst IS NULL THEN
        CASE WHEN items.tcurrency = items.acurrency OR items.altname IS NULL THEN NULL
        ELSE t.amount * items.rate END
    ELSE items.aamount END AS INTEGER),
    srcclear = CASE WHEN COALESCE(t.src,'') = COALESCE(items.name,'') THEN items.clear ELSE CASE WHEN items.altname IS NULL THEN 0 ELSE t.srcclear END END,
    dstclear = CASE WHEN COALESCE(t.dst,'') = COALESCE(items.name,'') AND COALESCE(items.name,'') <> COALESCE(t.src,'') THEN items.clear ELSE CASE WHEN items.altname IS NULL THEN 0 ELSE t.dstclear END END,
    srccode = CASE WHEN COALESCE(t.src,'') = COALESCE(items.name,'') THEN items.code ELSE CASE WHEN items.altname IS NULL THEN NULL ELSE t.srccode END END,
    dstcode = CASE WHEN COALESCE(t.dst,'') = COALESCE(items.name,'') AND COALESCE(items.name,'') <> COALESCE(t.src,'') THEN items.code ELSE CASE WHEN items.altname IS NULL THEN NULL ELSE t.dstcode END END,
    repeat = ?,
    rno = ?,
    description = ?
FROM items WHERE t.id = ?`);
  const updateAccountBalance = db.prepare(`UPDATE account SET bversion = bversion + 1, balance = ?, 
    date = (strftime('%s','now')) WHERE name = ?`);
  const getDefaultCurrency = db.prepare(`SELECT name FROM currency WHERE priority = 0`).pluck();
  const getRate = db.prepare('SELECT Rate FROM Currency WHERE name = ?').pluck();
  db.transaction(() => {
    const tid = parseInt(params.tid, 10);
    if (tid === 0) {
      const {currency, balance, bversion} = getAccount.get(params.account);
      const altAccount = nullIfZeroLength(params.account === params.src ? params.dst: params.src);
      let altAmount = null;
      if (altAccount !== null) {
        const {currency: acurrency} = getAccount.get(altAccount);
        debug('have other account, so we need to worry about currency of', acurrency);
        if (acurrency === params.currency) {
            altAmount = nullOrAmount(params.amount)
        } else if (acurrency === currency) {
            altAmount = nullOrAmount(params.accountamount);
        } else {
          //currency isn't anything we have an amount for, so we are going to have to calculate one for the account
          // so we get the default currency first
          const dc = getDefaultCurrency.get()
          let rate;
          if (params.currency === dc) {
            //transaction is in default currency, so we need to get rate of newAltAccount
            rate = getRate.get(acurrency);
          } else if (acurrency === dc) {
            rate = 1/getRate.get(params.currency)
          } else {
            rate = getRate.get(acurrency)/getRate.get(params.currency)
          }
          debug('completely different currency in this account so rate', rate);
          altAmount = Math.round(rate * nullOrAmount(params.amount));
        } 
      }
      const {lastInsertRowid } = newXaction.run(
        parseInt(params.date,10),
        nullOrAmount(params.amount),
        params.currency,
        nullIfZeroLength(params.src),
        params.account === params.src && currency !== params.currency ? nullOrAmount(params.accountamount) : ((altAccount !== null && altAccount === params.src )? altAmount: null),
        params.account === params.src ? booleanToDbValue(params.cleared) : 0,
        params.account === params.src ? nullOrNumber(params.code) : null,
        nullIfZeroLength(params.dst),
        params.account === params.dst && currency !== params.currency ? nullOrAmount(params.accountamount) : ((altAccount !== null && altAccount === params.dst )? altAmount: null),
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

      if (version === Number(params.version)) {
        const { currency:acurrency, balance, bversion } = getAccount.get(params.account);

        // This is a valid update to the transaction, so lets see if we have to worry about adjustments to any account balance 
        if ((params.cleared === undefined && (srcclear === 1 || dstclear === 1)) || 
          (params.cleared !== undefined && (srcclear === 0 || dstclear === 0 || amount !== nullOrAmount(params.amount))) || currency !== params.currency){
          debug('transaction update is possibly changing at least one of the account balances');
          
          let balanceChange = 0;
          //start with params.account first which we have already read.
          if (params.cleared === undefined) {
            if (params.account === src && srcclear === 1) {
              balanceChange = acurrency === currency ? amount  : srcamount ;
            } else if (params.account === dst && dstclear === 1) {
              balanceChange = acurrency === currency ?  -amount : -dstamount;
            }
          } else if (params.account === src) {
            if (srcclear !== 1 ) {
              balanceChange = acurrency === params.currency ? -nullOrAmount(params.amount) : -nullOrAmount(params.accountamount);
            } else if (amount !== nullOrAmount(params.amount)) {
              balanceChange = acurrency === params.currency ? (amount - nullOrAmount(params.amount)) : srcamount - nullOrAmount(params.accountamount);
            }
          } else {
            if (dstclear !== 1) {
              balanceChange = acurrency === currency ? nullOrAmount(params.amount) : nullOrAmount(params.accountamount);
            } else if (amount !== nullOrAmount(params.amount)) {
              balanceChange = acurrency === params.currency ? (nullOrAmount(params.amount) - amount) : nullOrAmount(params.accountamount) -dstamount;
            }
          }
          if (balanceChange !== 0) {
            updateAccountBalance.run(balance + balanceChange,params.account);
            responder.addSection('balance', balance + balanceChange);
            responder.addSection('bversion', bversion + 1);
            debug('updated account', params.account, 'with balance change of', balanceChange);
          }
        }
        // now lets look at the alternative account for potential balance changes to it
        //lets work out what the previous alterative account      
        const prevAltAccount = params.account === src ? dst:src;
        const newAltAccount = nullIfZeroLength(params.account === params.src ? params.dst: params.src);
        if (prevAltAccount !== null && ((prevAltAccount === src && srcclear === 1) || (prevAltAccount === dst && dstclear === 1)) || 
          (newAltAccount === prevAltAccount && params.cleared !== undefined)) {
          let balanceChange = 0;  
          debug('either', prevAltAccount, 'or', newAltAccount, 'balance will change - lets calculate'); 
          const { currency: pcurrency, balance } = getAccount.get(prevAltAccount);
          if (pcurrency === currency) {
            if (prevAltAccount === src && srcclear === 1) {
              balanceChange = amount;
            } else if (prevAltAccount === dst && dstclear === 1) {
              balanceChange = -amount
            }
          } else  if (prevAltAccount === src && srcclear === 1) {
            balanceChange = srcamount;
          } else if (prevAltAccount === dst && dstclear === 1) {
            balanceChange = -dstamount;
          }
          if (newAltAccount === prevAltAccount && params.cleared !== undefined) {
            if (pcurrency === params.currency) {
              balanceChange -= prevAltAccount === src ? nullOrAmount(params.amount): -nullOrAmount(params.amount); 
            } else {
              balanceChange -= prevAltAccount === src ? nullOrAmount(params.srcamount) : -nullOrAmount(params.dstamount);
            }
          }
          if (balanceChange !== 0) {
            debug('previous account balance needs update', prevAltAccount);
            updateAccountBalance.run(balance + balanceChange, prevAltAccount);
          }
        }
        
        if (newAltAccount !== null && newAltAccount !== prevAltAccount && params.cleared !== undefined) { 
          const {currency: ncurrency, balance} = getAccount.get(newAltAccount);
          let balanceChange;
          if (ncurrency === params.currency) {
            balanceChange = nullOrAmount(params.amount) * (newAltAccount === params.src? -1:1)
          } else if (ncurrency === acurrency) {
            balanceChange = nullOrAmount(params.accountamount) * (newAltAccount === params.src? -1:1)
          } else {
            //currency isn't anything we have an amount for, so we are going to have to calculate one for the account
            // so we get the default currency first
            const dc = getDefaultCurrency.get()
            let rate;
            if (params.currency === dc) {
              //transaction is in default currency, so we need to get rate of newAltAccount
              rate = getRate.get(ncurrency);
            } else if (ncurrency === dc) {
              rate = 1/getRate.get(params.currency)
            } else {
              rate = getRate.get(ncurrency)/getRate.get(params.currency)
            }
            balanceChange = Math.round(rate * nullOrAmount(params.amount)) * (newAltAccount === params.src? -1:1)
          }
          if (balanceChange !== 0) {
            debug('new Alt account balance needs update', newAltAccount);
            updateAccountBalance.run(balance + balanceChange, newAltAccount);
          }
        }        
        //updated the account balance, so now handle the update to the transaction itself
        if (params.account === params.src) {
          debug('type src - source account', src, 'account', params.account);
          if (params.account !== src) swapSrcDst.run(tid); //we have to swap first
          if (params.type === 'move' && dst === null && params.dst.length > 0) {
            debug('Previous dst was null, but we moved to it, so make src', params.dst,'and make dst null (later update)');
            moveXactionToDst.run(params.dst, tid);
            params.account = params.dst;
            params.src = params.dst;
            params.dst = '';
          }
        } else if (params.account === params.dst){
          debug('type dst - dst account', dst, 'account', params.account);
          if (params.account !== dst) swapSrcDst.run(tid); //we have to swap first
          if (params.type === 'move' && src === null && params.src.length > 0) {
            debug('Previous src was null, but we moved to it, so make dst', params.src, 'and make src null (later update)');
            moveXactionToSrc.run(params.src, tid);
            params.account = params.src;
            params.dst = params.src;
            params.src = '';
          }
        } else {
          debug('Invalid Account:', params.account, ',source:', params.src, ',destination:', params.dst);
          responder.addSection('status', 'Fail Invalid Account');
          return;
        }
        updateXaction.run(
          params.account,
          nullOrAmount(params.amount),
          nullOrAmount(params.accountamount),
          params.cleared !== undefined ? 1 : 0,
          nullIfZeroLength(params.code),
          params.src === params.account ? nullIfZeroLength(params.dst): nullIfZeroLength(params.src),
          params.currency,
          Number(params.date),
          Number(params.repeat),
          nullIfZeroLength(params.rno),
          nullIfZeroLength(params.description),
          tid
        );
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
