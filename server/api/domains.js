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

  const debug = require('debug')('money:domains');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user,p ,responder) {
    debug('new request from', user.name);
   
    const getDomains = db.prepare('SELECT * FROM domain ORDER BY name');
    db.transaction(() => {
      responder.addSection('domains', getDomains.all());
    })();
    debug('request complete')
  };
})();