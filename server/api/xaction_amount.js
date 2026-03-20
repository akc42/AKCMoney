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

const logger = Logger('xactionamount','error');

export default async function(user, params, responder) {
  mdb.transaction(db => {
    const {version, currency, scurrency, dcurrency, amount, srcamount, dstamount} = db.get`SELECT t.version, t.currency, sa.currency AS scurrency, 
      da.currency AS dcurrency, t.amount, t.srcamount, t.dstamount FROM xaction AS t LEFT JOIN account AS sa ON t.src = sa.name 
      LEFT JOIN account AS da ON t.dst = da.name WHERE id = ${params.id}`??{version:0, currency:'',scurrency:null,dcurrency:null, amount:0, 
        srcamount: null, dstamount: null};
    
    if (version === params.version) {
      db.run`UPDATE xaction SET version = version + 1 , srcamount = ${
        scurrency !== null && scurrency !== currency ? Math.round(params.amount * srcamount/amount) : null
      }, dstamount = ${
        dcurrency !== null && dcurrency !== currency ? Math.round(params.amount * dstamount/amount) : null
      }, amount = ${params.amount} WHERE id = ${params.id}`;
      responder.addSection('transaction', db.get`SELECT t.*, tc.rate AS trate, 
  CASE WHEN a.name = t.src AND t.srcclear = 1 THEN 1 WHEN a.name = t.dst AND t.dstclear = 1 THEN 1 ELSE 0 END AS reconciled,
  CASE WHEN aa.domain = a.domain THEN 1 ELSE 0 END AS samedomain
  FROM account a JOIN xaction t ON(t.src = a.name OR t.dst = a.name)
  LEFT JOIN account aa ON (t.src = aa.name OR t.dst = aa.name) AND aa.name <> a.name
  LEFT JOIN currency tc ON tc.name = t.currency
  WHERE t.id = ${params.id} AND a.name = ${params.account}`)
      responder.addSection('status', 'OK');
    } else {
      responder.addSection('status', `Version Error Disk:${version}, Param:${params.version}`);
      logger(`Version Error Disk:${version}, Param:${params.version}`);
    }
  });
};
