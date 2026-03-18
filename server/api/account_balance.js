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

import { Logger} from '@akc42/server-utils';
import mdb from '@akc42/sqlite-db';

const logger = Logger('accountbalance','rrror');

export default async function(user, params, responder) {

  mdb.transaction(db => {
    const {bversion} = db.get`SELECT bversion FROM account WHERE name = ${params.account}`??{bversion:0};
    if (bversion === params.bversion) {
      if (params.date === 0) {
        db.run`UPDATE account SET bversion = bversion + 1, balance = ${params.balance}, date = (strftime('%s','now')) WHERE name = ${params.account}`;
      } else {
        db.run`UPDATE account SET bversion = bversion + 1, balance = ${params.balance}}, date = ${params.date} WHERE name = ${params.account}`;
      }
      responder.addSection('status', 'OK');
      responder.addSection('bversion', bversion + 1);
    } else {
      logger('Versions do not match, param bversion:',params.bversion, 'database bversion', bversion);
      responder.addSection('status', 'Fail');
    }
  });
};
