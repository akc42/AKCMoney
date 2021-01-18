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

  const debug = require('debug')('money:domainxactions');
  const db = require('@akc42/server-utils/database');
  const {insertRepeats} = require('../utils');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name, 'with params', params );
    const insertRepeat = db.prepare(`INSERT INTO xaction (date, src, dst, srcamount, dstamount, srccode,dstcode,  rno ,
      repeat, currency, amount, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`);
    const updateRepeat = db.prepare('UPDATE xaction SET version = (version + 1) , repeat = 0 WHERE id = ? ;');
    const getXactions = db.prepare(`SELECT t.id,t.date,t.version, t.src, t.srccode, t.dst, t.dstcode,t.description, t.rno, t.repeat, 
      t.dfamount * CASE WHEN c.type = 'B' AND c.id = t.srccode THEN -1 ELSE 1 END as amount, 
      0 as srcclear, 0 AS dstclear, 0 AS reconciled, 1 as trate, cu.name AS currency, 0 AS Version
      FROM dfxaction t,
      currency cu, 
      code c JOIN account a ON (a.name = t.src AND t.srccode = c.id) 
      OR (a.name = t.dst AND t.dstcode = c.id)
      WHERE cu.priority = 0 AND t.date BETWEEN ?- CASE WHEN c.type = 'A' THEN 63072000 ELSE 0 END AND ? 
      AND a.domain = ? AND c.id = ? ORDER BY t.date`);
    const repeatCount = db.prepare(`SELECT COUNT(*) FROM xaction t, account a, code c   
    WHERE
        t.repeat <> 0 AND
        t.date <= ? AND
        c.id = ? AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`)
      .pluck().bind(params.end, params.code, params.domain);
    const repeats = db.prepare(`SELECT t.* FROM xaction t, account a, code c WHERE
        t.repeat <> 0 AND
        t.date <= ? AND
        c.id = ? AND
        a.domain = ? AND (
        (t.src IS NOT NULL AND t.src = a.name AND srccode IS NOT NULL AND t.srccode = c.id) OR
        (t.dst IS NOT NULL AND t.dst = a.name AND t.dstcode IS NOT NULL AND t.dstcode = c.id))`)
        .bind(params.end, params.code, params.domain);;
    try {
      db.transaction(() => {
        insertRepeats(repeatCount,repeats,insertRepeat, updateRepeat);
        responder.addSection('transactions',getXactions.all(params.start,params.end,params.domain, params.code));
        throw new Error('Rollback');
      })();
    } catch (e) {
      //expected - rollback
      if (e.message !== 'Rollback') {
        debug('Rollback error', e);
        throw e;
      }
    }
    debug('request complete')
  };
})();