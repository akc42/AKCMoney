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
import Debug from 'debug';
import db from '@akc42/sqlite-db';
import { dbDateToString,blankIfNull } from '../utils.js';

const debug = Debug('money:pdfaccount');

const path = require('path');
const LEFT_EDGE = 72;
const RIGHT_EDGE = 523;
const DATE_WIDTH = 63;
const REF_WIDTH = 39;
const AMOUNT_WIDTH = 45;
const CODE_SIZE = 12;
const LEFT_LINE = LEFT_EDGE - 1;
const RIGHT_LINE = RIGHT_EDGE + 1;
const TEXT_MARGIN = 3;
const DATE_POSITION = LEFT_LINE + TEXT_MARGIN;
const DATE_REF_LINE = DATE_POSITION + DATE_WIDTH + TEXT_MARGIN;
const REF_POSITION = DATE_REF_LINE + TEXT_MARGIN;
const REF_DESC_LINE = REF_POSITION + REF_WIDTH;
const DESC_POSITION = REF_DESC_LINE + TEXT_MARGIN;
const CODE_POSITION = RIGHT_LINE - CODE_SIZE;
const TOTAL_CODE_LINE = CODE_POSITION-1;
const TOTAL_POSITION = TOTAL_CODE_LINE - AMOUNT_WIDTH - TEXT_MARGIN;
const AMOUNT_TOTAL_LINE = TOTAL_POSITION - TEXT_MARGIN;
const AMOUNT_POSITION = AMOUNT_TOTAL_LINE - AMOUNT_WIDTH - TEXT_MARGIN;
const DESC_AMOUNT_LINE = AMOUNT_POSITION - TEXT_MARGIN;
const DESC_WIDTH = DESC_AMOUNT_LINE - TEXT_MARGIN - DESC_POSITION;
const PAGE_BOTTOM = 769;
const PAGE_POSITION = 793;
const DATE_AREA_WIDTH = DATE_REF_LINE - 1 - LEFT_EDGE;
const AMOUNT_AREA_WIDTH = AMOUNT_WIDTH + 2 * (TEXT_MARGIN-1);
debug('DATE_POSITION, REF_POSITION, DESC_POSITION, AMOUNT_POSITION, TOTAL_POSITION, CODE_POSITION', DATE_POSITION, REF_POSITION, DESC_POSITION, AMOUNT_POSITION, TOTAL_POSITION, CODE_POSITION);


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
    doc.fontSize(8).text(`Created: ${dbDateToString(Math.floor(now.getTime()/1000))}`, {align: 'center'});
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
    debug('amount width', doc.widthOfString('-99999.99'));
    let y = doc.y
    //make grey header panel at top
    doc.rect(LEFT_EDGE,y,RIGHT_EDGE-LEFT_EDGE, 24).fillAndStroke('gainsboro');
    y += 2;
    doc.rect(LEFT_LINE, y, RIGHT_LINE-LEFT_LINE, 18).stroke('white');
    doc.moveTo(DATE_REF_LINE, y).lineTo(DATE_REF_LINE, y + 18).stroke();
    doc.moveTo(REF_DESC_LINE, y).lineTo(REF_DESC_LINE, y + 18).stroke();
    doc.moveTo(DESC_AMOUNT_LINE, y).lineTo(DESC_AMOUNT_LINE, y + 18).stroke();
    doc.moveTo(AMOUNT_TOTAL_LINE, y).lineTo(AMOUNT_TOTAL_LINE, y + 18).stroke();
    doc.moveTo(TOTAL_CODE_LINE, y).lineTo(TOTAL_CODE_LINE, y + 18).stroke();     
    y += 2;
    doc.fillColor('black').strokeColor('black');

    doc.font('Helvetica');
    doc.text(dbDateToString(balanceDate), DATE_POSITION, y, {width: DATE_WIDTH});
    
    doc.text('Reconciled Balance', DESC_POSITION,y,{width: DESC_WIDTH});
    doc.text((balance/100).toFixed(2),TOTAL_POSITION,y,{align: 'right', width: AMOUNT_WIDTH});
    y +=20;
    doc.x = LEFT_EDGE;
    doc.y = y;
    let even = false;
    let cumulative = balance;
    for (const transaction of transactions.iterate()) {
      doc.x = LEFT_EDGE;
      if (y > PAGE_BOTTOM) {
        doc.y = PAGE_POSITION;
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
      const ht = doc.heightOfString(transaction.description, { width: DESC_WIDTH })
      const h = Math.max(Math.ceil(ht), 12) + 4;
      const dy = (h - ht)/2;
      if (h !== 16) debug('height of transaction', ht, 'Desc', transaction.description.substring(0,20));
      if (even) {
        doc.rect(LEFT_EDGE, y, RIGHT_EDGE-LEFT_EDGE, h).fillAndStroke('aliceblue')
        doc.moveTo(DATE_REF_LINE, y).lineTo(DATE_REF_LINE, y + h).stroke('white');
        doc.moveTo(REF_DESC_LINE, y).lineTo(REF_DESC_LINE, y + h).stroke();
        doc.moveTo(DESC_AMOUNT_LINE, y).lineTo(DESC_AMOUNT_LINE, y + h).stroke()
        doc.moveTo(AMOUNT_TOTAL_LINE, y).lineTo(AMOUNT_TOTAL_LINE, y + h).stroke();
        doc.moveTo(TOTAL_CODE_LINE, y).lineTo(TOTAL_CODE_LINE, y + h).stroke(); 
    
        doc.fillColor('black').strokeColor('black');

      }
      y += dy;
      even = !even;

      let cleared = false;
      if ((transaction.src === params.account && transaction.srcclear === 1) ||
        (transaction.dst === params.account && transaction.dstclear === 1)) {
        doc.rect(LEFT_EDGE, y - dy,DATE_AREA_WIDTH , h).fillAndStroke('paleturquoise'); //date
        doc.fillColor('black').strokeColor('black');
        cleared = true;
      } else if (transaction.repeat !== 0) {
        doc.rect(LEFT_EDGE, y - dy, DATE_AREA_WIDTH, h).fillAndStroke('yellow'); //date
        doc.fillColor('black').strokeColor('black');
      }
      doc.text(dbDateToString(transaction.date),DATE_POSITION,y,{width: DATE_WIDTH, align:'right'});


      doc.text(blankIfNull(transaction.ref), REF_POSITION, y, {width: REF_WIDTH, height: h-4});
      doc.text(transaction.description, DESC_POSITION, y, {width: DESC_WIDTH});
      if (currency === transaction.currency) {
        let amount = transaction.amount;
        if (transaction.src === params.account) amount = -amount;
        if (!cleared) cumulative += amount;
        doc.text((amount/100).toFixed(2), AMOUNT_POSITION, y, {width: AMOUNT_WIDTH, height: h -4,align: 'right'});
      } else {
        doc.rect(DESC_AMOUNT_LINE + 1, y-dy, AMOUNT_AREA_WIDTH, h).fillAndStroke('gainsboro'); //amount
        doc.fillColor('black').strokeColor('black');
        let amount = param.account === transaction.src ? -transaction.srcamount : transaction.dstamount
        if (!cleared) cumulative += amount;
        doc.text((amount / 100).toFixed(2), AMOUNT_POSITION, y, { width: AMOUNT_WIDTH, height: h - 4,align: 'right' });
      }
      if (!cleared) {
        doc.text((cumulative / 100).toFixed(2), TOTAL_POSITION, y, { width: AMOUNT_WIDTH, height: h - 4, align: 'right'});
      }
      if (transaction.src === params.account && transaction.stype !== null) {
        doc.image(
          path.resolve(__dirname,'../assets/',`${transaction.stype}_codes.png`), 
          CODE_POSITION, y,
          { width: CODE_SIZE, height: CODE_SIZE }
        );

      } else if (transaction.dst === params.account && transaction.dtype !== null) {
        doc.image(
          path.resolve(__dirname, '../assets/', `${transaction.dtype}_codes.png`), 
          CODE_POSITION, y, 
          { width: CODE_SIZE, height: CODE_SIZE }
        );
      }
      y += (h - dy);
      doc.x = LEFT_EDGE;
      doc.y = y;
      doc.font('Helvetica');
    }
    doc.y = PAGE_POSITION;
    doc.text(`Page: ${pageNo}`, { align: 'center' });
    
  })();
  debug('request complete')
};
