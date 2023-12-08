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
import Debug from 'debug';
import db from '@akc42/sqlite-db';

const debug = Debug('money:validate');

export default async function(user, params, responder, genCook) {
  debug('new request from', user.name );
  const updatedUser = db.prepare(`SELECT * FROM user WHERE uid = ?`).get(user.uid);
  updatedUser.password = !!updatedUser.password; //hide actual value
  updatedUser.remember = user.remember; //Not a database field
  if (user.version !== updatedUser.version || user.name !== updatedUser.name || 
    user.password !== updatedUser.password || user.account !== updatedUser.account || user.domain !== updatedUser.domain ||
    user.isAdmin !== updatedUser.isAdmin) {
      genCook(updatedUser); //Need to make a new cookie as the value has changed
  }
  responder.addSection('user', updatedUser);
};
