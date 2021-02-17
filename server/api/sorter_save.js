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

  const debug = require('debug')('money:sortersave');
  const db = require('@akc42/sqlite-db');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name, 'with domain', params.domain );
    const deletePriorities = db.prepare('DELETE FROM priority WHERE uid = ? AND domain = ?');
    const insertPriority = db.prepare('INSERT INTO priority(uid,domain,account,sort) VALUES (?,?,?,?)')
    db.transaction(() => {
      deletePriorities.run(user.uid, params.domain);
      for(const account of params.accounts) {
        debug('insert new priority', account.name, account.sort);
        insertPriority.run(user.uid,params.domain,account.name,account.sort);
      }
      
    })();
    debug('request complete')
  };
})();