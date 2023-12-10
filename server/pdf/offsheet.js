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
import { dbDateToString,blankIfNull } from '../utils.js';
import DB from '@akc42/sqlite-db';
const db = DB();
const debug = Debug('money:pdfoffsheet');

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
const transactionsHeader = doc => {
  let y = doc.y
  doc.font('Helvetica-Bold');
  doc.rect(LEFT_EDGE, y, RIGHT_EDGE - LEFT_EDGE, 16).fillAndStroke('khaki')
  doc.moveTo(DATE_REF_LINE, y).lineTo(DATE_REF_LINE, y + 16).stroke('white');
  doc.moveTo(REF_DESC_LINE, y).lineTo(REF_DESC_LINE, y + 16).stroke();
  doc.moveTo(DESC_AMOUNT_LINE, y).lineTo(DESC_AMOUNT_LINE, y + 16).stroke()
  doc.moveTo(AMOUNT_TOTAL_LINE, y).lineTo(AMOUNT_TOTAL_LINE, y + 16).stroke();
  doc.moveTo(TOTAL_CODE_LINE, y).lineTo(TOTAL_CODE_LINE, y + 16).stroke();
  doc.fillColor('black').strokeColor('black');
  y = y+2;
  doc.text('Date', DATE_POSITION, y, { width: DATE_WIDTH, align: 'Center' });
  doc.text('Ref', REF_POSITION, y, { width: REF_WIDTH});
  doc.text('Description', DESC_POSITION, y, { width: DESC_WIDTH });
  doc.text('Amount', AMOUNT_POSITION, y, { width: AMOUNT_WIDTH, align: 'right' });    
  doc.text('Total', TOTAL_POSITION, y, { width: AMOUNT_WIDTH, align: 'right' });
  doc.font('Helvetica');
  doc.x = LEFT_EDGE;
  doc.y = y+14;
}

export default async function(user, params, doc) {
  debug('new request from', user.name, 'with params', params );
  const dc = db.prepare('SELECT name, description FROM currency WHERE priority = 0');
  const getCode = db.prepare('SELECT description FROM code WHERE id = ?').pluck();
  const getXactions = db.prepare(`SELECT
          t.id,t.date,t.version, t.description, t.rno, t.repeat, cur.name AS currency, 
          CASE 
              WHEN t.src = a.name THEN -dfamount
              ELSE dfamount 
          END AS amount,
          t.src,t.srccode, t.dst, t.dstcode, 0 as srcclear, 0 as dstclear, 0 AS reconciled, 1 AS trate
      FROM  
          user u, currency cur, dfxaction x JOIN xaction t ON x.id = t.id,code c 
          INNER JOIN account a ON 
              (t.src = a.name AND t.srccode = c.id) 
              OR (t.dst = a.name AND t.dstcode = c.id) 
          LEFT JOIN capability p ON 
              p.uid = u.uid 
              AND p.domain = a.domain 
      WHERE 
          u.uid = ? 
          AND (u.isAdmin = 1 OR p.uid IS NOT NULL) 
          AND c.id = ?
          AND cur.priority = 0
      ORDER BY 
          t.Date
  `);
  db.transaction(() => {
    const {name:currency, description } = dc.get();
    const accountName = getCode.get(params.code);

    const now = new Date();
    doc.fontSize(14).text(`Account: ${accountName}`, {align: 'center'});
    doc.fontSize(8).text(`Created: ${dbDateToString(Math.floor(now.getTime()/1000))}`, {align: 'center'});
    doc.fontSize(11).text(`Default Currency: ${currency}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(8).text('All transactions have been normalised to the default currency')
    doc.fontSize(10).moveDown(2);
    transactionsHeader(doc)
    
    let pageNo = 1;

    const transactions = getXactions.bind(user.uid, params.code);
    

    let y = doc.y

    let even = false;
    let cumulative = 0;
    for (const transaction of transactions.iterate()) {
      doc.x = LEFT_EDGE;
      if (y > PAGE_BOTTOM) {
        doc.y = PAGE_POSITION;
        doc.text(`Page: ${pageNo}`, {align: 'center'});
        pageNo++;
        doc.addPage();
        doc.fontSize(12).text(`Account: ${accountName}`, { align: 'center' });
        doc.fontSize(10).moveDown(2);
        transactionsHeader(doc)
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
      doc.text(dbDateToString(transaction.date),DATE_POSITION,y,{width: DATE_WIDTH, align:'right'});
      doc.text(blankIfNull(transaction.ref), REF_POSITION, y, {width: REF_WIDTH, height: h-4});
      doc.text(transaction.description, DESC_POSITION, y, {width: DESC_WIDTH});
      cumulative += transaction.amount;
      doc.text((transaction.amount/100).toFixed(2), AMOUNT_POSITION, y, {width: AMOUNT_WIDTH, height: h -4,align: 'right'});
      doc.text((cumulative / 100).toFixed(2), TOTAL_POSITION, y, { width: AMOUNT_WIDTH, height: h - 4, align: 'right'});

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
