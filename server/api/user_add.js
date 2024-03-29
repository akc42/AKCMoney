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

const debug = Debug('money:useradd');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const insertUser = db.prepare('INSERT INTO user(name, isAdmin) VALUES(?,?)');
  const addCapability = db.prepare('INSERT INTO capability(uid,domain) VALUES(?,?)');
  const getUsers = db.prepare(`SELECT u.uid, u.version, u.name, u.isAdmin, u.domain AS defaultdomain, c.domain FROM user u LEFT JOIN capability c ON u.uid = c.uid
  ORDER BY u.name, u.uid`);
  db.transaction(() => {
    const { lastInsertRowid } = insertUser.run(params.name, params.isAdmin);
    if (params.isAdmin !== 1) {
      for (const domain of params.domains) {
        addCapability.run(lastInsertRowid, domain);
      }
    }
    responder.addSection('users', getUsers.all())
  })();
  debug('request complete')
};
