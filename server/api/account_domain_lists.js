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
import Debug from 'debug';
import db from '@akc42/sqlite-db';


const debug = Debug('money:accountdomainslist');

export default async function(user, params, responder) {
  debug('new request from', user.name );
  const getAccounts = db.prepare(`SELECT a.name, a.domain FROM account a, user u 
    LEFT JOIN capability c ON c.domain = a.domain AND c.uid = u.uid 
    LEFT JOIN priority p ON p.account = a.name AND p.uid = u.uid  AND p.domain = ? 
    WHERE a.archived = 0 AND u.uid = ? AND (u.isAdmin = 1 OR c.domain IS NOT NULL) 
    ORDER BY p.sort ASC NULLS LAST, CASE WHEN a.domain = ? THEN 0 ELSE 1 END, 
    CASE WHEN u.account = a.name THEN 0 ELSE 1 END, a.domain, a.name`);
  const getDomains = db.prepare(`SELECT d.name FROM domain d, user u WHERE (u.isAdmin = 1 OR 
    d.name IN (SELECT Domain FROM capability WHERE uid = u.uid)) AND u.uid = ?`).pluck();
  db.transaction(() => {
    responder.addSection('accounts',getAccounts.all(params.domain, user.uid, params.domain));
    responder.addSection('domains', getDomains.all(user.uid));
  })();
  debug('request complete');
  
};
