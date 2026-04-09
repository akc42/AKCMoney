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
import path from 'node:path';
import  { insertRepeats, dbDateToString, blankIfNull } from '../utils.js';
import mdb from '@akc42/sqlite-db';

const LEFT_EDGE = 72;
const RIGHT_EDGE = 523;
const DATE_WIDTH = 63;
const REF_WIDTH = 25;
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
const CODE_POSITION = LEFT_EDGE;
const TOTAL_POSITION = RIGHT_LINE - AMOUNT_WIDTH - TEXT_MARGIN;
const AMOUNT_TOTAL_LINE = TOTAL_POSITION - TEXT_MARGIN;
const AMOUNT_POSITION = AMOUNT_TOTAL_LINE - AMOUNT_WIDTH - TEXT_MARGIN;
const DESC_AMOUNT_LINE = AMOUNT_POSITION - TEXT_MARGIN;
const DESC_WIDTH = DESC_AMOUNT_LINE - TEXT_MARGIN - DESC_POSITION;
const PAGE_BOTTOM = 748;
const PAGE_POSITION = 793;
const DATE_AREA_WIDTH = DATE_REF_LINE - 1 - LEFT_EDGE;
const DEPRECIATION_POSITION = AMOUNT_POSITION - AMOUNT_WIDTH - TEXT_MARGIN;

const codeHeader = (code, doc, profit) => {
  let y = doc.y
  const ht = doc.heightOfString(code.description, { width: DESC_WIDTH })
  const h = Math.max(Math.ceil(ht), 12) + 6;



  //make grey header panel at top
  doc.rect(LEFT_EDGE, y, RIGHT_EDGE - LEFT_EDGE, h+6).fillAndStroke('gainsboro');
  y += 3;
  doc.rect(LEFT_LINE, y, RIGHT_LINE - LEFT_LINE, h).stroke('white');

  doc.moveTo(DATE_REF_LINE, y).lineTo(DATE_REF_LINE, y + h).stroke();
  doc.moveTo(REF_DESC_LINE, y).lineTo(REF_DESC_LINE, y + h).stroke();
  doc.moveTo(DESC_AMOUNT_LINE, y).lineTo(DESC_AMOUNT_LINE, y + h).stroke();
  doc.moveTo(AMOUNT_TOTAL_LINE, y).lineTo(AMOUNT_TOTAL_LINE, y + h).stroke();

  y += 2;
  doc.fillColor('black').strokeColor('black');
  if (code.description !== 'Profit') {
    doc.image(
      path.resolve(path.resolve(new URL('../assets', import.meta.url).pathname, `${code.type}_codes.png`)),
      CODE_POSITION, y,
      { width: CODE_SIZE, height: CODE_SIZE }
    );
  } else {
    doc.font('Helvetica-Bold')
  }

  doc.text(code.description, DESC_POSITION, y, { width: DESC_WIDTH });
  if (code.description !== 'Profit') {
    doc.text((code.tamount/100).toFixed(2), AMOUNT_POSITION, y, {align: 'right', width: AMOUNT_WIDTH});
  }
  doc.text((profit / 100).toFixed(2), TOTAL_POSITION, y, { align: 'right', width: AMOUNT_WIDTH });
  doc.font('Helvetica');
  y += h+6; //small gap between header and what follows
  doc.x = LEFT_EDGE;
  doc.y = y;

}; 

