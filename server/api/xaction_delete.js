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
import {Logger} from '@akc42/server-utils';
import mdb from '@akc42/sqlite-db';

const logger = Logger('xactiondelete','error');

export default async function(user, params, responder) {
  const getXactionVersion = db.prepare('SELECT version FROM xaction WHERE id = ?').pluck();
  const deleteXaction = db.prepare('DELETE FROM xaction WHERE id = ?');
  mdb.transaction(db => {
    const {version} = db.get`SELECT version FROM xaction WHERE id = ${params.tid}`??{version:0};
    if (version === params.version) {
      const {changes} = db.run`DELETE FROM xaction WHERE id = ${params.tid}`;
      if (changes === 1) responder.addSection('status', 'OK'); else responder.addSection('status', 'Wrong Count');
    } else {
      responder.addSection('status', `Version Error Disk:${version}, Param:${params.version}`);
      logger(`Version Error Disk:${version}, Param:${params.version}`)
    }
  });
};
