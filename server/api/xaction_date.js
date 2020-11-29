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

  const debug = require('debug')('money:xactiondate');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name );
    const getXactionVersion = db.prepare('SELECT version FROM xaction WHERE id = ?').pluck();
    const updateXaction = db.prepare('UPDATE xaction SET version = version + 1, date = ? WHERE id = ?');
    db.transaction(() => {
      const version = getXactionVersion.get(params.id);
      if (version === params.version) {
        updateXaction.run(params.date, params.id);
        responder.addSection('status', 'OK');
      } else {
        responder.addSection('status', 'Fail');
      }
    })();
    debug('request complete');
    
  };
})();