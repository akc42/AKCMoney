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

const debug = Debug('money:setcurrency');

export default async function(user, params, responder) {
  debug('new request from', user.name , 'with params', params);
  const getVersion = db.prepare('SELECT version FROM currency WHERE name = ?').pluck();
  const updateRate = db.prepare('UPDATE currency SET version = version + 1, rate = ? WHERE name = ?');
  db.transaction(() => {
    const version = getVersion.get(params.name);
    if (version === params.version) {
      updateRate.run(params.rate, params.name);
      responder.addSection('status', 'OK');
      responder.addSection('name', params.name)
      responder.addSection('rate', params.rate);
      responder.addSection('versions', version + 1 );
    } else {
      debug('db version', version, 'api version', params.version);
      responder.addSection('status', 'fail');
    }
  })()
  
};
