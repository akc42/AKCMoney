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
import { api } from '../libs/utils.js';
import '../elements/material-icon.js'
import '../elements/account-transaction.js';
import '../elements/calendar-dialog.js';
import '../elements/calendar-input.js';
import '../elements/date-format.js';
import page from '../styles/page.js';
import button from '../styles/button.js';
/*
     <account-page>: Displays the transaction so an account
*/
class AccountPage extends LitElement {
  static get styles() {
    return [page, button, css``];
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
    this.codes = [];
    this.currency = [];
    this.repeats = [];
    this.route = {active: false};
    this.reconciledBalance = 0;
    this.clearedBalance = 0;
    this.minimumBalance = 0;
    this.router = new Route('/','page:account');
  }
  connectedCallback() {
    super.connectedCallback();
    
    api('/standing').then(response => {
      this.codes = response.codes;
      this.currency = response.currency;
      this.repeats = response.repeats;
    }); 
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {

    super.update(changed);
  }
  firstUpdated() {
    this.dragImage = this.shadowRoot.querySelector('#dragim');
    this.dialog = this.shadowRoot.querySelector('#parallel')
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
          grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width));
          grid-template-areas:
            "date ref . amount balance"
            "description description description description description";
        }
        .header {
          margin: 0px 5px;
          background-color: var(--table-heading-background);
          font-weight: bold;
          grid-template-areas:
            "date ref . amount balance"
            "description description description description description";
        }
        .panel {
          grid-template-areas:
            "date description description description balance"
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
          margin: 0px 5px 10px 5px;
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
          cursor: move;
        }
        [draggable].dragging {
          opacity: 0.4;
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
            grid-template-columns: 94px 70px 1fr repeat(2, var(--amount-width));
            grid-template-areas:
              "date ref description amount balance";
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
          <section id="transactions" class="scrollable">
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
                  .index=${i}
                  .balance=${this.balances[i]} 
                  .transaction=${transaction}
                  .account=${this.account.name}
                  .acurrency=${this.account.currency}
                  .arate=${this.account.rate}
                  .accounts=${this.accounts}
                  .currencies=${this.currencies}
                  .codes=${this.codes}
                  @balance-changed=${this._balanceChanged}  
                  @transaction-changed=${this._transactionChanged}
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
  _balanceChanged(e) {
    e.stopPropagation();
    const {balance, index, cleared} = e.changed;
    if (cleared) {
      this.clearedBalance += e.changed.amount;
    }
    const balances = [...this.balances];
    balances[index] = balance;
    this.balances = balances; 

  }
  _dragDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('over');
    const src = parseInt(e.dataTransfer.getData('text/plain'),10);
    let dst = parseInt(e.currentTarget.dataset.index,10);
    console.log('drop', src, 'on', dst);
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
    console.log('drag start', e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.currentTarget.dataset.index);
    e.dataTransfer.setDragImage(this.dragImage,0,0);
  }
  async _fetchAccountData(name) {
    const response = await api('/account', { account: name })
    this.account = response.account;
    if (this.account.name.length > 0) {
      this.startDate = response.startdate;
      this.startType = response.starttype;
      this.reconciledBalance = this.clearedBalance = this.account.balance;
      this.transactions = response.transactions;
      this._rebalance();
    }
  }
  async _insertTransaction(dst,transaction, up) {
    let newdate = Math.floor(this.transactions[dst].date/86400) * 86400 + 43200; //midday
    const dstDay = Math.floor(this.transactions[dst].date / 86400);
    const srcDay = Math.floor(transaction.date / 86400);
    if (up) {
      if (srcDay === dstDay) {
        newdate = Math.ceil(((srcDay * 86400) + this.transactions[dst].date) / 2); //midway from start of day to date of relevant xaction
      } else {
        newdate -= 86400; //mid day the day before
      }
      if (dst > 0) {
        //if previous transaction date is too close we may need to adjust
        newdate = Math.max(newdate, Math.ceil((this.transactions[dst -1].date + this.transactions[dst].date)/2))
      } 
    } else {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > this.transactions[dst].date && Math.floor(currentTime / 86400) === srcDay) {
        newdate = currentTime; //As long as we are after our destination and out day is the same, we can use the current time
      } else  if (srcDay === dstDay) {
        //days the same, so use half way between the dst transaction time and the end of the day
        newdate = Math.floor(((srcDay + 1) * 86400 - 1 + this.transactions[dst].date)/2);
      } else {
        newdate += 86400; //mid day the day after
      }
      if (dst < (this.transactions.length -1)) {
        //If next transaction date is too close we may need to adjust
        newdate = Math.min(newdate, Math.floor((this.transactions[dst + 1].date + this.transactions[dst].date) / 2))
      }
    }
    transaction.date = newdate;
    this.transactions.splice(dst, 0, transaction);  //add our new transaction into place    

    const response = await api('/xaction_date', {
      id: transaction.id, 
      version: transaction.version, 
      date: transaction.date
    });
    if (response.status === 'OK') {
      this.transactions = [...this.transactions];
      this._rebalance();
    } else {
      this.dialog.show();
    }
  }
  _rebalance() {
    let cumulative = this.clearedBalance;
    this.minimumBalance = this.clearedBalance;
    this.balances = [];
    this.balances.push(cumulative);
    for (const transaction of this.transactions) {
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
      this.balances.push(cumulative);
      this.minimumBalance = Math.min(cumulative, this.minimumBalance);
    }

  }
  _reload(e) {
    e.stopPropagation();
    this.transactions = [];
    this._fetchAccountData(this.account.name);  
  }
  _startdateChanged(e) {
    e.stopPropagation();
    this.startDate = e.changed;
  }
  _transactionChanged(e) {
    e.stopPropagation();

  }
}
customElements.define('account-page', AccountPage);