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
import {Debug} from '@akc42/server-utils';
import DB from '@akc42/sqlite-db';
const db = DB();

const debug = Debug('domainadd');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const getVersion = db.prepare('SELECT version FROM domain WHERE name = ?').pluck();
  const insertDomain = db.prepare(`INSERT INTO domain(name, description) VALUES(?,?)`);
  const getDomains = db.prepare('SELECT * FROM domain ORDER BY name');
  db.transaction(() => {
    const v = getVersion.get(params.name);
    if (v === undefined) {
      insertDomain.run(params.name, params.description);
      responder.addSection('status','OK');
      responder.addSection('domains', getDomains.all());

    } else {
      responder.addSection('status', `Name already in use ${params.name}`)
    }
  })();
  debug('request complete')
};
