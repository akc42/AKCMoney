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
import {classMap} from '../libs/class-map.js';
import {cache} from '../libs/cache.js';

import Route from '../libs/route.js';
import api from '../libs/post-api.js';
import '../elements/material-icon.js'
import '../elements/account-transaction.js';
import '../elements/calendar-dialog.js';
import '../elements/calendar-input.js';
import '../elements/date-format.js';
import page from '../styles/page.js';
import button from '../styles/button.js';
import menu from '../styles/menu.js';
import error from '../styles/error.js';

/*
     <account-page>: Displays the transaction so an account
*/
class AccountPage extends LitElement {
  static get styles() {
    return [page, button, menu, error, css``];
  }
  static get properties() {
    return {
      accounts: {type:Array},  //order list
      account: {type: Object}, //Account we are talking about 
      transactions: {type: Array},
      balances: {type: Array}, //An array which matches the transactions with a balance value in it
      codes: {type: Array},
      currency: {type: Array},
      repeats: {type: Array},
      route: {type: Object}, //
      reconciledBalance: {type: Number},
      clearedBalance: {type: Number},
      minimumBalance: {type: Number},
      startDate: {type: Number}, //same values as account.startDate.
      startType: {type: String}, //values U (unreconciled), F (financial year end), D (explicit date)
      balanceError: {type: Boolean}
    };
  }
  constructor() {
    super();
    const now = new Date();
    const nowNo = Math.round(now.getTime()/1000);
    this.accounts = [];
    this.account = {name:'', date: nowNo};
    this.transactions = [];
    this.balances = [];
    this.codes = [];
    this.repeats = [];
    this.route = {active: false};
    this.reconciledBalance = 0;
    this.clearedBalance = 0;
    this.minimumBalance = 0;
    this.startDate = nowNo;
    this.startType = 'U';
    this.balanceError = false;
    this.router = new Route('/','page:account');
    this.zeroLocked = true;
    this.selectedIndex = null;
    this.selectedClear = false;

  }


