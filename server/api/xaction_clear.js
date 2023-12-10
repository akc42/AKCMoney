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

const debug = Debug('money:xactionclear');

export default async function(user, params, responder) {
  debug('new request from', user.name );
  const getXactionVersion = db.prepare('SELECT version FROM xaction WHERE id = ?').pluck();
  const updateXaction = db.prepare(`UPDATE xaction AS x SET version = t.version + 1, 
    srcclear = CASE WHEN a.name = t.src THEN ? ELSE t.srcclear END,
    dstclear = CASE WHEN a.name = t.dst THEN ? ELSE t.dstclear END   
    FROM xaction t JOIN account a ON (a.name = t.src OR a.name = t.dst) WHERE x.id = ? AND t.id = ? AND a.name = ?`);
  const getUpdatedXaction = db.prepare(`SELECT t.*, tc.rate AS trate, 
  CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
  CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
  FROM account a JOIN xaction t ON(t.src = a.name OR t.dst = a.name)
  LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
  LEFT JOIN currency tc ON tc.name = t.currency
  WHERE t.id = ? AND a.name = ?`)
  db.transaction(() => {
    const version = getXactionVersion.get(params.id);
    debug('db version', version, 'params version', params.version, 'xaction', params.id);
    if (version === params.version) {
      debug('do update; clear =', params.clear);
      updateXaction.run(params.clear ? 1: 0, params.clear ? 1: 0, params.id, params.id, params.account);
      responder.addSection('status', 'OK'); 
      responder.addSection('transaction', getUpdatedXaction.get(params.id, params.account))
    } else {
      responder.addSection('status', 'Fail');
    }
  })();
  debug('request complete');
  
};
