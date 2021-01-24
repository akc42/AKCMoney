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
import { LitElement, html, css } from '../libs/lit-element.js';
import Route from '../libs/route.js';

import '../elements/account-transaction.js';
import { api } from '../libs/utils.js';

import page from '../styles/page.js';

/*
     <offsheet-page>:  Handles the Off Balannce Sheet Account
*/
class OffsheetPage extends LitElement {
  static get styles() {
    return [page, css``];
  }
  static get properties() {
    return {
      route:{type: Object},
      code: {type: Number},
      title: {type: String},
      transactions: {type: Array},
      currencyCode: {type: String},
      currencyDescription: {type: String},
      codes: {type: Array},
      repeats: {type: Array}
    };
  }
  constructor() {
    super();
    this.route = {active: false};
    this.code = 0;
    this.transactions = [];
    this.currencyCode = 'GBP';
    this.currencyDescription = 'United Kingdom, Pounds'
    this.router = new Route('/','page:offsheet');
  }
  connectedCallback() {
    super.connectedCallback();
    this.currencyCode = sessionStorage.getItem('defaultCurrency');
    this.currencyDescription = sessionStorage.getItem('defaultCUrrencyDescription');
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
  }
  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        this.code = route.query.id;
        this.dispatchEvent(new CustomEvent('code-changed',{bubbles: true, composed: true, detail: this.code}));
        this.title = route.query.description;
        this.fetchData()
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>
      </style>
      <section class="page">
        <h1>Off Balance Sheet Transactions</h1>
        <div class="info">
          <div class="code"><strong>Accounting Code:</strong> ${this.title}</div>
          <div class="currency">
            <div class="name">Default Currency:<span>${this.currencyCode}</span></div>
            <div class="description">${this.currencyDescription}</div>
          </div>
          <div class="normal">All Transactions have been normalised to the default currency</div>
        </div>
        <div class="header">
          <div class="date">Date</div>
          <div class="ref">Ref</div>
          <div class="description">Description</div>
          <div class="amount">Amount</div>
          <div class="balance">Balance</div>
        </div>
        <section class="scrollable">
          ${this.transactions.map((transaction, i) => html`
            <account-transaction 
              .index=${i}
              .balance=${this.balances[i]}
              .transaction=${transaction} 
              readonly 
              .acurrency=${transaction.currency}
              .account=${transaction.amount < 0 ? transaction.src : transaction.dst}
              accounting
              .repeats=${this.repeats}
              .codes=${this.codes}
              ></account-transaction>
          `)}
        </section>        

      </section>
    `;
  }
  async fetchData() {
    const response = await api('offsheet',{code: this.code})
    this.transactions = response.transactions;
    this.fetchedTransactions = true;
    this.balances = [];
    let i = 0;
    this.cumulative = 0;
    for (const transaction of this.transactions) {
      this.balances[i] = this.cumulative;
      this.cumulative += Math.round(transaction.amount / (this.type === 'A' ? 3 : 1));
      i += 1;
    }
  }
}
customElements.define('offsheet-page', OffsheetPage);