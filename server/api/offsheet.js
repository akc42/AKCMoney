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
import Debug from 'debug';
import DB from '@akc42/sqlite-db';
const db = DB();

const debug = Debug('money:offsheet');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with codeid', params.code );

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
    responder.addSection('transactions', getXactions.all(user.uid, params.code));
  })();  

  debug('request complete');
};
