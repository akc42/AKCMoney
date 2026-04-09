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

  const {mindate, maxdate} = mdb.get`SELECT MAX(t.date) as maxdate, MIN(t.date) As mindate FROM xaction t
    LEFT JOIN account sa ON sa.name = t.src LEFT JOIN account da ON sa.name = t.dst  
    WHERE sa.domain = ${params.domain} OR da.domain = ${params.domain}`?? {mindate: 0, maxdate: 0};
  responder.addSection('min', mindate);
  responder.addSection('max', maxdate);
};
