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
import Route from '../libs/route.js';
import { api } from '../libs/utils.js';
import '../elements/material-icon.js'
import '../elements/account-transaction.js';
import '../elements/calendar-dialog.js';
import '../elements/calendar-input.js';
import '../elements/date-format.js';
import page from '../styles/page.js';
import button from '../styles/button.js';
import menu from '../styles/menu.js';


/*
     <account-page>: Displays the transaction so an account
*/
class AccountPage extends LitElement {
  static get styles() {
    return [page, button, menu, css``];
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
      startType: {type: String} //values U (unreconciled), F (financial year end), D (explicit date)
    };
  }
  constructor() {
    super();
    this.accounts = [];
    this.account = {name:''};
    this.transactions = [];
    this.balances = [];
    this.codes = [];
    this.repeats = [];
    this.route = {active: false};
    this.reconciledBalance = 0;
    this.clearedBalance = 0;
    this.minimumBalance = 0;
    this.router = new Route('/','page:account');
    this.zeroLocked = true;
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {

    super.update(changed);
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
        this._fetchAccountData(route.query.account);
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>

        section.page {
          max-width: 800px;
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
        #newt >material-icon {
          color: var(--add-icon-color);
        }
        #recon > material-icon {
          color: var(--balance-icon-color);
        }
        #makecsv > material-icon {
          color: var(--csv-icon-color);
        }
        #makepdf > material-icon {
          color: var(--pdf-icon-color);
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
            "makecsv makepdf makepdf"
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
        #makecsv {
          grid-area: makecsv;
        }
        #makepdf {
          grid-area: makepdf;
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
          background-color: white;
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
              "newt recon . ."
              "newt recon U U"
              ". . F F"
              ". . D ."
              "makecsv makepdf D cal";
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
        ${this.account.name.length > 0 ? html`
          <h1>${this.account.name}</h1>
          <div class="info">
            <div class="domain"><strong>Domain:</strong> ${this.account.domain}</div>
            <div class="currency">
              <div class="name">Currency For Account:<span>${this.account.currency}</span></div>
              <div class="description">${this.account.cdesc}</div>
            </div>
          </div>
          <div class="action">
            <button id="newt"><material-icon>post_add</material-icon>New Transaction</button>
            <button id="recon"><material-icon>account_balance_wallet</material-icon>Set Reconciled Balance</button>
            <button id="makecsv"><material-icon>insert_chart_outlined</material-icon>Make CSV</button>
            <button id="makepdf"><material-icon>picture_as_pdf</material-icon>Make PDF</button>
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
            <input id="recbal" class="balance" value="${(this.reconciledBalance/100).toFixed(2)}"/>
          </div>
          <div class="panel">
            <label for="clearb" class="description">Cleared Balance</label>
            <div id="clearb" class="balance">${(this.clearedBalance/100).toFixed(2)}</div>
          </div>
          <section id="transactions" class="scrollable" @contextmenu=${this._zeroEndBalance}>
            ${this.transactions.map((transaction,i) => html`
              <div 
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
                  .transaction=${transaction}
                  .account=${this.account.name}
                  .acurrency=${this.account.currency}
                  .arate=${this.account.rate}
                  .codes=${this.codes}
                  .repeats=${this.repeats}
                  .accounts=${this.accounts}
                  @amount-edit=${this._amountEdit}
                  @balance-changed=${this._balanceChanged} 
                  @clear-changed=${this._clearChanged} 
                  @transaction-changed=${this._transactionChanged}
                  @version-error=${this._versionError};
                  @zero-adjust=${this._zeroMenuRequest}
                  ></account-transaction>
              </div>
            `)}
          </section>

        `:html`
          <h1>Problem with Account</h1>
          <p>It appears that the account that is being requested is no longer in the database.  This is probably because someone
              working in parallel with you has deleted it.  You can try to restart the software by
              selecting another account from the menu above, but if that still fails then you should report the fault to
              an adminstrator${this.route.active ? html`<span>, informing them that you had a problem with account name 
              <strong>${this.route.query.account}</strong> not being in the database</span>`:''}.</p>
        `}
      </section>
    `;
  }
  _amountEdit(e) {
    e.stopPropagation();
    this.shadowRoot.querySelectorAll('account-transaction').forEach(xt => xt.amountEdit = false);
  }
  _balanceChanged(e) {
    e.stopPropagation();
    const index = e.currentTarget.index + 1;
    if (index < this.balances.length) {
      this.balances[index] = e.detail;
      if (index < this.transactions.length) { //transactions length is one less than balances.
        //avoid a redraw of entire set of transactions - just update the one transaction (which will propagate)
        const t = this.shadowRoot.querySelector(`#t${this.transactions[index].id}`);
        t.balance = e.detail;
      }
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
  async _fetchAccountData(name) {
    this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: true}));
    this.transactions = [];
    const response = await api('/account', { account: name })
    this.account = response.account;
    if (this.account.name.length > 0) {
      this.startDate = response.startdate;
      this.startType = response.starttype;
      this.reconciledBalance = this.clearedBalance = this.account.balance;
      
      if (response.transactions.length > 1) {
        let previousTransaction = response.transactions[0];        
        for (let i=1; i < response.transactions.length; i++) {
          let previousTime = previousTransaction.date;
          let transaction = response.transactions[i];
          if (transaction.date - previousTime < 60) {
            let currentDayEnd = ((Math.floor(transaction.date / 86400) + 1) * 86400) - 1 ;
            transaction.date = Math.min(previousTime + 60, currentDayEnd); //force it to spread, but not past current day.
            //if we are doing this also move the previous transaction back a little bit if we need to
            if (transaction.date - previousTime < 60) {
              //keep it in the same day, but otherwise a minute away      
              previousTime = Math.max(transaction.date - 60, Math.floor(previousTime/86400) * 86400);
              if( previousTransaction.date !== previousTime) {
                previousTransaction.date = previousTime;
                const reply = await api('/xaction_date', {
                  id: previousTransaction.id,
                  version: previousTransaction.version,
                  date: previousTransaction.date
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
              date: transaction.date
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
    }
    this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: false}));
  }
  async _insertTransaction(dst,transaction, up) {
    this._printTime('Current source time', transaction.date);
    let newdate = Math.floor(this.transactions[dst].date/86400) * 86400 + 43200; //midday
    this._printTime('Midday on destination', newdate);
    const dstDay = Math.floor(this.transactions[dst].date / 86400);
    const srcDay = Math.floor(transaction.date / 86400);
    if (up) {
      if (srcDay === dstDay) {
        this._printTime('Moving up on same day - destination time', this.transactions[dst].date);
        newdate = Math.ceil(((srcDay * 86400) + this.transactions[dst].date) / 2); //midway from start of day to date of relevant xaction
        this._printTime('midway between destination and previous midnight', newdate);
      } else {
        newdate -= 86400; //mid day the day before
        this._printTime('Midday day before destination date', newdate);
      }
      if (dst > 0) {
        //if previous transaction date is too close we may need to adjust
        this._printTime('check if date need adjusting from dest -1', this.transactions[dst -1].date);
        newdate = Math.max(newdate, Math.ceil((this.transactions[dst -1].date + this.transactions[dst].date)/2))
        this._printTime('revised time', newdate);
      } 
    } else {
      if (srcDay === dstDay) {
        this._printTime('Moving down on same day - destination time', this.transactions[dst].date);
        //days the same, so use half way between the dst transaction time and the end of the day
        newdate = Math.floor(((srcDay + 1) * 86400 - 1 + this.transactions[dst].date)/2);
        this._printTime('midway between destination and next midnight', newdate);
      } else {
        newdate += 86400; //mid day the day after
        this._printTime('Midday day after destination date');
      }
      if (dst < (this.transactions.length -1)) {
        //If next transaction date is too close we may need to adjust
        this._printTime('check if date need adjusting from dest + 1', this.transactions[dst + 1].date);
        newdate = Math.min(newdate, Math.floor((this.transactions[dst + 1].date + this.transactions[dst].date) / 2))
        this._printTime('revised time', newdate);
      }
    }
    transaction.date = newdate;
    this.transactions.splice(up? dst: dst + 1, 0, transaction);  //add our new transaction into place    
    if (transaction.id !== 0) { //only update date if transaction is in db
      const response = await api('/xaction_date', {
        id: transaction.id, 
        version: transaction.version, 
        date: transaction.date
      });
      if (response.status === 'OK') {
        transaction = response.transaction;
        this.transactions = [...this.transactions];
        this._rebalance();
      } else {
        this.dialog.show();
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
      if (!transaction.reconcilled) {
        let amount;
        if (transaction.currency === this.account.currency) {
          amount = transaction.amount;
        } else {
          amount = Math.round(transaction.amount * this.account.rate / transaction.trate)
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
  }
  _reload(e) {
    e.stopPropagation();
    this.dialog.close();
    this.transactions = [];
    this._fetchAccountData(this.account.name);  
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
      startdate: this.startType === 'D' ? this.startdate : (this.startType === 'F' ? 0 : null)
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
      e.currentTarget.transaction = this.transactions[index];  //cancel so reset
    } else {
      this.transactions[index] = e.detail;
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