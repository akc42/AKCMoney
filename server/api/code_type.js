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
import {Debug, logger} from '@akc42/server-utils';
import DB from '@akc42/sqlite-db';
const db = DB();

const debug = Debug('codetype');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const getVersion = db.prepare('SELECT version FROM code WHERE id = ?').pluck();
  const updateType = db.prepare('UPDATE code SET version = version + 1, type = ? WHERE id = ?');
  const getCodes = db.prepare(`SELECT * FROM code 
    ORDER BY CASE type WHEN 'A' THEN 2 WHEN 'B' THEN 0 WHEN 'C' THEN 3 WHEN 'R' THEN 1 ELSE 4 END,
    description COLLATE NOCASE ASC`);
  db.transaction(() => {
    const v = getVersion.get(params.id);
    if (v === params.version) {
      updateType.run(params.type, params.id);
      responder.addSection('status', 'OK');
      responder.addSection('codes', getCodes.all());
    } else {
      responder.addSection('status', `Version Error Disk:${v}, Param:${params.version}`);
      logger('error', `Code Type Version Error Disk:${v}, Param:${params.version}`)
    }

  })();
  debug('request complete')
};
