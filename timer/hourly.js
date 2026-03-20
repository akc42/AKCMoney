/**
@licence
    Copyright (c) 2026 Alan Chandler, all rights reserved

    This file is part of money.

    money is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    money is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with money.  If not, see <http://www.gnu.org/licenses/>.
*/
import { Logger, close } from '@akc42/server-utils';
import path from 'node:path';
import mdb, { backupAuthRequest } from '@akc42/sqlite-db';

const logger = Logger('hourly', 'api');
const logerr = Logger('hourly', 'error');


const backupdate = new Date();
const backupname = `${backupdate.toISOString().substring(0,10)}_${backupdate.toTimeString().substring(0,5)}`;

let key;
let badExit = false;
try {
  key = backupAuthRequest();
  await mdb.backup(path.resolve(process.env.SQLITE_DB_BACKUP_DIR,`${process.env.SQLITE_DB_NAME}_H${backupname}.db`), key);
  
} catch(e) {
  badExit = true;
  logerr('Failure', e)
} finally {
  if (mdb.isOpen) mdb.close(true);
  logger('Hourly Complete');
  close();
}
if (badExit) process.exit(1); else process.exit(0);

