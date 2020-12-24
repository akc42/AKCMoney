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

(function() {
  'use strict';

  const debug = require('debug')('money:accountstartdate');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name, 'account', params.account, 'startdate', params.startdate);
    const getVersion = db.prepare('SELECT dversion FROM account WHERE name = ?').pluck();
    const updateSD = db.prepare('UPDATE account SET dversion = dversion + 1, startdate = ? WHERE name = ?');
    db.transaction(() => {
      const dversion = getVersion.get(params.account);
      if (dversion === params.dversion) {
        debug('correct version, do update');
        updateSD.run(params.startdate, params.account);
        responder.addSection('status', 'OK');
      } else {
        debug('versions do not match, param dversion:',params.dversion, 'database dversion', dversion);
        responder.addSection('status', 'Fail');
      }
    })();
    debug('Request Complete');
  };
})();