  firstUpdated() {
    this.dragImage = this.shadowRoot.querySelector('#dragim');
    this.dialog = this.shadowRoot.querySelector('#parallel');
    this.zeroMenu = this.shadowRoot.querySelector('#zero');
    this.zeroLocked = false;
  }
  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        let account = route.query.account;
        if ((account ?? '').length === 0) {
          //no query parameter - so try to get an alternative.
          const user = JSON.parse(sessionStorage.getItem('user'));
          account = user.account ?? 'Cash';
        }
        this._fetchAccountData(account, route.query.tid, route.query.open === 'yes');
      }
    }
    if (changed.has('account') && this.account.name.length > 0) {
      this.recbalInput = this.shadowRoot.querySelector('#recbal');
      this.dispatchEvent(new CustomEvent('account-changed', {bubbles: true, composed: true, detail: this.account.name}));
    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>

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
        #newt >material-icon {
          color: var(--add-icon-color);
        }
        #recon > material-icon {
          color: var(--balance-icon-color);
        }
        .action {
          margin: 5px;
          display: grid;
          grid-gap: 5px;
          grid-template-columns: 3fr 1fr 4fr;
          justify-items: flex-start;
          align-items: flex-start;
          grid-template-areas:
            "newt recon recon"
            "U U U"
            "F F F"
            "D D cal";
        }

        #newt {
          grid-area: newt;
        }
        #recon {
          grid-area: recon;
        }
        #U {
          grid-area: U;
        }
        #F {
          grid-area: F;
        }
        #D {
          grid-area: D;
        }
        calendar-input {
          grid-area: cal;
        }
        .header, .panel {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width)) 20px;
          grid-template-areas:
            "date ref . amount balance ."
            "description description description description description description";
        }
        .header {
          margin: 0px 5px;
          background-color: var(--table-heading-background);
          font-weight: bold;

        }

        .header > *, .panel > * {
          border: 1px solid white;
        }
        .panel {
          background-color: var(--table-panel-background);
          margin: 0px 5px ;
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


        [draggable] {
          cursor: pointer;
        }
        [draggable].dragging {
          opacity: 0.4;
          cursor: move;
        }
        [draggable].over:not(.dragging) {
          background-color: var(--drag-over-color);
        }
        #dragim {
          --icon-size:24px;
          color: var(--accounts-icon-color);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: white;
          border: 2px solid navy;
          border-radius: 5px;
          height: 50px;
          width: 50px;
          position: absolute;
          transform: translate(-100px,-100px);
        }
        #parallel {
          max-width: 600px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;

        }
        @media (min-width: 500px) {
          .action {
            grid-template-columns: 4fr 5fr 4fr 2fr;
            grid-template-areas:
              "newt recon U U"
              "newt recon F F"
              ". . D ."
              ". . D cal";
            margin-right: 0px;
          }
          .header, .panel {
            grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width)) 20px;
            grid-template-areas:
              "date ref description amount balance .";
          }
          .header {
            margin-top: 20px;
          }
          
        }
      </style>
      <div id="dragim"><material-icon>topic</material-icon></div>
      <dialog-box id="parallel" position="top">
        <p>We have just noticed that an update to a transaction that you tried failed bacause
        someone else has been editing it in parallel.  Click "Reload" below to re-read the account
        and try again</p>
        <button @click=${this._reload}><material-icon>replay</material-icon><span>Reload</span></button>
      </dialog-box>
      <dialog-box id="zero" @overlay-closed=${this._zeroClosed}>
        <button id="zselect" role="menuitem" @click=${this._zeroAdjust}><material-icon>exposure_zero</material-icon>Balance</button>
      </dialog-box>
      <calendar-dialog noUnset></calendar-dialog>
      <section class="page">
          <h1>${this.account.name}</h1>
          <div class="info">
            <div class="domain"><strong>Domain:</strong> ${this.account.domain}</div>
            <div class="currency">
              <div class="name">Currency For Account:<span id="defcur">${this.account.currency}</span></div>
              <div class="description">${this.account.cdesc}</div>
            </div>
          </div>
          <div class="action">
            <button id="newt" @click=${this._newTransaction}><material-icon>post_add</material-icon>New Transaction</button>
            <button id="recon" @click=${this._reconcile}><material-icon>account_balance_wallet</material-icon>Set Reconciled Balance</button>
            <label id="U" class="radio" @click=${this._selectStart}>
              <input type="radio" name="start" value="U" ?checked=${this.startType === 'U'}><span>Unreconciled Transactions Only</span>
            </label>
            <label id="F" class="radio" @click=${this._selectStart}>
              <input type="radio" name="start" value="F" ?checked=${this.startType === 'F'}><span>Transactions this Financial Year</span>
            </label>
            <label id="D" class="radio" @click=${this._selectStart}>
              <input type="radio" name="start" value="D" ?checked=${this.startType === 'D'}><span>Transactions from Date...</span>
            </label>
            <calendar-input .value=${this.startDate} @value-changed=${this._startdateChanged}></calendar-input>
          </div>
          <div class="header">
            <div class="date">Date</div>
            <div class="ref">Ref</div>
            <div class="description">Description</div>
            <div class="amount">Amount</div>
            <div class="balance">Balance</div>
          </div>
          <div class="panel">          
            <label for="minb" class="description">Minimum Balance</label>
            <div id="minb" class="balance">${(this.minimumBalance/100).toFixed(2)}</div>
          </div>
          <div class="panel">
            <date-format class="date" .date=${this.account.date}></date-format>
            <label for="recbal" class="description">Reconciled Balance</label>
            <input 
              id="recbal" 
              class="balance ${classMap({error: this.balanceError})}"
              pattern="^[-+]?(0|[1-9][0-9]{0,2}(,?[0-9]{3})*)(\.[0-9]{1,2})?$"
              value="${(this.reconciledBalance/100).toFixed(2)}"
              @input=${this._balanceChanged}
              @blur=${this._balanceUpdated}/>
          </div>
          <div class="panel">
            <label for="clearb" class="description">Cleared Balance</label>
            <div id="clearb" class="balance">${(this.clearedBalance/100).toFixed(2)}</div>
          </div>
          <section id="transactions" class="scrollable" @contextmenu=${this._zeroEndBalance}>
            ${cache(this.transactions.map((transaction,i) => html`
              <div
                id="w${transaction.id}" 
                draggable="true" 
                data-index="${i}" 
                @dragstart=${this._dragStart} 
                @dragend=${this._dragEnd}
                @dragenter=${this._dragEnter}
                @dragleave=${this._dragLeave}
                @dragover=${this._dragOver}
                @drop=${this._dragDrop}>
                <account-transaction 
                  id="t${transaction.id}"
                  .index=${i}
                  .balance=${this.balances[i]}
                  .bversion=${this.account.bversion}
                  .transaction=${transaction}
                  .account=${this.account.name}
                  .acurrency=${this.account.currency}
                  .arate=${this.account.rate}
                  .codes=${this.codes}
                  .repeats=${this.repeats}
                  .accounts=${this.accounts}
                  @amount-edit=${this._amountEdit}
                  @balance-changed=${this._balanceChangedXaction} 
                  @clear-changed=${this._clearChanged} 
                  @delete-transaction=${this._deleteTransaction}
                  @selected-changed=${this._selectedChanged}
                  @transaction-changed=${this._transactionChanged}
                  @version-error=${this._versionError};
                  @zero-adjust=${this._zeroMenuRequest}
                  ></account-transaction>
              </div>
            `))}
          </section>
      </section>
    `;
  }
  _amountEdit(e) {
    e.stopPropagation();
    this.shadowRoot.querySelectorAll('account-transaction').forEach(xt => xt.amountEdit = false);
  }
  _balanceChanged(e) {
    e.stopPropagation();
    if (this.recbalInput.reportValidity()) {
      this.balanceError = false;
    } else {
      this.balanceError = true;
    }

  }
  _balanceChangedXaction(e) {
    e.stopPropagation();
    this.clearedBalance += e.details.balance - this.reconciledBalance;
    this.reconciledBalance = this.account.balance = e.details.balance;
    this._rebalance();
  }
  async _balanceUpdated(e) {
    e.stopPropagation();
    if (this.recbalInput.reportValidity()) {
      this.balanceError = false;
      const newAmount = Math.round(parseFloat(this.recbalInput.value) * 100);
      if (newAmount !== this.reconciledBalance) {
        const response = await api('account_balance', {
          balance: newAmount,
          bversion: this.account.bversion,
          account: this.account.name
        });
        if (response.status = 'OK') {
          this.account.bversion = response.bversion;
          this.clearedBalance += newAmount - this.reconciledBalance
          this.reconciledBalance = this.account.balance = newAmount;
        } else {
          this.dialog.show();
        }
      }
    } else {
      this.balanceError = true;
    }   
  }
  _clearChanged(e) {
    e.stopPropagation();
    //changing cleared balance will cause a re-render, so ensure data is correct

    if (e.detail.isSrc) {
      this.transactions[e.detail.index].srcclear = e.detail.set ? 1:0;
    } else {
      this.transactions[e.detail.index].dstclear = e.detail.set ? 1 : 0;
    }
    this.clearedBalance += e.detail.amount;
    if (this.selectedIndex !== null) {
      /*
        At this point we have received an event which implies the user clicked on clear whilst were selected
        so we need to handle that
      */
      const selectedIndex = this.selectedIndex; //remember it to prevent possible infinite loop of events
      this.selectedIndex = null;
      const index = e.detail.index;
      if (selectedIndex < index) {
          for(let i = selectedIndex; i <= index; i++) {
            this._clearSetTransaction(i);
          }
      } else if (selectedIndex > index) {
          for(let i = index; i <= selectedIndex; i++) {
            this._clearSetTransaction(i);
          }
      }
    }
    this._rebalance();
  }

  _clearSetTransaction(i) {
    const transaction = this.transactions[i];
    if (transaction.reconciled === 0) {    
      if (transaction.src === this.account.name) {
        transaction.srcclear = this.selectedClear ? 1 : 0;
      } else {
        transaction.dstclear = this.selectedClear ? 1: 0;
      }
    }
    const xaction = this.shadowRoot.querySelector(`#t${transaction.id}`);
    if (this.selectedClear) {
      xaction.setClear();
    } else {
      xaction.resetClear();
    }
  } 
  _deleteTransaction(e) {
    e.stopPropagation();
    const {tid, index} = e.detail;
    api('xaction_delete', {tid: tid, version: this.transactions[index].version}).then(response => {
      if (response.status = 'OK') {
        this.transactions.splice(index,1);  //remove deleted transaction
//        this.transactions = [...this.transactions];
        this._rebalance();        
      } else {
        this.dialog.show();
      }
    });
  }
  _dragDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('over');
    const src = parseInt(e.dataTransfer.getData('text/plain'),10);
    let dst = parseInt(e.currentTarget.dataset.index,10);
    if (src !== dst) {
      //only move if not dropping on self
      const srcTrans = this.transactions.splice(src, 1); //remove src
      dst = dst - (src < dst? 1: 0); //adjust for removed transaction
      this._insertTransaction(dst, srcTrans[0], src > dst);
    }
    return false
  }
  _dragEnd(e) {
    e.stopPropagation();
    e.currentTarget.classList.remove('dragging');
  }
  _dragEnter(e) {
    e.currentTarget.classList.add('over');
  }
  _dragLeave(e) {
    e.currentTarget.classList.remove('over');
  }
  _dragOver(e) {
    e.preventDefault();
    return false;
  }
  _dragStart(e) {
    e.stopPropagation();
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.currentTarget.dataset.index);
    e.dataTransfer.setDragImage(this.dragImage,0,0);
  }
  async _fetchAccountData(name, tid, edit) {
    let openid = tid ?? 0;
    this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: true}));
    this.transactions = [];
    const response = await api('/account', { account: name , tid: openid})
    this.account = response.account;
    if (this.account.name.length > 0) {
      this.startDate = response.startdate;
      this.startType = response.starttype;
      this.reconciledBalance = this.clearedBalance = this.account.balance;
      
      if (response.transactions.length > 1) {
        const transactionDate = new Date();
        const todayTZOffset = transactionDate.getTimezoneOffset() * 60; //get offset in seconds
        const todayStart = Math.floor(transactionDate.getTime()/86400000) * 86400 - todayTZOffset;
        let previousTransaction = response.transactions[0];        
        for (let i=1; i < response.transactions.length; i++) {
          let previousTime = previousTransaction.date;
          let transaction = response.transactions[i];
          if (openid === 0 && transaction.date > todayStart) openid = transaction.id;
          if (transaction.date - previousTime < 60) {  
            transactionDate.setTime(transaction.date * 1000);
            const TZOffset = transactionDate.getTimezoneOffset() * 60; //get offset in seconds
            let currentDayEnd = ((Math.floor(transaction.date / 86400) + 1) * 86400) - 1 - TZOffset;
            transaction.date = Math.min(previousTime + 60, currentDayEnd); //force it to spread, but not past current day.
            //if we are doing this also move the previous transaction back a little bit if we need to
            if (transaction.date - previousTime < 60) {
              //keep it in the same day, but otherwise a minute away      
              previousTime = Math.max(transaction.date - 60, Math.floor(previousTime/86400) * 86400 - TZOffset);
              if( previousTransaction.date !== previousTime) {
                previousTransaction.date = previousTime;
                const reply = await api('/xaction_date', {
                  id: previousTransaction.id,
                  version: previousTransaction.version,
                  date: previousTransaction.date,
                  account: this.account.name
                });
                if (reply.status === 'OK') {
                  response.transactions[i -1] = reply.transaction;
                } else {
                  this.dialog.show();
                  break;
                }
              }
            }  
            const reply = await api('/xaction_date', {
              id: transaction.id,
              version: transaction.version,
              date: transaction.date,
              account: this.account.name
            });
            if (reply.status === 'OK') {
              response.transactions[i] = reply.transaction;
            } else {
              this.dialog.show();
              break;
            }     
          }
          previousTransaction = response.transactions[i];
        }
        this.transactions = response.transactions;
      } else {
        this.transactions = []; 
      }
      this._rebalance();
      await this.updateComplete;
      if (openid > 0) {
        const wrap = this.shadowRoot.querySelector(`#w${openid}`);
        wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (edit) {
          const xaction = this.shadowRoot.querySelector(`#t${openid}`);
          xaction.edit = true;
        }        
      }
    }
    this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: false}));
  }
  async _insertTransaction(dst,transaction, up) {
    const transactionDate = new Date()
    transactionDate.setTime(transaction.date * 1000);
    const TZOffset = transactionDate.getTimezoneOffset() * 60; //get offset in seconds
    this._printTime('Current source time', transaction.date);
    //work out the limits that the transaction can fit into
    const dstDay = Math.floor((this.transactions[dst].date - TZOffset) / 86400) ;
    //start with begining and end of the destination day
    let lowerLimit = dstDay * 86400;
    let upperLimit = ((dstDay + 1) * 86400) - 1; 
    this._printTime('Initial Lower Limit', lowerLimit);
    this._printTime('Initial Upper Limit', upperLimit);
    if (up) {
      //moving up so upper limit is just before the transaction we are moving past
      upperLimit = this.transactions[dst].date - 1;
      this._printTime('Adjusted Upper Limit', upperLimit);
      if (dst > 0 ) {
        const preDay = Math.floor((this.transactions[dst-1].date - TZOffset) / 86400);
        if (preDay === dstDay) {
          //there is a prior transaction on the same day so we try limit ourselves to after it 
          lowerLimit = this.transactions[dst - 1].date + 1;
          if (lowerLimit > upperLimit) lowerlimit = upperLimit;
          this._printTime('Adjusted Lower Limit', lowerLimit)
        }
      }
    } else {
      //moving down so lower limit is just after the transaction we are moving past
      lowerLimit = this.transactions[dst].date + 1;
      this._printTime('Adjusted Lower Limit', lowerLimit);
      if (dst < (this.transactions.length - 1)) {
        const postDay = Math.floor((this.transactions[dst + 1].date - TZOffset) / 86400);
        if (postDay === dstDay) {
          //There is a further transaction on the same day, so try to limit ourselves to before it
          upperLimit = this.transactions[dst + 1].date - 1;
          if (upperLimit < lowerLimit) upperLimit = lowerLimit;
          this._printTime('Adjusted Upper Limit', upperLimit);
        }
      }
    }
    //fit the new transaction half way between our limits.
    transaction.date = Math.round((lowerLimit + upperLimit)/ 2);
    this._printTime('Adjsted transaction Time', transaction.date);  
    const inspoint = up ? dst : dst + 1
    this.transactions.splice(inspoint, 0, transaction);  //add our new transaction into place    
    if (transaction.id !== 0) { //only update date if transaction is in db (not so when we have just created it)
      const response = await api('/xaction_date', {
        id: transaction.id, 
        version: transaction.version, 
        date: transaction.date,
        account: this.account.name
      });
      if (response.status === 'OK') {
        this.transactions[inspoint] = response.transaction;
        this._rebalance();
      } else {
        this.dialog.show();
      }
    } else {
      this.requestUpdate().then(() => {
        const wrap = this.shadowRoot.querySelector('#w0');
        wrap.scrollIntoView({behavior: 'smooth', block: 'center'});
      });
    }
  }
  _newTransaction(e) {
    const wrap = this.shadowRoot.querySelector('#w0');
    if (wrap === null) {
      const transactionDate = new Date();
      const transaction = {
        amount: 0,
        cd: null,
        ctype: null,
        currency: this.account.currency,
        date: Math.round(transactionDate.getTime()/1000),
        description: '',
        dst: null,
        dstamount: null,
        dstclear: 0,
        dstcode: null,
        id: 0,
        reconciled: 0,
        repeat: 0,
        rno: '',
        src: this.account.name,
        srcamount: null,
        srcclear: 0,
        srccode: null,
        trate: this.account.rate,
        version: 1
      }
      let p;
      for(let i = 0; i < this.transactions.length; i++) {
        if (this.transactions[i].date > transaction.date) break;
        p = i;
      }
      if (p === undefined) {
        this._insertTransaction(0, transaction, true)
      } else {
        this._insertTransaction(p, transaction, false);
      }
    }
  }
  _printTime(reason, time) {

    const d = new Date();
    d.setTime(time * 1000);
    console.log(reason, d.toLocaleString());

  }
  _rebalance() {
    let cumulative = this.clearedBalance;
    this.minimumBalance = this.clearedBalance;
    this.balances = [];
    this.balances.push(cumulative);
    for (const transaction of this.transactions) {
      if (transaction.reconciled === 0 && ((transaction.src === this.account.name && transaction.srcclear === 0) || (
        transaction.dst === this.account.name && transaction.dstclear === 0))) {
        let amount;
        if (transaction.currency === this.account.currency) {
          amount = transaction.amount;
        } else {
          if (transaction.src === this.account.name) {
            amount = transaction.srcamount;
          } else {
            amount = transaction.dstamount;
          }
        }
        if (transaction.src === this.account.name && transaction.srcclear === 0) {
          cumulative -= amount;
        } else if (transaction.dstclear === 0) {
          cumulative += amount;
        }
      }
      this.balances.push(cumulative);
      this.minimumBalance = Math.min(cumulative, this.minimumBalance);
    }
    this.balances.pop(); //last one is extra, so remove it
  }
  async _reconcile(e) {
    e.stopPropagation();
    const response = await api('account_balance',{
      balance: this.clearedBalance, 
      bversion: this.account.bversion, 
      account: this.account.name
    });
    if (response.status = 'OK') {
      this.account.bversion = response.bversion;
      let updateNeeded = false;
      for (let i = 0; i < this.transactions.length; i++) {
        const xactionElement = this.shadowRoot.querySelector(`#t${this.transactions[i].id}`);
        if ((this.transactions[i].reconciled === 1 && 
          ((xactionElement.src === this.account.name && !xactionElement.srcclear) ||
          (xactionElement.dst === this.account.name && !xactionElement.dstclear))) ||
          (this.transactions[i].reconciled === 0 && 
          ((xactionElement.src === this.account.name && xactionElement.srcclear) ||
          (xactionElement.dst === this.account.name && xactionElement.dstclear)))){
          const response = await api('xaction_clear', {
            clear: this.transactions[i].reconciled === 0, //we are not clearing this if we already have it reconciled 
            id: this.transactions[i].id, 
            version: this.transactions[i].version,
            account: this.account.name
          });
          if (response.status === 'OK') {
            this.transactions[i] = response.transaction;
            updateNeeded = true;
          } else {
            this.dialog.show();
            break;
          }
        }
      }
      this.reconciledBalance = this.clearedBalance;
      if (updateNeeded) this.requestUpdate();
    } else {
      this.dialog.show();
    }
  }
  _reload(e) {
    e.stopPropagation();
    this.dialog.close();
    this.transactions = [];
    this._fetchAccountData(this.account.name);  
  }
  _selectedChanged(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.index,10);
    if (this.selectedIndex !== null) {
      if (this.selectedIndex === index) {
        //we just unselected ourself
        this.selectedIndex = null;
        return;
      } else {
        //we've moved the selection rather than just started a new on
        const tid = this.transactions[this.selectedIndex].id
        const transaction = this.shadowRoot.querySelector(`#t${tid}`);
        transaction.selected = false;
      } 
    }
    this.selectedIndex = index;
    this.selectedClear = e.detail;   
  }
  _selectStart(e) {
    e.stopPropagation();
    if (this.startType !== e.currentTarget.id) {
      this.startType = e.currentTarget.id
      this._startChange();
    }
    
  }
  _startChange() {
    api('account_startdate', {
      account: this.account.name,
      dversion: this.account.dversion,
      startdate: this.startType === 'D' ? this.startDate : (this.startType === 'F' ? 0 : null)
    }).then(response => {
      if (response.status === 'OK') {
        this._fetchAccountData(this.account.name);
      } else {
        this.dialog.show();
      }
    });

  }
  _startdateChanged(e) {
    e.stopPropagation();
    this.startDate = e.detail;
    if (this.startType === 'D') this._startChange();
  }
  _transactionChanged(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.index,10);
    if (e.detail === null) {
      if (this.transactions[index].id === 0) {
        this.transactions.splice(index, 1); //remove this transaction
        this._rebalance();
      } else {
        e.currentTarget.transaction = this.transactions[index];  //cancel so reset
      }
    } else {
      const refreshNeeded = (this.transactions[index].id !== e.detail.id);
      const resortNeeded = (this.transactions[index].date !== e.detail.date);
      this.transactions[index] = e.detail;
      if (resortNeeded) {
        this.transactions.sort((a, b) => a.date - b.date);
        this.requestUpdate();
      } else if (refreshNeeded) this.requestUpdate();
    }
  }
  _versionError(e) {
    e.stopPropagation();
    this.dialog.show();
  }
  _zeroAdjust(e) {
    e.stopPropagation();
    const currentEndBalance = this.balances.slice(-1)[0];
 
    let accountAmount = this.account.name === this.zeroTransaction.src ? 
      (this.zeroTransaction.srcamount !== null ? this.zeroTransaction.srcamount: this.zeroTransaction.amount) : 
      (this.zeroTransaction.dstamount !== null ? this.zeroTransaction.dstamount: this.zeroTransaction.amount) ;
    let originalAmount = accountAmount; //remember it
    let swap = false;
    if (Math.abs(currentEndBalance) <= accountAmount) {
      if (this.account.name === this.zeroTransaction.src) {
        accountAmount += currentEndBalance;
        this.zeroTransaction.srcamount = accountAmount;
        this.zeroTransaction.dstamount = this.zeroTransaction.dstamount !== null ? 
          Math.round(this.zeroTransaction.dstamount * accountAmount / originalAmount): null;
      } else {
        accountAmount -= currentEndBalance;
        this.zeroTransaction.dstamount = accountAmount;
        this.zeroTransaction.srcamount = this.zeroTransaction.srcamount !== null ? 
          Math.round(this.zeroTransaction.srcamount * accountAmount / originalAmount): null;
      }
    } else {
      if ((this.account.name === this.zeroTransaction.src && currentEndBalance < 0) || 
        (this.account.name === this.zeroTransaction.dst && currentEndBalance > 0)){
          swap = true;
        //have to swap source and destination
        accountAmount = Math.abs(currentEndBalance) - accountAmount;
      } else if (this.account === this.zeroTransaction.src) {
        accountAmount += currentEndBalance;
        this.zeroTransaction.srcamount = accountAmount;
        this.zeroTransaction.dstamount = this.zeroTransaction.dstamount !== null ? 
          Math.round(this.zeroTransaction.dstamount * accountAmount / originalAmount) : null;
      } else {
        accountAmount -= currentEndBalance;
        this.zeroTransaction.dstamount = accountAmount;
        this.zeroTransaction.srcamount = this.zeroTransaction.srcamount !== null ? 
          Math.round(this.zeroTransaction.srcamount * accountAmount / originalAmount) : null;
      }
    }
    if (swap) {
      api('/xaction_swap_zero', { 
        id: this.zeroTransaction.tid, 
        version: this.zeroTransaction.version,
        ratio: accountAmount / originalAmount,
        index: this.zeroTransaction.index 
      }).then (response => {
        if(response.status === 'OK') {
          this.transactions[response.index] = response.transaction;
          //This should avoid a complete redraw and just update the balances downwards.
          this.zeroTransaction.transaction = response.transaction;
        } else {
          this.dialog.show();
        }
      });
    } else {
      this.zeroTransaction.amount = Math.round(this.zeroTransaction.amount * accountAmount / originalAmount);
    }
    this.zeroMenu.close();
  }
  _zeroClosed(e) {
    e.stopPropagation();
    this.zeroLocked = false;
  }
  _zeroMenuRequest(e) {
    e.stopPropagation();
    if (this.zeroLocked) return;
    this.zeroLocked = true;
    this.zeroTransaction = e.currentTarget;
    this.zeroMenu.positionTarget = e.detail;
    this.zeroMenu.show();

    
  }
}
customElements.define('account-page', AccountPage);