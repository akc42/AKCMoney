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
import mdb from '@akc42/sqlite-db';

export default async function(user, params, responder) {
  
  await mdb.transactionAsync(async db => {
    responder.addSection('offsheet') 
    for(const code of db.iterate`SELECT c.id,c.description FROM code c INNER JOIN xaction t ON t.id = (
        SELECT x.id FROM user u,xaction x INNER JOIN account a ON (x.src = a.name AND x.srccode = c.id) 
        OR (x.dst = a.name AND x.dstcode = c.id) LEFT JOIN capability p ON p.uid = u.uid AND p.domain = a.domain 
        WHERE a.domain = ${params.domain} AND u.uid = ${user.uid} AND (u.isAdmin = 1 OR p.uid IS NOT NULL) LIMIT 1) WHERE c.type = 'O'`) {
      await responder.write(code);
    }
  });
};
