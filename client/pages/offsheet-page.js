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
import config from '../libs/config.js';

import '../elements/account-transaction.js';
import api from '../libs/post-api.js';

import page from '../styles/page.js';

/*
     <offsheet-page>:  Handles the Off Balannce Sheet Account
*/
class OffsheetPage extends LitElement {
  static get styles() {
    return [page, css`
      section.page {
        max-width: 800px;
      }
      .header {     
        padding: 2px;
        display: grid;
        grid-gap: 1px;
        color: var(--table-text-color);
        grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width)) 20px;
        grid-template-areas:
          "date ref . amount balance ."
          "description description description description description description";
  
        margin: 0px 5px;
        background-color: var(--table-heading-background);
        font-weight: bold;

      }

      .header > * {
        border: 1px solid white;
      }
      .info {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: flex-start;
      }
      .currency > .name {
        font-weight: bold;
      }
      .currency > .name > span {
        color: var(--currency-designator-color)
      }
      .currency > .description {
        font-style: italic;
      }
      #transactions {
        background-color: var(--table-odd-color);
        color: var(--table-text-color);
        margin: 0px calc(var(--scrollbar-width) + 5px) 10px 5px;
        display: flex;
        flex-direction: column;

      }
      #transactions > div {
        margin:0;
        padding: 0;
      
      }
      #transactions > div:nth-child(even):not(.over){
        background-color: var(--table-even-color);
      }

      @media (min-width: 500px) {

        .header{
          grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width)) 20px;
          grid-template-areas:
            "date ref description amount balance .";
          margin-top: 20px;
        }
      }
    `];
  }
  static get properties() {
    return {
      route:{type: Object},
      code: {type: Number},
      title: {type: String},
      transactions: {type: Array},
      codes: {type: Array},
      repeats: {type: Array}
    };
  }
  constructor() {
    super();
    this.route = {active: false};
    this.code = 0;
    this.transactions = [];
    this.router = new Route('/','page:offsheet');
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
      <section class="page">
        <h1>Off Balance Sheet Transactions</h1>
        <div class="info">
          <div class="code"><strong>Accounting Code:</strong> ${this.title}</div>
          <div class="currency">
            <div class="name">Default Currency:<span>${config.defaultCurrency}</span></div>
            <div class="description">${config.defaultCurrencyDescription}</div>
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
        <section id="transactions" class="scrollable">
          ${this.transactions.map((transaction, i) => html`
            <account-transaction 
              .index=${i}
              .balance=${this.balances[i]}
              .transaction=${transaction} 
              readonly 
              .acurrency=${transaction.currency}
              .account=${transaction.dstcode === this.code ? transaction.dst : transaction.src}
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
    this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:true}));
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
    this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:false}));
  }
}
customElements.define('offsheet-page', OffsheetPage);