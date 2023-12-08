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

const debug = Debug('money:domainname');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const getVersion = db.prepare('SELECT version FROM domain WHERE name = ?').pluck();
  const updateName = db.prepare('UPDATE domain SET version = version + 1, name = ? WHERE name = ?');
  const getDomains = db.prepare('SELECT * FROM domain ORDER BY name');
  db.transaction(() => {
    //first check new name does not exist
    const v = getVersion.get(params.new);
    if (v === undefined) {
      const v = getVersion.get(params.old);
      if (v === params.version) {
        updateName.run(params.new, params.old);
        responder.addSection('status', 'OK');
        responder.addSection('domains', getDomains.all());
      } else {
        responder.addSection('status', `Version Error Disk:${v}, Param:${params.version}`)
      }
    } else {
      responder.addSection('status', 'Duplicate Name Error')
    }
  })();
  debug('request complete')
};