export default async function(user, params, doc) {

  

  const {yearEnd} = db.get`SELECT value FROM settings WHERE name = ${'year_end'}`??{yearEnd:1231};
  const monthEnd = Math.floor(yearEnd / 100) - 1 //Range 0 to 11 for Dates 
  const dayEnd = yearEnd % 100;
  const endDate = new Date();
  const today = endDate.getTime();
  endDate.setHours(23, 59, 59); //last possible time
  endDate.setMonth(monthEnd);
  endDate.setDate(dayEnd);
  endDate.setFullYear(params.year);
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);
  const start = Math.floor(startDate.getTime() / 1000) + 1;
  const end = Math.ceil(endDate.getTime() / 1000);
  const now = new Date();
  doc.fontSize(14).text(`Account Reporting for Domain: ${params.domain}`, { align: 'center' });
  doc.fontSize(8).text(`Created: ${now.toLocaleDateString()}`, { align: 'center' });
  doc.fontSize(11).text('for Financial Year ' + params.year);
  
  doc.moveDown(1);
  doc.font('Helvetica-Bold');
  doc.text(`Covering the period from ${dbDateToString(start)} to ${dbDateToString(end)}`);

  doc.font('Helvetica').fontSize(10).moveDown(2);
  let pageNo = 1;
  try {
    mdb.transaction(db => {
      const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
    repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
      const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');

    const repeatCount = db.prepare(`SELECT COUNT(*) AS count FROM xaction t, account a, code c   
    WHERE
      t.repeat <> 0 AND
      t.date <= ${end} AND
      c.type <> 'O' AND
      a.domain = '${params.domain}' AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);

    const repeats = db.prepare(`SELECT t.* FROM xaction t, account a, code c WHERE
      t.repeat <> 0 AND
      t.date <= ${end} AND
      c.type <> 'O' AND
      a.domain = '${params.domain}' AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`);
  
      insertRepeats(repeatCount, repeats, insertRepeat, updateRepeat);
      let even = false;
      let profit = 0;
      for(const code of db.iterate`WITH p(startdate, endDate) AS (Select ${start} AS StartDate, ${end} AS Enddate)
SELECT c.id AS id, c.type AS type, c.description AS description,
      CAST(sum(CASE WHEN c.type='A' THEN (CAST(t.dfamount AS REAL) / c.depreciateyear) *
        CASE WHEN t.date BETWEEN  p.startdate AND p.enddate THEN CAST((p.enddate - t.date)AS REAL)/(p.enddate - p.startdate)
        WHEN t.date + (c.depreciateyear * (p.enddate - p.startdate)) BETWEEN p.startdate AND p.enddate 
            THEN CAST((t.date + (c.depreciateyear * (p.enddate - p.startdate)) - p.startdate) AS REAL)/ (p.enddate - p.startdate) ELSE 1 END 
        WHEN c.type = 'B' AND c.id = t.srccode THEN -t.dfamount ELSE t.dfamount END) AS INTEGER) AS tamount           
  FROM dfxaction AS t, account AS a, code AS c, p WHERE
      t.date + (CASE WHEN c.type = 'A' THEN (c.depreciateyear * (p.enddate - p.startdate)) ELSE 0 END) >= p.startdate AND t.date <= p.enddate AND
      c.type <> 'O' AND a.domain = ${params.domain} AND (
      (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
      (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))
  GROUP BY c.id, c.type, c.description,c.depreciateyear, p.startdate, p.enddate
  ORDER BY CASE c.type WHEN 'A' THEN 1 WHEN 'C' THEN 2 WHEN 'R' THEN 0 ELSE 3 END, description COLLATE NOCASE ASC`) {
        switch (code.type) {
          case 'R':
          case 'B':
            profit += code.tamount;
            break;
          case 'C':
          case 'A':
            profit -= code.tamount;
            break;

        }

        codeHeader(code, doc, profit);
        let even = false;
        let cumulative = 0;   
        let continueAdded = false;
        let transactionDone = false;
        for(const transaction of db.iterate`WITH p(startdate, endDate) AS (Select ${start} AS StartDate, ${end} AS Endate)
SELECT t.id,t.date,t.version, t.src, t.srccode, t.dst, t.dstcode,t.description, t.rno, t.repeat, 
    t.dfamount * CASE WHEN c.type = 'B' AND c.id = t.srccode THEN -1 ELSE 1 END as amount, 
    0 as srcclear, 0 AS dstclear, 0 AS reconciled, 1 as trate, cu.name AS currency, 0 AS version,
    CASE WHEN c.type = 'A' THEN CAST((CAST(t.dfamount AS REAL) / c.depreciateyear) *
        CASE WHEN t.date BETWEEN  p.startdate AND p.enddate 
            THEN CAST((p.enddate - t.date)AS REAL)/(p.enddate - p.startdate)
        WHEN t.date + (c.depreciateyear * (p.enddate - p.startdate)) BETWEEN p.startdate AND p.enddate 
            THEN CAST((t.date + (c.depreciateyear * (p.enddate - p.startdate)) - p.startdate) AS REAL)/ (p.enddate - p.startdate)
        ELSE 1 END 
     AS INTEGER) ELSE 0 END As depreciation
    FROM dfxaction t, currency cu, p, 
    code c JOIN account a ON (a.name = t.src AND t.srccode = c.id) OR (a.name = t.dst AND t.dstcode = c.id)
    WHERE cu.priority = 0 AND t.date BETWEEN p.startdate - CASE WHEN c.type = 'A' THEN (c.depreciateyear * (p.enddate - p.startdate)) ELSE 0 END AND p.enddate
    AND a.domain = ${params.domain} AND c.id =  ${code.id} ORDER BY t.date`) {
          doc.x = LEFT_EDGE;

          if (doc.y > PAGE_BOTTOM && transactionDone) {
            doc.y = PAGE_POSITION;             
            doc.text(`Page: ${pageNo}`, { align: 'center' });
            pageNo++;
            doc.addPage();
            doc.fontSize(12).text(`Domain: ${params.domain} in ${params.year}`, { align: 'center' });
            doc.fontSize(10).moveDown(2);
            even = false;
            if (!continueAdded) {
              code.description += ' (Continued)';
              continueAdded = true;
            }
            codeHeader(code,doc,profit);
          }
          let y = doc.y;
          if (transaction.src !== null && transaction.dst !== null) {
            doc.font('Helvetica-Bold');
          }
          const ht = doc.heightOfString(transaction.description, { width: DESC_WIDTH })
          const h = Math.max(Math.ceil(ht), 12) + 4;
          const dy = (h - ht) / 2;
          if (even) {

            doc.rect(LEFT_EDGE, y, RIGHT_EDGE - LEFT_EDGE, h).fillAndStroke('aliceblue')
            doc.moveTo(DATE_REF_LINE, y).lineTo(DATE_REF_LINE, y + h).stroke('white');
            doc.moveTo(REF_DESC_LINE, y).lineTo(REF_DESC_LINE, y + h).stroke();
            doc.moveTo(DESC_AMOUNT_LINE, y).lineTo(DESC_AMOUNT_LINE, y + h).stroke()
            doc.moveTo(AMOUNT_TOTAL_LINE, y).lineTo(AMOUNT_TOTAL_LINE, y + h).stroke();

            doc.fillColor('black').strokeColor('black');

          }
          y += dy;
          even = !even;
          
          if (transaction.repeat !== 0) {
            doc.rect(LEFT_EDGE, y - dy, DATE_AREA_WIDTH, h).fillAndStroke('yellow'); //date
            doc.fillColor('black').strokeColor('black');
          }
          doc.text(dbDateToString(transaction.date), DATE_POSITION, y, { width: DATE_WIDTH, align: 'right' });
          doc.text(blankIfNull(transaction.ref), REF_POSITION, y, { width: REF_WIDTH, height: h - 4 });
          doc.text(transaction.description, DESC_POSITION, y, { width: DESC_WIDTH, height: h -4 });
          if (code.type === 'A') {
            doc.fillColor('red').strokeColor('red');
            doc.text((transaction.amount/100).toFixed(2), DEPRECIATION_POSITION, y, {width: AMOUNT_WIDTH, align: 'right'});
            doc.fillColor('black').strokeColor('black');          
            doc.text((transaction.depreciation / 100).toFixed(2), AMOUNT_POSITION, y, { width: AMOUNT_WIDTH, align: 'right' });
          } else {
            doc.text((transaction.amount / 100).toFixed(2), AMOUNT_POSITION, y, { width: AMOUNT_WIDTH, align: 'right' });
          }
          cumulative += code.type === 'A' ? transaction.depreciation: transaction.amount;  
          doc.text((cumulative/100).toFixed(2), TOTAL_POSITION,y,{width: AMOUNT_WIDTH, align: 'right'});
          y += (h - dy);
          doc.x = LEFT_EDGE;
          doc.y = y;
          doc.font('Helvetica'); 
          transactionDone = true;        
        }
      }
      codeHeader({description: 'Profit'},doc,profit)
      doc.y = PAGE_POSITION;
      doc.text(`Page: ${pageNo}`, { align: 'center' });
      throw new Error('Rollback'); //force a rollback
    })();
  } catch (e) {
    //expected - rollback
    if (e.message !== 'Rollback') {
      throw e;
    }
  }


};
