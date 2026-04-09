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

const logger = Logger('currencydisplay','error');

export default async function(user, params, responder) {
  mdb.transaction(db => {
    const {version} = db.get`SELECT version FROM currency WHERE name = ${params.name}`??{version:0}
    if (version === params.version) {
      db.run`UPDATE currency SET version = version + 1, display = ${params.display}, priority = ${params.priority} WHERE name = ${params.name}`;
      responder.addSection('status', 'OK');
    } else {
      responder.addSection('status', `Version Error Disk:${version}, Param:${params.version}`);
      logger(`Version Error Disk:${version}, Param:${params.version}`)
    }
    
  });
};
