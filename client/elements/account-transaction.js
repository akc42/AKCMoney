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
import {classMap} from '../libs/class-map.js';

import { api, submit } from '../libs/utils.js';

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
      reconcilled: { type: Boolean },
      repeat: { type: Number },
      rno: { type: String },
      src: {type: String},
      srcamount: { type: Number },
      srcclear: {type: Boolean},
      srccode: {type: String},
      trate: {type: Number},
      version: { type: Number },
      index: { type: Number },
      balance: {type: Number},
      cumulative: {type: Number},
      edit: {type: Boolean},
      amountEdit: {type: Boolean},
      account: {type: String}, //Name of account (should match src or dst of transaction)
      acurrency: {type: String},
      arate: {type: Number},
      accounts: { type: Array }, //list of accounts to display for destination
      codes: {type: Array},
      currencies: {type: Array},
      repeats: {type:Array},
      inputError: {type: Boolean}
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
    this.reconcilled = false;
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
    this.amountEdit = false;
    this.account = '';
    this.acurrency = '';
    this.arate = 1;
    this.accounts = [];
    this.codes = [];
    this.currencies = [];
    this.repeats = [];
    this.inputError = false;
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

    if (changed.has('cumulative') && changed.get('cumulative') !== undefined) {
      this.dispatchEvent(new CustomEvent('balance-changed', {bubbles: true, composed: true, detail:this.cumulative}));
    }
    super.update(changed);
  }
  firstUpdated() {
    
  }
  updated(changed) {
    if (changed.has('amount') || changed.has('balance') || changed.has('src') || changed.has('currency') || changed.has('acurrency') ||
     changed.has('trate') || changed.has('arate') ) {
      this.cumulative = this.balance; 
      let amount;
      if (this.currency === this.acurrency) {
        amount = this.amount;
      } else {
        amount = Math.round(this.amount * this.arate / this.trate)
      }
      if (this.src === this.account && !this.srcclear) {
        this.cumulative -= amount;
      } else if (this.dst === this.account && !this.dstclear) {
        this.cumulative += amount;
      }

    }
    if (changed.has('amount') && changed.get('amount') !== undefined && !this.edit) {
      this.dispatchEvent(new CustomEvent('amount-changed', {bubbles: true, composed: true}));
      api('/xaction_amount',{
        id: this.id,
        version: this.version,
        amount: this.amount
      }).then(response => {
        if (response.status === 'OK') {
          response.transaction.reconcilled = (response.transaction.src === this.account && response.transaction.srcclear === 1) ||
            (response.transaction.dst === this.account.name && response.transaction.dstclear === 1);
          this.transaction = response.transaction;
          this.dispatchEvent(new CustomEvent('transaction-changed', { bubbles: true, composed: true }));
        } else {
          this.dispatchEvent(new CustomEvent('version-error', {bubbles: true, composed: true}));
        }
      })
    }
    if (changed.has('amountEdit') && this.amountEdit) {
      this.amountInput = this.shadowRoot.querySelector('#amount');
      this.inputError = !this.amountInput.reportValidity()
    }
    super.updated(changed);
  }
  render() {
    const cleared = this.reconcilled || (this.srcclear && this.src === this.account) ||
      (this.dstclear && this.dst === this.account);
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
        date.reconcilled {
          text-decoration: line-through;
        }
        .date.passed {
          background-color: var(--old-transaction);
        }
        .date.cleared {
          background-color: var(--cleared-transaction);
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
        .amount.error {
          background-color: lightpink;
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
        }

      </style>
      ${cache(this.edit ? html`
        <form id="login" action="/xaction_update" @submit=${submit} @form-response=${this._update}>
          <input type="hidden" name="id" .value=${this.id}/>
          <input type="hidden" name="version" .value=${this.version} />
          <input type="hidden" name="date" .value=${this.date} />
          <calendar-input .value=${this.date} @value-changed=${this._dateChange}></calendar-input>
          <input type="text" name="rno" .value=${this.rno} />
          <input type="text" name="description" .value=${this.description} />
          <input type="text" name="amount" .value=${this.amount} />
          <select name="currency">
            ${this.currencies.map(currency => html`
              <option value="${currency.name}" ?selected=${currency.name === this.currency}>${currency.description}</option>
            `)}
          </select>

        </form>
      `:html`
        <div class="wrapper" @click=${this._startEdit}>
          <date-format class="date ${classMap({
            reconcilled: this.reconcilled,
            passed: Date.now()/1000 > this.date,
            cleared:  cleared
          })}" .date=${this.date}></date-format>
          <div class="ref">${this.rno}</div>
          <div class="description">${this.description}</div>
          ${cache(this.amountEdit ? (this.src === this.account ? html`
            <input
              id="amount"
              type="text"
              pattern="^-(0|[1-9][0-9]{0,2}(,?[0-9]{3})*)(\.[0-9]{1,2})?$"
              class="amount ${classMap({error: this.inputError})}" 
              .value=${(-this.amount / 100).toFixed(2)}
              @input="${this._amountChanged}"
              @blur=${this._amountUpdate}/>
          `:html`
            <input
              id="amount"
              type="text"
              pattern="^(0|[1-9][0-9]{0,2}(,?[0-9]{3})*)(\.[0-9]{1,2})?$"
              class="amount ${classMap({ error: this.inputError })}" 
              .value=${(this.amount / 100).toFixed(2)}
              @input="${this._amountChanged}"
              @blur=${this._amountUpdate}/>          
          `):html`
            <div class="amount" @click=${this._startAmountEdit}>${(this.src === this.account ? '-':'') + (this.amount / 100).toFixed(2)}</div>
          `)}
          <div class="balance">${cleared ? '0.00' : (this.cumulative/100).toFixed(2)}</div>
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
      reconcilled: this.reconcilled,
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
    this.amount = Math.abs(value.amount); //should never be negative
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
    this.reconcilled = value.reconcilled;
    this.repeat = value.repeat;
    this.rno = value.rno
    this.src = value.src;
    this.srcclear = value.srcclear !== 0;
    this.srcamount = value.srcamount;
    this.srccode = value.srccode;
    this.version = value.version;
  }
  _amountChanged(e) {
    e.stopPropagation();
    if (this.amountInput.reportValidity()) {
      this.inputError = false;
    } else {
      this.inputError = true;
    }
  }
  _amountUpdate(e) {
    e.stopPropagation();
    if (this.amountInput.reportValidity()) {
      this.inputError = false;
      this.amount = Math.abs(parseFloat(this.amountInput.value) * 100);
      this.amountEdit = false;
    } else {
      this.inputError = true;
    }
  }

  _dateChange(e) {
    e.stopPropagation();
    this.date = e.detail;
  }
  _startAmountEdit(e) {
    e.stopPropagation();
    this.amountEdit = true;
  }
  _startEdit(e) {
    e.stopPropagation();
    this.edit = true;
  }
}
customElements.define('account-transaction', AccountTransaction);
