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

process.env.DATABASE_DB = 'money-test.db';
const path = require('path');

const db = require('@akc42/sqlite-db');

describe('account add api', () => {
  let accountAdd;
  beforeAll(() => {
    accountAdd = require('../../server/api/account_add');
  });
  afterAll(() => {
    db.prepare(`DELETE FROM account WHERE name <> 'Cash'`).run();
  });
  test('fails to create an account if already in use', async () => {
    const responder = {
      addSection: jest.fn()
    };
    await accountAdd({name: 'Admin'}, {currency: 'GBP', domain:'Base', name: 'Cash'}, responder);
    expect(responder.addSection.mock.calls.length).toBe(1);
    expect(responder.addSection.mock.calls[0][0]).toBe('status');
    expect(responder.addSection.mock.calls[0][1]).toBe('Name already in use Cash');

  });
  test('creates the account if count does not already exist', async() => {
    const responder = {
      addSection: jest.fn()
    };
    await accountAdd({ name: 'Admin' }, { currency: 'GBP', domain: 'Base', name: 'testAccount' }, responder);
    expect(responder.addSection.mock.calls.length).toBe(2);
    expect(responder.addSection.mock.calls[0][0]).toBe('status');
    expect(responder.addSection.mock.calls[0][1]).toBe('OK');
    expect(responder.addSection.mock.calls[1][0]).toBe('accounts');
    expect(responder.addSection.mock.calls[1][1]).toHaveLength(2);

  });

});