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

(function() {
  'use strict';

  const debug = require('debug')('money:useradmin');
  const db = require('@akc42/sqlite-db');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name, 'for user uid', params.uid, 'isAdmin', params.isAdmin );
    const getVersion = db.prepare('SELECT version FROM user WHERE uid = ?').pluck();
    const updateUser = db.prepare('UPDATE user SET version = version + 1, isAdmin = ? WHERE uid = ?');
    const insertCapability = db.prepare('REPLACE INTO capability(uid, domain) VALUES(?,?)');
    const deleteCapability = db.prepare('DELETE FROM capability WHERE uid = ? ');
    const getUsers = db.prepare(`SELECT u.uid, u.version, u.name, u.isAdmin, u.domain AS defaultdomain, c.domain FROM user u LEFT JOIN capability c ON u.uid = c.uid
    ORDER BY u.name, u.uid`);
    db.transaction(() => {
      const v = getVersion.get(params.uid);
      if (v === params.version) {
        updateUser.run(params.isAdmin, params.uid);
        if (params.isAdmin === 1) {
          debug('deleting capabilities');
          deleteCapability.run(params.uid);
        } else {
          for(const domain of params.domains) {
            debug('insert capability for domain', domain)
            insertCapability.run(params.uid,domain);
          }
        }
        responder.addSection('status', 'OK');
        responder.addSection('users', getUsers.all())
      } else {
        debug('failed with version error');
        responder.addSection('status', `User Name version Error Disk:${v}, Param:${params.version}`);
      }
      
    })();
    debug('request complete')
  };
})();