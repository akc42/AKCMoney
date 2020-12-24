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

(function() {
  'use strict';

  const debug = require('debug')('money:xactionupdate');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name, 'for transaction', params.id );
    const getXactionVersion = db.prepare(`SELECT version, src, dst FROM xaction WHERE id = ?`);
    const swapSrcDst = db.prepare(`UPDATE xaction SET src = dst, dst = src, srcclear = dstclear, dstclear = srcclear,
        srccode = dstcode, dstcode = srccode, srcamount = dstamount, dstamount = srcamount   WHERE id = ?`);
    const updateXactionSrc = db.prepare(`UPDATE xaction SET version = version + 1, amount = ?, srcamount = ?, srcclear = ?, srccode = ?,
      currency = ?, date = ?, description = ? , rno = ?, repeat = ?, dst = ?  WHERE id = ?`);
    const updateXactionDst = db.prepare(`UPDATE xaction SET version = version + 1, amount = ?, dstamount = ?, dstclear = ?, dstcode = ?,
      currency = ?, date = ?, description = ? , rno = ?, repeat = ?, src = ?  WHERE id = ?`);
    const getUpdatedXaction = db.prepare(`SELECT t.*, tc.rate AS trate, c.type As ctype, c.description AS cd,
    CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled
    FROM account a JOIN xaction t ON(t.src = a.name OR t.dst = a.name)
    LEFT JOIN code c ON c.id = CASE WHEN t.src = a.name THEN t.srccode ELSE t.dstcode END
    LEFT JOIN currency tc ON tc.name = t.currency
    WHERE t.id = ?`);
    db.transaction(() => {
      const tid = parseInt(params.id, 10);
      const {version, src, dst} = getXactionVersion.get(tid);
      if (version === parseInt(params.version,10)) {
        if (params.type = 'src') {
          debug('type src - source account', src, 'account', params.account);
          if (params.account !== src) swapSrcDst.run(tid); //we have to swap first
          updateXactionSrc.run(
            Math.round(Number(params.amount) * 100),
            params.accountamount !== undefined ? Math.round(Number(params.accountamount) * 100) : null,
            params.cleared !== undefined ? 1 : 0,
            params.code.length > 0 ? parseInt(params.code,10) : null, 
            params.currency,
            parseInt(params.date,10),
            params.description,
            params.rno,
            parseInt(params.repeat,10),
            params.alt.length > 0 ? params.alt : null,
            tid
          );
        } else {
          debug('type dst - dst account', dst, 'account', params.account);
          if (params.account !== dst) swapSrcDst.run(tid); //we have to swap first
          updateXactionDst.run(
            Math.round(Number(params.amount) * 100),
            params.accountamount !== undefined ? Math.round(Number(params.accountamount) * 100) : null,
            params.cleared !== undefined ? 1 : 0,
            params.code.length > 0 ? parseInt(params.code, 10) : null,
            params.currency,
            parseInt(params.date, 10),
            params.description,
            params.rno,
            parseInt(params.repeat, 10),
            params.alt.length > 0 ? params.alt : null,
            tid
          );

        }
        responder.addSection('status', 'OK');
        responder.addSection('transaction', getUpdatedXaction.get(tid));
      } else {
        debug('params version', params.version, 'database version', version,'tid', tid);
        responder.addSection('status', 'Fail');
      }
    })();
    debug('request complete')
  };
})();