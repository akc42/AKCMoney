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

  const debug = require('debug')('money:xactionamount');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name );
    const getXactionVersion = db.prepare(`SELECT t.version, t.currency, tc.rate AS trate, sa.currency AS scurrency, 
      sc.rate AS srate, da.currency AS dcurrency, dc.rate AS drate
      FROM xaction AS t JOIN currency AS tc ON t.currency = tc.name
      LEFT JOIN account AS sa ON t.src = sa.name LEFT JOIN currency AS sc ON sa.currency = sc.name
      LEFT JOIN account AS da ON t.dst = da.name LEFT JOIN currency AS dc ON da.currency = dc.name
      WHERE id = ?`);
    const updateXaction = db.prepare(`UPDATE xaction SET version = version + 1 ,
        srcamount = ?, dstamount = ?, amount = ? WHERE id = ?`);
    const getUpdatedXaction = db.prepare(`SELECT t.*, tc.rate AS trate, c.type As ctype, c.description AS cd,
    CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled
    FROM account a JOIN xaction t ON(t.src = a.name OR t.dst = a.name)
    LEFT JOIN code c ON c.id = CASE WHEN t.src = a.name THEN t.srccode ELSE t.dstcode END
    LEFT JOIN currency tc ON tc.name = t.currency
    WHERE t.id = ?`)
    db.transaction(() => {
      const {version, currency, trate, scurrency, srate, dcurrency, drate} = getXactionVersion.get(params.id);
      if (version === params.version) {
        updateXaction.run(
          scurrency !== null && scurrency !== currency ? Math.round(params.amount * srate/trate) : null, 
          dcurrency !== null && dcurrency !== currency ? Math.round(params.amount * drate/trate) : null, 
          params.amount, 
          params.id
        );
        responder.addSection('status', 'OK');
        responder.addSection('transaction', getUpdatedXaction.get(params.id));
      } else {
        responder.addSection('status', 'Fail');
      }
    })();
    debug('request complete');
    
  };
})();