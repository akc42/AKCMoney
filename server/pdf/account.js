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
(function() {
  'use strict';

  const debug = require('debug')('money:pdfaccount');
  const db = require('@akc42/server-utils/database');
  const {dbDateToString, blankIfNull} = require('../utils.js');
  const path = require('path');

  module.exports = async function(user, params, doc) {
    debug('new request from', user.name, 'with params', params );
    const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
    const getAccount = db.prepare('SELECT startdate, currency, balance, date FROM account WHERE name = ?');
    const xactionsByDate = db.prepare(`SELECT t.*, sc.type AS stype, dc.type AS dtype
     FROM xaction t LEFT JOIN code sc ON t.srccode = sc.id LEFT JOIN code dc ON t.dstcode = dc.id 
    WHERE (src = ? OR dst = ? ) AND date >= ? ORDER BY date`);
    const xactionsUnReconciled = db.prepare(`SELECT t.*, sc.type AS stype, dc.type AS dtype
      FROM xaction t LEFT JOIN code sc ON t.srccode = sc.id LEFT JOIN code dc ON t.dstcode = dc.id
      WHERE (src = ? AND srcclear = 0) OR (dst = ? AND dstclear = 0) ORDER BY date`);  
    db.transaction(() => {
      const {startdate, currency, balance, date: balanceDate} = getAccount.get(params.account);
      const now = new Date();
      doc.fontSize(14).text(`Account: ${params.account}`, {align: 'center'});
      doc.fontSize(8).text(`Created: ${now.toLocaleDateString()}`, {align: 'center'});
      doc.fontSize(11).text(`Currency: ${currency}`, { align: 'center' });
      doc.moveDown(1);
      doc.font('Helvetica-Bold');
      let pageNo = 1;

      let transactions;

      if (startdate === null) {
        debug('add unreconciled transactions');
        transactions = xactionsUnReconciled.bind(params.account, params.account);
        doc.text('Unreconciled Transactions only');
      } else {
        let start;
        const startDate = new Date();
        startDate.setHours(3, 0, 0, 0);
        if (startdate === 0) {
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
          start = Math.floor(startDate.getTime() / 1000);
          doc.text(`Transactions for Financial Year Starting: ${startDate.toLocaleDateString()}`)
        } else {

          startDate.setTime(startdate * 1000);
          start = startdate;
          doc.text(`Transactions From Date: ${startDate.toLocaleDateString()}`)
        }

        debug('add transactions from startdate', startDate.toLocaleString());
        transactions = xactionsByDate.bind(params.account,params.account, start);
      }
      doc.font('Helvetica').fontSize(10).moveDown();
      debug('amount width', doc.widthOfString('-9999.99'));
      let y = doc.y
      //make grey header panel at top
      doc.rect(72,y,451, 24).fillAndStroke('gainsboro');
      y += 2;
      doc.rect(71, y, 453, 18).stroke('white');
      doc.moveTo(135, y).lineTo(135, y + 18).stroke();
      doc.moveTo(180, y).lineTo(180, y + 18).stroke();
      doc.moveTo(419, y).lineTo(419, y + 18).stroke();
      doc.moveTo(465, y).lineTo(465, y + 18).stroke();
      doc.moveTo(511, y).lineTo(511, y + 18).stroke();     
      y += 2;
      doc.fillColor('black').strokeColor('black');

      doc.font('Helvetica');
      doc.text(dbDateToString(balanceDate), 74, y, {width: 58});
     
      doc.text('Reconciled Balance', 183,y,{width: 239});
      doc.text((balance/100).toFixed(2),471,y,{align: 'right', width: 37});
      y +=20;
      doc.x = 72;
      doc.y = y;
      let even = false;
      let cumulative = balance;
      for (const transaction of transactions.iterate()) {
        doc.x = 72;
        if (y > 769) {
          doc.y = 793
          doc.text(`Page: ${pageNo}`, {align: 'center'});
          pageNo++;
          doc.addPage();
          doc.fontSize(12).text(`Account: ${params.account}`, { align: 'center' });
          doc.fontSize(10).moveDown(2);
          even = false;
        }
        y = doc.y;
        if (transaction.src !== null && transaction.dst !== null) {
          doc.font('Helvetica-Bold');
        }
        const ht = doc.heightOfString(transaction.description, { width: 233 })
        const h = Math.max(Math.ceil(ht), 12) + 4;
        const dy = (h - ht)/2;
        if (h !== 16) debug('height of transaction', ht, 'Desc', transaction.description.substring(0,20));
        if (even) {
          doc.rect(72, y, 451, h).fillAndStroke('aliceblue')
          doc.moveTo(135, y).lineTo(135, y + h).stroke('white');
          doc.moveTo(180, y).lineTo(180, y + h).stroke();
          doc.moveTo(419, y).lineTo(419, y + h).stroke()
          doc.moveTo(465, y).lineTo(465, y + h).stroke();
          doc.moveTo(511, y).lineTo(511, y + h).stroke(); 
      
          doc.fillColor('black').strokeColor('black');

        }
        y += dy;
        even = !even;

        let cleared = false;
        if ((transaction.src === params.account && transaction.srcclear === 1) ||
          (transaction.dst === params.account && transaction.dstclear === 1)) {
          doc.rect(72, y - dy, 62, h).fillAndStroke('paleturquoise'); //date
          doc.fillColor('black').strokeColor('black');
          cleared = true;
        } else if (transaction.repeat !== 0) {
          doc.rect(72, y - dy, 62, h).fillAndStroke('yellow'); //date
          doc.fillColor('black').strokeColor('black');
        }
        doc.text(dbDateToString(transaction.date),74,y,{width: 58});


        doc.text(blankIfNull(transaction.ref), 138, y, {width: 39, height: h-4});
        doc.text(transaction.description, 183, y, {width: 233});
        if (currency === transaction.currency) {
          let amount = transaction.amount;
          if (transaction.src === params.account) amount = -amount;
          if (!cleared) cumulative += amount;
          doc.text((amount/100).toFixed(2), 422, y, {width: 40, height: h -4,align: 'right'});
        } else {
          doc.rect(420, y-dy, 41, h).fillAndStroke('gainsboro'); //amount
          doc.fillColor('black').strokeColor('black');
          let amount = param.account === transaction.src ? -transaction.srcamount : transaction.dstamount
          if (!cleared) cumulative += amount;
          doc.text((amount / 100).toFixed(2), 422, y, { width: 40, height: h - 4,align: 'right' });
        }
        if (!cleared) {
          doc.text((cumulative / 100).toFixed(2), 468, y, { width: 40, height: h - 4, align: 'right'});
        }
        if (transaction.src === params.account && transaction.stype !== null) {
          doc.image(
            path.resolve(__dirname,'../assets/',`${transaction.stype}_codes.png`), 
            512,y,
            {width:16,height:16}
          );

        } else if (transaction.dst === params.account && transaction.dtype !== null) {
          doc.image(
            path.resolve(__dirname, '../assets/', `${transaction.dtype}_codes.png`), 
            512, y, 
            { width: 16, height: 16 }
          );
        }
        y += (h - dy);
        doc.x = 72;
        doc.y = y;
        doc.font('Helvetica');
      }
      doc.y = 793;
      doc.text(`Page: ${pageNo}`, { align: 'center' });
     
    })();
    debug('request complete')
  };
})();