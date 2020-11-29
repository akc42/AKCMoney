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
import {cache} from '../libs/cache.js';
import { BalanceChanged } from '../modules/events.js';

/*
     <account-transaction>
*/
class AccountTransaction extends LitElement {
  static get styles() {
    return css``;
  }
  static get properties() {
    return {
      amount: { type: Number },
      cd: {type: String},
      ctype: {type: String},
      currency: { type: String },
      date: { type: Number },
      description: { type: String },
      dst: { type: String },
      dstamount: { type: Number },
      dstclear: { type: Boolean },
      dstcode: { type: String },
      id: {type: Number},
      repeat: { type: Number },
      rno: { type: String },
      src: {type: String},
      srcamount: { type: Number },
      srcclear: {type: Boolean},
      srccode: {type: String},
      trate: {type, Number},
      version: { type: Number },
      index: { type: Number },
      balance: {type: Number},
      cumulative: {type: Number},
      edit: {type: Boolean},
      account: {type: String}, //Name of account (should match src or dst of transaction)
      acurrency: {type: String},
      arate: {type: Number},
      accounts: { type: Array }, //list of accounts to display for destination
      codes: {type: Array},
      currencies: {type: Array},
      repeats: {type:Array}
    };
  }
  constructor() {
    super();
    this.amount = 0;
    this.cd = '';
    this.ctype = '';
    this.currency = '';
    this.date = 0;
    this.description = '';
    this.dst = '';
    this.dstamount = 0;
    this.dstclear = false;
    this.dstcode = '';
    this.id =  0;
    this.repeat = 0;
    this.rno = '';
    this.src = ''
    this.srcclear = false;
    this.srcamount = 0;
    this.srccode = '';
    this.trate = 1;
    this.version = 0;
    this.index = 0;
    this.balance = 0;
    this.cumulative = 0;
    this.edit = false;
    this.account = '';
    this.acurrency = '';
    this.arate = 1;
    this.accounts = [];
    this.codes = [];
    this.currencies = [];
    this.repeats = [];
  }
  connectedCallback() {
    super.connectedCallback();
    /*
      We have to do this because the super constructor may create the property
      before we have instanciated our setter (I think if our using element is dynamically
      loaded).
    */
        
    if (this.hasOwnProperty('transaction')) {
      const transaction = this.transaction;
      delete this.transaction;
      this.transaction = transaction;
    }

  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if (changed.has('cumulative')) this.dispatchEvent(new BalanceChanged(this.cumulative));

    super.update(changed);
  }
  firstUpdated() {
  }
  updated(changed) {
    if (changed.has('amount') || changed.has('balance') || changed.has('src'), ) {
      let amount;
      if (this.currency === this.currency) {
        amount = this.amount;
      } else {
        amount = Math.round(this.amount * this.arate / this.trate)
      }
      if (this.src === this.account.name && this.srcclear === 0) {
        cumulative -= amount;
      } else if (this.dstclear === 0) {
        cumulative += amount;
      }

    }

    super.updated(changed);
  }
  render() {
    return html`
      <style>
        :host {
          background-color: transparent;
        }
        .wrapper {
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width));
          grid-template-areas:
            "date ref . amount balance"
            "description description description description description";

        }
        .date {
          grid-area: date;
        }
        .ref {
          grid-area: ref;
        }
        .description {
          text-align: center;
          grid-area: description;
        }
        .amount {
          text-align: right;
          grid-area: amount;
        }
        .balance {
          text-align: right;
          grid-area: balance;
        }
        @media (min-width: 500px) {
          .wrapper {
            grid-template-areas:
              "date ref description amount balance";
          }

      </style>
      ${cache(this.edit ? html`
        <form></form>
      `:html`
        <div class="wrapper">
          <date-format class="date" .date=${this.date}></date-format>
          <div class="ref">${this.rno}</div>
          <div class="description">${this.description}</div>
          <div class="amount">${   +(this.amount / 100).toFixed(2)}</div>
          <div class="balance">${(this.cumulative/100).toFixed(2)}</div>
        </div>
      `)}
      
    `;
  }
  get transaction() {
    return {
      amount: this.amount,
      cd: this.cd,
      ctype: this.ctype,
      currency: this.currency,
      date: this.date,
      description: this.description,
      dst: this.dst,
      dstamount: this.dstamount,
      dstclear: this.dstclear ? 1 : 0,
      dstcode: this.dstcode,
      id: this.id,
      repeat: this.repeat,
      rno: this.rno,
      src: this.src,
      srcamount: this.srcamount,
      srcclear: this.srcclear? 1:0,
      srccode: this.srccode,
      version: this.version
    };
  }
  set transaction(value) {
    this.amount = Math.abs(value.amount); //should never by negative
    this.cd = value.cd;
    this.ctype = value.ctype;
    this.currency = value.currency;
    this.date = value.date;
    this.description = value.description;
    this.dst = value.dst;
    this.dstamount = value.dstamount;
    this.dstclear = value.dstclear !== 0;
    this.dstcode = value.dstcode;
    this.id = value.id;
    this.src = value.src;
    this.srcclear = value.srcclear !== 0;
    this.srcamount = value.srcamount;
    this.srccode = value.srccode;
    this.repeat = value.repeat;
    this.rno = value.rno
    this.version = value.version;
  }
}
customElements.define('account-transaction', AccountTransaction);
