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

  const debug = require('debug')('money:standing');
  const db = require('@akc42/sqlite-db');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name );
    const getCurrencies= db.prepare('SELECT * FROM currency WHERE display = 1 ORDER BY priority ASC');
    const getCodes = db.prepare(`SELECT * FROM code 
      ORDER BY CASE type WHEN 'C' THEN 0 WHEN 'O' THEN 2 ELSE 1 END, type, description COLLATE NOCASE ASC`);
    const getRepeats = db.prepare('SELECT rkey,description FROM repeat ORDER BY priority');

    db.transaction(() => {
      debug('add currency and codes');
      responder.addSection('currencies', getCurrencies.all());
      responder.addSection('codes', getCodes.all());
      responder.addSection('repeats', getRepeats.all());
    })();
    debug('request complete');
  };
})();
