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

const logger = Logger('currencydefault','error');

export default async function(user, params, responder) {
  
  mdb.transaction(db => {
    const {defcount} = db.get`SELECT Count(*) AS defcount FROM currency WHERE priority = 0`??{defcount:0};
    if (defcount === 0) {
      const {version} =db.get`SELECT version FROM currency WHERE name = ${params.name}`??{version:0};
      if (version === params.version) {
        db.run`UPDATE currency SET version = version + 1, rate = 1.0, display = 1, priority = 0 WHERE name = ${params.name}`;
        responder.addSection('status', 'OK');
      } else {
        responder.addSection('status', `Version Error Disk:${v}, Param:${params.version}`);
        logger(`Version Error Disk:${v}, Param:${params.version}`)
      }
    } else {
      responder.addSection('status', 'Still another currency with priority 0');
    }
  });
};
