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

//process.env.DEBUG='money:validate';

process.env.LOG_NONE = 'yes';
process.env.MONEY_DOMAIN = 'mondev.chandlerfamily.org.uk'; //set for testing
const utils = require('../utils');

beforeAll(async () => {
  await utils.server.start;
})
afterAll(() => {
  utils.server.close();
})
describe('initial connect without a cookie', () => {
  beforeAll(async () => {
    await page.goto(`https://${process.env.MONEY_DOMAIN}`);
  });

  test('initial check should display the login page', async () => {
    await expect(page).toHaveText('h1', 'Log In');
  });
  test('login user with no password will redirect to profile page', async () => {
    const replaceUser = utils.database.prepare(`REPLACE INTO user (uid, name) VALUES(2,'test')`);
    replaceUser.run();
    await page.type('#username', 'test');
    await page.click('#submit');
    await page.waitForNavigation();
    await expect(page).toHaveText('h1', 'My Account');
  });
});
describe('connect with a cookie', () => {
  beforeAll(async () => { 
    const getUser = utils.database.prepare('SELECT * FROM user WHERE uid = 1');
    const user = getUser.get();
    user.remember = true;
    user.password = true;
    const cookie = utils.cookie(user);
    await context.addCookies([cookie]);
    await page.goto(`https://${process.env.MONEY_DOMAIN}`);
  });
  test('initial page should be users default account', async () => {
    await expect(page).toHaveText('h1', 'Cash');
  });
});
