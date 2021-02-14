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

//process.env.DEBUG='money:server';

//const utils = require('../utils');

beforeAll(async () => {

  const getUser = database.prepare('SELECT * FROM user WHERE uid = 1');
  const user = getUser.get();
  user.remember = true;
  user.password = true;
  const cookie = makeCookie(user);
  await context.addCookies([cookie]);
  //Calculate a date 180 days before now so make us show transactions from about then onwards
  const date = new Date();
  date.setTime(date.getTime() - (1000 * 60 * 60 * 24 * 180));
  const dbDate = Math.floor(date.getTime()/1000);

  const makeDomain = database.prepare('INSERT INTO domain (name, description) VALUES(?,?)');
  const makeAccount = database.prepare(`INSERT INTO account(name,currency,balance, domain, startdate) VALUES(?,'GBP',?,?,?)`);
  const updateStart = database.prepare(`UPDATE account SET startdate = ?, balance = ? WHERE name = ?`);
  const makeTransaction = database.prepare(`INSERT INTO xaction ( id, date, amount, currency, src, srcamount, srcclear, dst, dstamount, dstclear, description) 
    VALUES (?,?,1000,?,?,?,?,?,?,?,?)`);
  database.transaction(() => {
    //make account scenarios that could be useful
    makeDomain.run('Test', 'Test Domain');
    makeAccount.run('TestBase',5000,'Base', dbDate);
    makeAccount.run('TestTest',10000,'Test',dbDate);
    updateStart.run(dbDate,100000, 'Cash');

    for (let i = 1; i < 100; i++) {
      //set some default values
      let currency = 'GBP';
      let src = 'Cash';
      let srcamount = null;
      let srcclear = 0;
      let dst = null;
      let dstamount = null;
      let dstclear = 0;
      if (i % 11 === 4) dst = 'TestBase';
      if (i % 21 === 19) dst = 'TestTest';
      if (i % 19 === 3) {
        dst = 'Cash'
        if (i === 22 ) {
          src = 'TestBase';
        } else if ( i === 41) {
          src = 'TestTest';
        } else {
          src = null;
        }
      }
      if (i === 7 || i === 90) {
        currency = 'EUR';
        srcamount = 850;
      } else if (i === 60) {
        currency = 'USD';
        dstamount = 600;
      }
      if (i < 55) {
        if (src === 'Cash' ) {
          srcclear = 1;
        } else {
          dstclear = 1;
        }
      }
      makeTransaction.run(i+20, dbDate + 1 + (i * 100000), currency, src, srcamount, srcclear, dst, dstamount, dstclear, `Test Transaction No ${i}, with transaction id ${i+20}`)

    }
    page.on('console', console.log)
  })();
})
afterAll(() => {
  const deleteTransactions = database.prepare('DELETE FROM xaction');
  const deleteAccounts = database.prepare(`DELETE FROM account WHERE name <> 'Cash'`);
  const deleteDomains = database.prepare(`DELETE FROM domain WHERE name <> 'Base'`);
  database.transaction(() => {
    deleteTransactions.run();
    deleteAccounts.run();
    deleteDomains.run();
  })();
});
describe('Checking Navigation from Query Parameters' ,() => {
  test('navigates to account in query parameter if given', async () => {
    await page.goto(`https://${process.env.MONEY_DOMAIN}/account?account=TestBase`);
    await page.textContent('#defcur');
    await expect(page).toHaveText('h1', 'TestBase');
  });
  test('navigates to user default account if none given in query parameters', async () => {
    await page.goto(`https://${process.env.MONEY_DOMAIN}/account`);
    await page.textContent('#defcur');
    await expect(page).toHaveText('h1', 'Cash');
  });
})
describe('managing reconciled and cleared balance', () => {
  beforeAll(async () => {
    await page.goto(`https://${process.env.MONEY_DOMAIN}/account?account=Cash`);
    await page.textContent('#defcur');
    await page.$eval('account-page', el => el.updateComplete);
  })
  test('check reconciled balance, cleared balance and minimum balance are set correctly', async() => {
    const reconciledBalance = await page.$eval('#recbal', el => el.value);
    expect(reconciledBalance).toBe('1000.00');
    await expect(page).toHaveText('#clearb','1000.00');
    await expect(page).toHaveText('#minb','607.50');
  });
  test('check cleared balance changes when transaction is cleared', async () => { 
    await page.click('#t75 date-format');
    await expect(page).toHaveText('#clearb', '990.00');
    await page.click('#t99 date-format');
    await expect(page).toHaveText('#clearb', '1000.00');
    await page.click('#t90 date-format');
    await expect(page).toHaveText('#clearb', '990.00');
    await page.click('#t75 date-format');
    await expect(page).toHaveText('#clearb', '1000.00');
    await page.click('#t80 date-format');
    await expect(page).toHaveText('#clearb', '1006.00');
  });
  test('clearing transaction changes cumulative balance of earlier transactions only', async () => {
    await expect(page).toHaveText('#t76 .balance', '986.00');
    await page.click('#t75 date-format');
    await expect(page).toHaveText('#t76 .balance', '986.00');
    await page.click('#t99 date-format');
    await expect(page).toHaveText('#t76 .balance', '976.00');
  });
});