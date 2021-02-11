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
  process.env.DATABASE_DB='money-test.db';
  const server = require('../server/server.js');
  const startPromise = server.startUp();
  const jwt = require('jwt-simple');
  const db = require('@akc42/server-utils/database');
  const updatePassword = require('../server/api/profile');
  startPromise.then(() => {
    //we need our admin user to have a password of test.
    const getPassword = db.prepare('SELECT password FROM user WHERE uid = 1').pluck();
    if (getPassword.get() === null) {
      updatePassword(
        {name:'Admin',uid:1, version: 1},
        {password: 'test',replica: 'test', name:'Admin', account: 'Cash'}, 
        {addSection: (name, value) => {
          console.log('user updated to ', value)
        }, },
        () => {}
      );
    }
  });

  module.exports = {
    server: {
      start: startPromise,
      close: server.close
    },
    database: db,
    cookie: function(user) {
      let expires = -1;
      const serverConfig = server.config();
      const payload = {...user, password: !!user.password};
      if (user.remember) {
        const date = new Date();
        date.setTime(date.getTime() + (serverConfig.tokenExpires * 60 * 60 * 1000));
        payload.exp = Math.round(date.getTime() / 1000);
        expires = payload.exp;

      }
      const v = jwt.encode(payload, serverConfig.tokenKey)
      return {
        name:serverConfig.authCookie,
        value:v,
        path: '/',
        domain: process.env.MONEY_DOMAIN,
        expires: expires,
        httpOnly: false,
        secure: false,
        sameSite: 'None'
      }
    }
  };
})();