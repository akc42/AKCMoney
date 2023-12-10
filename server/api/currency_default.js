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
import DB from '@akc42/sqlite-db';
const db = DB();

const debug = Debug('money:currencydefault');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const getVersion = db.prepare('SELECT version FROM currency WHERE name = ?').pluck();
  const getDefault = db.prepare('SELECT Count(*) FROM currency WHERE priority = 0').pluck();
  const updateCurrency = db.prepare('UPDATE currency SET version = version + 1, rate = 1.0, display = 1, priority = 0 WHERE name = ?');
  db.transaction(() => {
    const defCount = getDefault.get();
    if (defCount === 0) {
      const v = getVersion.get(params.name);
      if (v === params.version) {
        responder.addSection('status', 'OK');
        updateCurrency.run(params.name);
      } else {
        responder.addSection('status', `Version Error Disk:${v}, Param:${params.version}`)
      }
    } else {
      responder.addSection('status', 'Still another currency with priority 0');
    }
  })();
  debug('request complete')
};
