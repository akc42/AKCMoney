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
import mdb from '@akc42/sqlite-db';

export default async function(user, params, responder) {

  await mdb.transactionAsync(async db => {
    responder.addSection('currencies');
    for(const currency of db.iterate`SELECT * FROM currency WHERE display = 1 ORDER BY priority ASC`) {
      await responder.write(currency);
    }
    responder.addSection('codes');
    for(const code of db.iterate`SELECT * FROM code ORDER BY CASE type WHEN 'C' THEN 0 WHEN 'O' THEN 2 ELSE 1 END, type, description COLLATE NOCASE ASC`) {
      await responder.write(code);
    }
    responder.addSection('repeats');
    for(const repeat of db.iterate`SELECT rkey,description FROM repeat ORDER BY priority`) {
      await responder.write(repeat);
    }
  });
};

