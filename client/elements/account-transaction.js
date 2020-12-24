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
import button from '../styles/button.js';

import { api, submit } from '../libs/utils.js';

import './list-selector.js';

/*
     <account-transaction>
*/
class AccountTransaction extends LitElement {
  static get styles() {
    return [button,css``];
  }
  static get properties() {
    return {
      amount: { type: Number },
      currency: { type: String },
      date: { type: Number },
      description: { type: String },
      dst: { type: String },
      dstamount: { type: Number },
      dstclear: { type: Boolean },
      dstcode: { type: String },
      tid: {type: Number},
      reconciled: { type: Boolean },
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
      codes: {type: Array},
      repeats: {type: Array},
      accounts: {type: Array},
      inputError: {type: Boolean},
      accountAmountError: {type: Boolean}
    };
  }
  constructor() {
    super();
    this.amount = 0;
    this.currency = '';
    this.date = 0;
    this.description = '';
    this.dst = '';
    this.dstamount = 0;
    this.dstclear = false;
    this.dstcode = '';
    this.tid =  0;
    this.reconciled = false;
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

    this.codes = [];
    this.repeats = [];
    this.accounts = [];

    this.inputError = false;
    this.accountAmountError = false;
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


  updated(changed) {
    if (changed.has('amount') || changed.has('balance') || changed.has('src') || changed.has('currency') || changed.has('acurrency') ||
     changed.has('trate') || changed.has('arate') || changed.has('srcclear') || changed.has('dstclear')) {
      const cumulative = this.cumulative;
      this.cumulative = this.balance; 
      let amount;
      if (this.currency === this.acurrency) {
        amount = this.amount;
      } else {
          amount = this.account === this.src ? this.srcamount : this.dstamount 
      }
      if (changed.has('srcclear') && changed.get('srcclear') !== undefined && this.account === this.src) {
        this.dispatchEvent(new CustomEvent('clear-changed', {
          bubbles: true,
          composed: true,
          detail: {amount:this.srcclear ? -amount : amount, isSrc: true, set: this.srcclear, index: this.index}
        }));
      }
      if (changed.has('dstclear') && changed.get('dstclear') !== undefined && this.account === this.dst) {
        this.dispatchEvent(new CustomEvent('clear-changed', {
          bubbles: true,
          composed: true,
          detail: { amount: this.dstclear ? amount : -amount, isSrc: false, set: this.dstclear, index: this.index }
        }));
      }

      if (this.src === this.account && !this.srcclear) {
        this.cumulative -= amount;
      } else if (this.dst === this.account && !this.dstclear) {
        this.cumulative += amount;
      }
      if (this.cumulative !== cumulative) this.dispatchEvent(new CustomEvent('balance-changed', { 
        bubbles: true, 
        composed: true, 
        detail: this.cumulative 
      }));
    }
    if (this.amountEdit) {
      if (changed.has('amount') && changed.get('amount') !== undefined && !changed.has('tid')) {
        this.amountEdit = false;
        //only do this if its the same transaction that the amount has changed in.
        api('/xaction_amount',{
          id: this.tid,
          version: this.version,
          amount: this.amount
        }).then(response => {
          if (response.status === 'OK') {
            this.transaction = response.transaction
            this.dispatchEvent(new CustomEvent('transaction-changed', { bubbles: true, composed: true, detail: response.transaction }));
          } else {
            this.dispatchEvent(new CustomEvent('version-error', {bubbles: true, composed: true}));
          }
        })
      }
    
      if (changed.has('srcclear')) {
        this.dispatchEvent(new CustomEvent('clear-changed', {
          bubbles: true, composed: true, details: {
            amount:this.srcclear ? -this.amount: this.amount,
            clear: this.srcclear
        }}));
      }
      if (changed.has('dstclear')) {
        this.dispatchEvent(new CustomEvent('clear-changed', {
          bubbles: true, composed: true, details: {
            amount: this.dstclear ? this.amount : -this.amount,
            clear: this.dstclear
          }
        }));
      }
    } else {
      if (changed.has('edit') && this.edit) {
        this.amountInput = this.shadowRoot.querySelector('#amount');
        this.inputError = !this.amountInput.reportValidity()
        this.descriptionInput = this.shadowRoot.querySelector('#description');
        if (this.inputError) {
          this.amountInput.focus();
        } else {
          this.descriptionInput.focus()
        }
      }
    }
    if (changed.has('amountEdit') && this.amountEdit) {
      this.amountInput = this.shadowRoot.querySelector('#amount');
      this.inputError = !this.amountInput.reportValidity()
      this.amountInput.focus();
    }
   super.updated(changed);
  }
  render() {
    const cleared = this.reconcilled || (this.srcclear && this.src === this.account) ||
      (this.dstclear && this.dst === this.account);
    let visual;
    let codeVisual;
    let codeKey;
    let codeType;
    if (this.src === this.account) {
      codeKey = this.srccode;
      if (this.dst === null) {
        visual = sessionStorage.getItem('nullAccount');
      } else {
        const account = this.accounts.find(a => a.name === this.dst);
        visual = `${account.name} (${account.domain})`;
      }
    } else {
      codeKey = this.dstcode;
      if (this.src === null) {
        visual = sessionStorage.getItem('nullAccount');
      } else {
        const account = this.accounts.find(a => a.name === this.src);
        visual = `${account.name} (${account.domain})`;
      }
    }
    if (codeKey === null) {
      codeType = '';
      codeVisual = sessionStorage.getItem('nullCode');
    } else {
      const code = this.codes.find(c => c.id === codeKey)
      codeVisual = code.description;
      codeType = code.type;
    }
    return html`
      <style>
        :host {
          background-color: transparent;
        }
        .wrapper {
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width)) 20px;
          grid-template-areas:
            "date ref . amount balance code"
            "description description description description description description";

        }
        .container {
          padding: 2px;
          cursor: normal;
          background-color: var(--form-background-color);
          display: grid;
          grid-gap: 1px;
          grid-template-columns: 94px repeat(2,35px) 6fr 9fr 1fr 8fr repeat(2, var(--amount-width)) 20px;
          grid-template-areas:
            "date date dstsrc currency currency currency currency amount setrate setrate"
            "cleared . rate acurrency acurrency acurrency acurrency accamount setrate setrate"
            "lref ref ref repeat repeat repeat repeat repeat setrate setrate"
            "description description description description description description description description description description"
            "- accode accode accode accode accode accode accode accode code"
            "srcdst account account account account account account account account account"
            "switch switch . . move move move move balance ."
            "cancel . . save save save save save delete delete";
        }

        .date, calendar-input {
          grid-area: date;
          cursor: pointer;
        }
        .date.reconciled {
          text-decoration: line-through;
        }
        .date.passed {
          background-color: var(--old-transaction);
        }
        .date.cleared {
          background-color: var(--cleared-transaction);
        }
        .date.repeating {
          background-color: var(--repeating-transaction);
        }
        .lref {
          grid-area: lref;
          text-align: right;
        }
        .ref, input[name="rno"] {
          grid-area: ref;
        }
        .description, #description {
          grid-area: description;
        }
        .description {
          text-align: center;
        }  
        .currency {
          grid-area: currency;
        }     
        label[for="cleared"] {
          grid-area: cleared;
        }
        .amount {
          text-align: right;
          grid-area: amount;
        }
        .amount.error {
          background-color: lightpink;
        }
        .setrate {
          grid-area: setrate;
        }
        .balance {
          text-align: right;
          grid-area: balance;
        }
        div.code {
          grid-area: code;
          margin: 0;
          padding: 0;
          width: 20px;
          height: 20px;
          background:transparent url(codes.png) no-repeat 0 0;
        }

        div.code.C {
            background:transparent url(/images/codes.png) no-repeat 0 -20px;
        }
        div.code.R {
            background:transparent url(/images/codes.png) no-repeat 0 -40px;
        }
        div.code.A {
            background:transparent url(/images/codes.png) no-repeat 0 -60px;
        }
        div.code.B {
            background:transparent url(/images/codes.png) no-repeat 0 -80px;
        }
        div.code.O {
            background:transparent url(/images/codes.png) no-repeat 0 -100px;
        }
        .acurrency {
          grid-area: acurrency;
        }
        #accountamount {
          grid-area: accamount;
        }
        .rate {
          grid-area: rate;
        }
        .repeat {
          grid-area: repeat;
        }
        .accode {
          grid-area: accode;
        }
        .srcdst {
          grid-area: srcdst;
          text-align: right;
        }
        .dstsrc {
          grid-area: dstsrc;
          text-align: right;
        }
        .account {
          grid-area: account;
        }
        .switch {
          grid-area: switch;
        }
        .cancel {
          grid-area: cancel;
        }
        .save {
          grid-area: save;
        }
        .move {
          grid-area: move;
        }
        .delete {
          grid-area: delete
        }
        @media (min-width: 500px) {
          .wrapper {
            grid-template-areas:
              "date ref description amount balance code";
          }
          .container {
            grid-template-areas:
              "date date dstsrc description description description description amount currency ."
              ". . . . setrate setrate rate accamount acurrency ."
              "cleared ref ref repeat accode accode accode accode accode code"
              "switch switch srcdst account account account move . balance ."
              "cancel . save save . . lref . delete delete";
          }
          .lref {
            display: none;
          }
        }

      </style>
      ${cache(this.edit ? html`
        <form id="login" action="xaction_update" @submit=${submit} @form-response=${this._update}>
          <input type="hidden" name="account" .value=${this.account} />
          <input type="hidden" name="id" .value=${this.tid} />
          <input type="hidden" name="version" .value=${this.version} />
          <input type="hidden" name="date" .value=${this.date} />
          <input type="hidden" name="currency" .value=${this.currency} />
          <input type="hidden" name="repeat" .value=${this.repeat} />
          <input type="hidden" name="code" .value=${this.account === this.src ? this.srccode: this.dstcode} />
          <input type="hidden" name="type" .value=${this.account === this.src ? 'src' : 'dst'} />
          <input type="hidden" name="alt" .value=${this.account === this.src ? this.dst : this.src} />
          <div class="container" @dragstart=${this._noDrag} draggable="true">
            <calendar-input .value=${this.date} @value-changed=${this._dateChange}></calendar-input>
            <label class="lref" fore="ref">Ref:</label>
            <input id="ref" type="text" name="rno" .value=${this.rno} />
            <label class="dstsrc" for="description">${this.account === this.src ? 'Src' : 'Dst'}:</label>
            <input id="description" type="text" name="description" .value=${this.description} @input=${this._descriptionChanged}/>
            <input
              id="amount"
              name="amount"
              type="text"
              pattern="^(0|[1-9][0-9]{0,2}(,?[0-9]{3})*)(\.[0-9]{1,2})?$"
              class="amount ${classMap({ error: this.inputError })}" 
              .value=${(this.amount / 100).toFixed(2)} 
              @input=${this._amount}/> 
            <list-selector 
              class="currency"
              .list=${'currencies'} 
              .key=${this.currency} 
              .visual=${this.currency} 
              @item-selected=${this._currencyChanged}></list-selector>
            <label for="cleared">
              <input type="checkbox" name="cleared" ?checked=${cleared} @input=${this._clearedChanged}/>Cleared</label>
            <list-selector
              class="repeat"
              .list=${'repeats'}
              .key=${this.repeat.toString()}
              .visual=${this.repeats.find(r => r.rkey === this.repeat).description}
              @item-selected=${this._repeatChanged}></list-selector>
            <list-selector
              class="accode"
              .list=${'codes'}
              .key=${codeKey}
              .visual=${codeVisual}
              @item-selected=${this._codeChanged}></list-selector>
            <div class="code ${codeType}"></div>
            ${cache(this.acurrency !== this.currency ? html`
              <button 
                class="setrate" 
                @click=${this._setCurrencyRate}>
                  <material-icon>save_alt</material-icon>
                  <span>Set Currency Rate</span>
              </button>
              <div class="rate">${(this.trate / this.arate).toFixed(4)}</div>
              <input
                id="accountamount"
                name="accountamount"
                type="text"
                pattern="^(0|[1-9][0-9]{0,2}(,?[0-9]{3})*)(\.[0-9]{1,2})?$"
                class="amount ${classMap({ error: this.inputError })}" 
                .value=${((this.account === this.src ? this.srcamount : this.dstamount) / 100).toFixed(2)} />
            <div class="acurrency">${this.acurrency}</div>
            `:'' )}
            
            <label class="srcdst" for="accounts">${this.account === this.src ? 'Dst' : 'Src'}:</label>
            <list-selector
              id="accounts"
              class="account"
              .list=${'accounts'}
              .key=${this.account === this.src ? this.dst:this.src}
              .visual=${visual}
              @item-selected=${this._altAccountChanged}></list-selector>
            <button class="switch" @click=${this._switch}><material-icon>swap_horiz</material-icon><span>Switch (S<->D)</span></button>
            <div class="balance">${cleared ? '0.00' : (this.cumulative / 100).toFixed(2)}</div>
            <button class="cancel" @click=${this._cancel}><material-icon>backspace</material-icon><span>Cancel</span></button>
            <button class="save" type="submit" @click=${this._save}><material-icon>save</material-icon><span>Save and Close</span></button>
            <button class="move" @click=${this._move}>
              <material-icon>arrow_forward</material-icon>
              <span>Move To ${this.account === this.src ? 'Dst' : 'Src'}</span>
            </button>
            <button class="delete" @click=${this._delete}><material-icon>delete_forever</material-icon><span>Delete</span></button>

          </div>
        </form>
      `:html`
        <div class="wrapper" @dblclick=${this._startEdit} @click=${this._startTouch}>
          <date-format class="date ${classMap({
            reconciled: this.reconciled,
            passed: Date.now()/1000 > this.date,
            cleared:  cleared,
            repeating: this.repeat !== this.repeats[0].rkey
          })}" .date=${this.date} @click=${this._clearedChanged}></date-format>
          <div class="ref">${this.rno}</div>
          <div class="description">${this.description}</div>
          ${cache(this.amountEdit ? (this.src === this.account ? html`
            <input
              id="amount"
              type="text"
              pattern="^-(0|[1-9][0-9]{0,2}(,?[0-9]{3})*)(\.[0-9]{1,2})?$"
              class="amount ${classMap({error: this.inputError})}" 
              .value=${
                (-this.amount / 100).toFixed(2)}
              @input="${this._amountChanged}"
              @blur=${this._amountUpdate}
              @contextmenu=${this._zeroRequest} 
               @dragstart=${this._noDrag} 
               draggable="true" />
          `:html`
            <input
              id="amount"
              type="text"
              pattern="^(0|[1-9][0-9]{0,2}(,?[0-9]{3})*)(\.[0-9]{1,2})?$"
              class="amount ${classMap({ error: this.inputError })}" 
              .value=${(this.amount / 100).toFixed(2)}
              @input="${this._amountChanged}"
              @blur=${this._amountUpdate}
              @contextmenu=${this._zeroRequest}  
              @dragstart=${this._noDrag} 
              draggable="true" />          
          `):html`
            <div class="amount" 
              @dblclick=${this._startAmountEdit} 
              @click=${this._touchAmountEdit}
              @contextmenu=${this._zeroRequest}>${(this.src === this.account ? '-':'') + (this.amount / 100).toFixed(2)}</div>
          `)}
          <div class="balance">${cleared ? '0.00' : (this.cumulative/100).toFixed(2)}</div>
          <div class="code ${codeType}"></div>
        </div>
      `)}
      
    `;
  }
  get transaction() {
    return {
      amount: this.amount,
      currency: this.currency,
      date: this.date,
      description: this.description,
      dst: this.dst,
      dstamount: this.dstamount,
      dstclear: this.dstclear ? 1 : 0,
      dstcode: this.dstcode,
      id: this.tid,
      reconciled: this.reconciled ? 1: 0,
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
    //only set values if we are not editing.
    if (!this.edit) {
      this.amount = Math.abs(value.amount); //should never be negative
      this.currency = value.currency;
      this.date = value.date;
      this.description = value.description;
      this.dst = value.dst;
      this.dstamount = value.dstamount;
      this.dstclear = value.dstclear !== 0;
      this.dstcode = value.dstcode;
      this.tid = value.id;
      this.reconciled = value.reconciled !== 0;
      this.repeat = value.repeat;
      this.rno = value.rno
      this.src = value.src;
      this.srcclear = value.srcclear !== 0;
      this.srcamount = value.srcamount;
      this.srccode = value.srccode;
      this.version = value.version;
    } else {
      console.log('transaction', value.id, 'not updated');
    }
  }
  _altAccountChanged(e) {
    e.stopPropagation();
    if (this.account === this.src) {
      this.dst = e.detail;
    } else {
      this.src = e.detail;
    }
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
      const newAmount = Math.round(Math.abs(parseFloat(this.amountInput.value) * 100));
      if (newAmount === this.amount) this.amountEdit = false; else this.amount = newAmount; 
    } else {
      this.inputError = true;
    }
  }
  _cancel(e) {
    e.stopPropagation();
    e.preventDefault(); //prevents the form from submitting.
    this.edit = false;
    this.dispatchEvent(new CustomEvent('transaction-changed',{bubbles: true, composed: true, detail: null}));
    
  }
  _clearedChanged(e) {
    e.stopPropagation();
    if (this.reconciled) return;
    if (this.src === this.account) {
      this.srcclear = !this.srcclear;
    } else if (this.dst === this.account) {
      this.dstclear = !this.dstclear;
    }
  }
  _codeChanged(e) {
    e.stopPropagation();
    if (this.account === this.src) {
      this.srccode = e.detail.id === 0 ? null : e.detail.id;
    } else {
      this.dstcode = e.detail.id === 0 ? null : e.detail.id;
    }
  }
  _currencyChanged(e) {
    e.stopPropagation();
    this.currency = e.detail.name;
    this.trate = e.detail.rate;
    if (this.account === this.src) {
      this.srcamount = Math.round(this.amount * this.arate / this.trate);
    } else {
      this.dstamount = Math.round(this.amount * this.arate / this.trate);
    }
  }
  _dateChange(e) {
    e.stopPropagation();
    this.date = e.detail;
  }
  _descriptionChanged(e) {
    e.stopPropagation();
    this.description = e.currentTarget.value;
  }
  _noDrag(e) {
    e.stopPropagation();
    e.preventDefault();
  }
  _repeatChanged(e) {
    e.stopPropagation();
    this.repeat = e.detail
  }
  _save(e) {
//    e.stopPropagation();
//    this.edit = false; //this allows the form to be submitted
  }
  _setCurrencyRate(e) {
    e.stopPropagation();
    this.trate = this.amount * this.arate / (this.account === this.src ? this.srcamount : this.dstamount); 
    api('set_currency', {
      currency: this.currency, 
      rate: this.trate 
    });

  }
  _startAmountEdit(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('amount-edit', {bubbles: true, composed: true}));
    this.amountEdit = true;
  }
  _startEdit(e) {
    e.stopPropagation();
    this.edit = true;
  }
  _startTouch(e) {
    //only respond to a click if its a touch device
    if (!!('ontouchstart' in window || navigator.maxTouchPoints) && !this.amountEdit) this._startEdit(e);
    this.amountEdit = false;
  }
  _switch(e) {
    e.stopPropagation();
    e.preventDefault(); //don't want to sumbit
    const dst = this.src;
    const dstAmount = this.srcamount;
    const dstcode = this.srccode;
    const dstclear = this.srcclear;
    this.src = this.dst;
    this.srcamount = this.dstamount;
    this.srccode = this.dstcode;
    this.srcclear = this.dstclear;
    this.dst = dst;
    this.dstamount = dstAmount;
    this.dstcode = dstcode;
    this.dstclear = dstclear;    
  }
  _touchAmountEdit(e) {
    //only respond to a click if its a touch device
    if (!!('ontouchstart' in window || navigator.maxTouchPoints)) this._startAmountEdit(e);
  }
  _update(e) {
    //we have got a response from our form save
    const response = e.detail;
    if (response.status === 'OK') {
      this.edit = false;
      this.transaction = response.transaction;
      this.dispatchEvent(new CustomEvent('transaction-changed',{bubbles: true, composed: true, detail: response.transaction}));

    } else {
      this.dispatchEvent(new CustomEvent('version-error',{bubbles: true, composed: true}));
    }
  }
  _zeroRequest(e) {
    e.stopPropagation();
    //can't do if transaction is cleared or is a repeated one.
    if (this.repeat !== this.repeats[0].rkey || this.reconcilled || (this.srcclear && this.src === this.account) ||
      (this.dstclear && this.dst === this.account)) return;

    e.preventDefault();
    this.dispatchEvent(new CustomEvent('zero-adjust', {bubbles: true, composed: true, detail: e.currentTarget}));
  }
}
customElements.define('account-transaction', AccountTransaction);
