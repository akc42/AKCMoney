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
import { LitElement, html, css } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';
import {classMap} from '../libs/class-map.js';

import './account-transaction.js';
import './material-icon.js';
import { api } from '../libs/utils.js';

/*
     <domain-code>
*/
class DomainCode extends LitElement {
  static get styles() {
    return css``;
  }
  static get properties() {
    return {
      id: {type: Number}, //id representing code
      type: {type: String}, //Single Character Code representing the Type
      tamount: {type: Number}, //Currency Corrected total amount of this code
      description: {type: String}, //Description of code
      transactions: {type: Array},
      balance: {type: Number},
      cumulative: {type: Number},
      expanded: {type: Boolean}, //Display expanded to show transactions
      start: {type: Number}, //Start Date for transactions
      end: {type: Number}, //End Date for transactions
      repeats: {type: Array},
      codes: {type: Array}
    };
  }
  constructor() {
    super();
    this.id = 0;
    this.type = '';
    this.tamount = 0;
    this.description = '';
    this.transactions = [];
    this.balance = 0;
    this.cumulative = 0;
    this.expanded = false;
    this.start = 0;
    this.end = 0;
    this.repeats = [];
    this.codes = [];
    this.fetchedTransactions = false;

  }
  connectedCallback() {
    super.connectedCallback();
    /*
      We have to do this because the super constructor may create the property
      before we have instanciated our setter (I think if our using element is dynamically
      loaded).
    */

    if (this.hasOwnProperty('code')) {
      const code = this.code;
      delete this.code;
      this.code = code;
    }

  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if (!this.fetchedTransactions && this.expanded && changed.has('expanded')) {
      //63072000 = 2 more years back for assets
      api('domain_xactions', { 
        domain: this.domain, 
        start: this.type === 'A' ? this.start - 63072000:this.start, 
        end: this.end, 
        code: this.id
      }).then(response => {
        this.transactions = response.transactions;
        this.fetchedTransactions = true;
        this.balances = [];
        let i = 0;
        this.cumulative = 0;
        for(const transaction of this.transactions) {
          this.balances[i] = this.cumulative;
          this.cumulative += Math.round(transaction.amount/ (this.type === 'A' ? 3 : 1));          
          i += 1;
        }
      });
    }

    super.update(changed);
  }
  firstUpdated() {
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        .main {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: 40px 1fr repeat(2, var(--amount-width)) 70px;
          grid-template-areas:
            "type . amount balance show"
            "code code code code code";
          margin: 2px 5px;
          background-color: var(--table-panel-background);
        }


        .type {
          grid-area: type;
          width: 20px;
          height: 20px;
          margin: auto;
        }
        .code {
          grid-area: code;
        }
        .amount {
          grid-area: amount;
          text-align: right;
        }
        .balance {
          grid-area: balance;
          text-align: right;
        }
        .show {
          grid-area: show;
          cursor:pointer;
          margin:auto;
        }

        div.type.C {
            background:transparent url(/images/codes.png) no-repeat 0 -20px;
        }
        div.type.R {
            background:transparent url(/images/codes.png) no-repeat 0 -40px;
        }
        div.type.A {
            background:transparent url(/images/codes.png) no-repeat 0 -60px;
        }
        div.type.B {
            background:transparent url(/images/codes.png) no-repeat 0 -80px;
        }

        @media (min-width: 500px) {
          .main {
            grid-template-areas:
              "type code amount balance show";    
          }

        }


      </style>
      <section class="main">
        <div class="type ${this.type}"></div>
        <div class="code">${this.description}</div>
        <div class="amount">${(this.tamount/100).toFixed(2)}</div>
        <div class="balance">${(this.balance/100).toFixed(2)}</div>
        <div class="show" @click=${this._zoom}>${this.expanded? 
          html`<material-icon>zoom_out</material-icon>`:
          html`<material-icon>zoom_in</material-icon>`}</div>
      </section>
      <section class="transactions">
        ${cache(this.expanded ? html`
          ${this.transactions.map((transaction,i) => html`
            <account-transaction 
              .index=${i}
              .balance=${this.balances[i]}
              .transaction=${transaction} 
              readonly 
              .acurrency=${transaction.currency}
              .account=${this.type === 'B' ? (transaction.amount < 0 ? transaction.src: transaction.dst) :
                 (transaction.dstcode === this.id ? transaction.dst : transaction.src)}
              ?accounting=${this.type !== 'B'}
              .repeats=${this.repeats}
              .codes=${this.codes}
              ></account-transaction>
          `)}
        `:'')}
      </section>
    `;
  }
  set code(value) {
    this.id = value.id;
    this.type = value.type;
    this.tamount = value.tamount;
    this.description = value.description
  }
  get code() {
    return {
      id: this.id,
      type: this.type,
      tamount: this.tamount,
      description: this.description
    };
  }

  _zoom(e) {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }
}
customElements.define('domain-code', DomainCode);