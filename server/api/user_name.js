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

const logger = Logger('username','error');

export default async function(user, params, responder) {
  await mdb.transactionAsync(async db => {
    const {version} = db.get`SELECT version FROM user WHERE uid = ${params.uid}`??{version:0}
    if (version === params.version) {
      const {no} = db.get`SELECT COUNT(*) AS no FROM user WHERE name = ${params.name}`??{no:0};
      if (no === 0) {
        db.run`UPDATE user SET version = version + 1, name = ${params.name} WHERE uid = ${params.uid}`;
        responder.addSection('users')
        for(const user of db.iterate`SELECT u.uid, u.version, u.name, u.isAdmin, u.domain AS defaultdomain, c.domain FROM user u 
          LEFT JOIN capability c ON u.uid = c.uid ORDER BY u.name, u.uid`) {
          await responder.write(user);
        }
        responder.addSection('status', 'OK');
      } else {
        responder.addSection('status', `User Name name ${params.name} is not unique`);
      }
    } else {
      responder.addSection('status', `User Name version Error Disk:${version}, Param:${params.version}`);
      logger(`Version Error Disk:${version}, Param:${params.version}`)
    }
    
  });
};
