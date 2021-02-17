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

process.env.DATABASE_DB = 'money-test.db';
process.env.DATABASE_DB_PIN = "no" ;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../', 'money.env') });
process.env.MONEY_DOMAIN = 'mondev.chandlerfamily.org.uk'; //set for testing
const db = require('@akc42/sqlite-db');
const PlaywrightEnvironment = require('jest-playwright-preset/lib/PlaywrightEnvironment').default
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt');

class CustomEnvironment extends PlaywrightEnvironment {
  async setup() {
    await super.setup()
    
    const getPassword = db.prepare('SELECT password FROM user WHERE uid = 1').pluck();
    if (getPassword.get() === null) {
      const hashedPassword = await bcrypt.hash('test', 10);
      const updatePassword = db.prepare('UPDATE user SET password = ? WHERE uid = 1');
      updatePassword.run(hashedPassword);
    }
    this.global.database = db;
    this.global.makeCookie = (user) => {
      const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
      let expires = -1;
      let authcookie;
      let v;
      const payload = { ...user, password: !!user.password };
      db.transaction(() => {
        if (user.remember) {
          const date = new Date();
          date.setTime(date.getTime() + (s.get('token_expires') * 60 * 60 * 1000));
          payload.exp = Math.round(date.getTime() / 1000);
          expires = payload.exp;
        }
        v = jwt.encode(payload, `AKCMoney${ s.get('token_key').toString()}`);
        authcookie = s.get('auth_cookie');
      })();
      return {
        name: authcookie,
        value: v,
        path: '/',
        domain: process.env.MONEY_DOMAIN,
        expires: expires,
        httpOnly: false,
        secure: false,
        sameSite: 'None'
      }

    }
  }

}

module.exports = CustomEnvironment