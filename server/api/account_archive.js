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

const logger = Logger('accountarchive','Error');

export default async function(user, params, responder) {

  await mdb.transactionAsync(async db => {
    const {dversion} = db.get`SELECT dversion FROM account WHERE name = ${params.name}`??{dversion:0}
    const v = getVersion.get(params.name);
    if (params.dversion === dversion) {
      db.run`UPDATE account SET dversion = dversion + 1, archived = ${params.archive ? 1:0} WHERE name = ${params.name}`;
      responder.addSection('accounts');
      for(const account of db.iterate`SELECT name, domain, currency, archived, dversion FROM account ORDER BY archived, domain, name`) {
        await responder.write(account);
      }
      responder.addSection('status', 'OK');

    } else {
      responder.addSection('status', `Version Error Disk:${dversion}, Param:${params.dversion}`)
      logger('Versions do not match, param dversion:',params.dversion, 'database dversion', dversion);
    }
    
  });
};
