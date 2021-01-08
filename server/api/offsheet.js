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

  const debug = require('debug')('money:offsheet');
  const db = require('@akc42/server-utils/database');

  module.exports = async function(user, params, responder) {
    debug('new request from', user.name );
    const offsheets = db.prepare(`SELECT c.id,c.description FROM code c WHERE c.type = 'O'
      AND EXISTS (SELECT x.id FROM user u,xaction x INNER JOIN account a ON (x.src = a.name AND x.srccode = c.id) 
      OR (x.dst = a.name AND x.dstcode = c.id) LEFT JOIN capability p ON p.uid = u.uid AND p.domain = a.domain 
      WHERE a.domain = ? AND u.uid = ? AND (u.isAdmin = 1 OR p.uid IS NOT NULL))`).all(params.domain, user.uid);
    responder.addSection('offsheet', offsheets);
    debug('request complete');
  };
})();