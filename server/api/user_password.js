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
import {Logger} from '@akc42/server-utils';
import mdb from '@akc42/sqlite-db';

const logger = Logger('userpassword','error');

export default async function(user, params, responder) {
  const getVersion = db.prepare('SELECT version FROM user WHERE uid = ?').pluck();
  const updateUser = db.prepare('UPDATE user SET password = NULL WHERE uid = ?');
  mdb.transaction(db => {
    const {version} = db.get`SELECT version FROM user WHERE uid = ${params.uid}`??{version:0}
    if (version === params.version) {
      db.run`UPDATE user SET password = NULL WHERE uid = ${user.uid}`
      responder.addSection('status', 'OK');
    } else {
      responder.addSection('status', `User Name version Error Disk:${v}, Param:${params.version}`);
      logger(`Version Error Disk:${v}, Param:${params.version}`);
    }
    
  });
};
