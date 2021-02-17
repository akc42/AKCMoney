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

  const debug = require('debug')('money:accountdomain');
  const db = require('@akc42/sqlite-db');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name, 'with params', params );
    const getVersion = db.prepare('SELECT dversion FROM account WHERE name = ?').pluck();
    const updateDomain = db.prepare('UPDATE account SET dversion = dversion + 1, domain = ? WHERE name = ?');
    const getAccounts = db.prepare('SELECT name, domain, currency, archived, dversion FROM account ORDER BY archived, domain, name');
    db.transaction(() => {
      //first version is still the same
      const v = getVersion.get(params.name);
      if (v === params.dversion) {
        updateDomain.run(params.domain, params.name);
        responder.addSection('status', 'OK');
        responder.addSection('accounts', getAccounts.all())
      } else {
        responder.addSection('status',`Version Error Disk:${v}, Param:${params.dversion}`)
      }
    
    })();
    debug('request complete')
  };
})();