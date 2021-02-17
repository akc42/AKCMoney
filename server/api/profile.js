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

  const debug = require('debug')('money:profile');
  const db = require('@akc42/sqlite-db');
  const bcrypt = require('bcrypt');

  module.exports = async function(user, params, responder, genCook) {
    debug('new request from', user.name );
    const checkName = db.prepare('SELECT COUNT(*) FROM user WHERE name = ?').pluck();
    const getUser = db.prepare('SELECT * FROM user WHERE uid = ?');
    const updateUser = db.prepare('UPDATE user SET name = ?, password = ?, account = ?, domain = ?, version = ? WHERE uid = ?');
    let status = 'OK'; //start out as all good
    let hashedPassword = null;
    if (params.password.length > 0 ) {
      if (params.replica === params.password) {
        hashedPassword = await bcrypt.hash(params.password, 10);
      } else {
        status = 'different' //password and replica don't match
      }
    }
    if (status === 'OK') {
      db.transaction(() => {
        const dbUser = getUser.get(user.uid);
        if (dbUser.version === user.version) {
          let no = 0;
          if (dbUser.name.toLowerCase() !== params.name.toLowerCase()) {
            //user has changed is name (other than just the case), so check its not already in use
            no = checkName.run(params.name);
          }
          if (no === 0) {
            updateUser.run(
              params.name, 
              hashedPassword === null ? dbUser.password: hashedPassword, 
              params.account, 
              params.domain, 
              dbUser.version + 1,
              user.uid
            );
            dbUser.name = params.name;
            dbUser.password = hashedPassword === null ? !!dbUser.password : true;
            dbUser.account = params.account;
            dbUser.domain = params.domain;
            dbUser.remember = user.remember || (!user.password && dbUser.password); //
            genCook(dbUser);
            responder.addSection('user', dbUser);
          } else {
            status = 'name'; //can't change name
          }

        } else {
          status = 'parallel'; //there hasbeen a parallel update
        }
      })();
    } 
    responder.addSection('status', status);
    
  };
})();