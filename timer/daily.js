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
import fs from 'node:fs/promises';
import mdb, { openDatabase, backupAuthRequest } from '@akc42/sqlite-db';

const logger = Logger('daily', 'api');
const logerr = Logger('daily', 'error');

const hourlybackups = new RegExp(`${process.env.SQLITE_DB_NAME}_H.+\.db`);
const backupdate = new Date();
const backupname = backupdate.toISOString().substring(0,10);
const deletefrom = Math.round(backupdate.setHours(0,0,0,0)/60000);
let db;
let key;
let badExit = false;
try {
  key = backupAuthRequest();
  await mdb.backup(path.resolve(process.env.SQLITE_DB_BACKUP_DIR,`${process.env.SQLITE_DB_NAME}_D${backupname}.db`), key);
  
  const dirents = await fs.readdir(process.env.SQLITE_DB_BACKUP_DIR, { withFileTypes: true });
  const files = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name).filter(file => hourlybackups.test(file))
  for (const file of files) {
    await fs.rm(path.resolve( process.env.SQLITE_DB_BACKUP_DIR,file)); //delete the hourly backups
  }
  db = await openDatabase(`${process.env.SQLITE_DB_NAME}-log`);
  await db.backup(path.resolve(process.env.SQLITE_DB_BACKUP_DIR,`${process.env.SQLITE_DB_NAME}-log_D${backupname}.db`), key);
  db.exec('BEGIN TRANSACTION');
  db.exec(`DELETE FROM Log WHERE logmin < ${deletefrom}`);
  db.exec('COMMIT');
} catch(e) {
  badExit = true;
  logerr('Failure', e)
} finally {
  if (mdb.isOpen) mdb.close(true);
  if(db.isOpen) db.close(true);
  logger('Daily Complete');
  close();
}
if (badExit) process.exit(1); else process.exit(0);

