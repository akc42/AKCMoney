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

 const debug = Debug('money:domain_range');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const range = db.prepare(`SELECT MAX(t.date) as maxdate, MIN(t.date) As mindate FROM xaction t
    LEFT JOIN account sa ON sa.name = t.src LEFT JOIN account da ON sa.name = t.dst  
    WHERE sa.domain = ? OR da.domain = ?`);
  db.transaction(() => {
    const {mindate, maxdate} = range.get(params.domain, params.domain);
    responder.addSection('min', mindate);
    responder.addSection('max', maxdate);
  })();
  debug('request complete')
};
