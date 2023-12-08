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

const debug = Debug('money:usercapability');

export default async function(user, params, responder) {
  debug('new request from', user.name, 'with params', params );
  const getVersion = db.prepare('SELECT version FROM user WHERE uid = ?').pluck();
  const getCapability = db.prepare('SELECT COUNT(*) FROM capability WHERE uid = ? AND domain = ?').pluck();
  const insertCapability = db.prepare('INSERT INTO capability(uid, domain) VALUES(?,?)');
  const deleteCapability = db.prepare('DELETE FROM capability WHERE uid = ? AND domain = ?');
  const deletePriority = db.prepare('DELETE FROM priority WHERE uid = ? AND domain = ?');
  const getUsers = db.prepare(`SELECT u.uid, u.version, u.name, u.isAdmin, u.domain AS defaultdomain, c.domain FROM user u LEFT JOIN capability c ON u.uid = c.uid
  ORDER BY u.name, u.uid`);
  db.transaction(() => {
    const v = getVersion.get(params.uid);
    if (v === params.version) {
      const hasCapability = getCapability.get(params.uid, params.domain);
      if (params.state && hasCapability === 0) {
        insertCapability.run(params.uid, params.domain);
      } else if (!params.state) {
        deleteCapability.run(params.uid,params.domain);
        deletePriority.run(params.uid, params.domain);
      }
      responder.addSection('status', 'OK');
      responder.addSection('users', getUsers.all());

    } else {
      responder.addSection('status', `User Capability version Error Disk:${v}, Param:${params.version}`);
    }
    
  })();
  debug('request complete')
};
