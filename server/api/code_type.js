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

const logger =Logger('codetype','error');

export default async function(user, params, responder) {
  await mdb.transactionAsync(async db => {
    const {version} = db.get`SELECT version FROM code WHERE id = ${params.id}`??{version:0};
    if (version === params.version) {
      db.run`UPDATE code SET version = version + 1, type = ${params.type} WHERE id = ${params.id}`;
      responder.addSection('codes');
      for (const code of db.iterate`SELECT * FROM code ORDER BY CASE type WHEN 'A' THEN 2 WHEN 'B' THEN 0 WHEN 'C' THEN 3 WHEN 'R' THEN 1 ELSE 4 END,
        description COLLATE NOCASE ASC`) {
        await responder.write(code);
      }
      responder.addSection('status', 'OK');
    } else {
      responder.addSection('status', `Version Error Disk:${version}, Param:${params.version}`);
      logger(`Version Error Disk:${version}, Param:${params.version}`)
    }
  });
};
