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

const debug = Debug('offsheetlist');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const getList = db.prepare(`SELECT c.id,c.description FROM code c INNER JOIN xaction t ON t.id = (
          SELECT x.id FROM user u,xaction x INNER JOIN account a ON (x.src = a.name AND x.srccode = c.id) 
          OR (x.dst = a.name AND x.dstcode = c.id) LEFT JOIN capability p ON p.uid = u.uid 
          AND p.domain = a.domain WHERE u.uid = ? AND (u.isAdmin = 1 OR p.uid IS NOT NULL) LIMIT 1)
      WHERE c.type = 'O';`)
  db.transaction(() => {
    responder.addSection('offsheet', getList.all(user.uid))
  })();
  debug('request complete')
};
