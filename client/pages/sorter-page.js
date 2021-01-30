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

import '../elements/material-icon.js';
import page from '../styles/page.js';
import button from '../styles/button.js';
import { api } from '../libs/utils.js';
import Route from '../libs/route.js';
/*
     <sorter-page>: Sorting Accounts
*/
class SorterPage extends LitElement {
  static get styles() {
    return [page, button, css``];
  }
  static get properties() {
    return {
      domain: {type: String}, //domain we are working on 
      accounts: {type: Array}, //Array of accounts
      selected: {type: Number}, //Index of account which means we insert items above (lower index)
      sorted: {type: Number}, //How many of the top accounts in the current list are now sorted
      route: { type: Object }, //
    };
  }
  constructor() {
    super();
    this.domain = '';
    this.accounts = [];
    this.selected = 0;
    this.sorted = 0;
    this.route = {active: false};
    this.router = new Route('/', 'page:sorter');
    this.priorities = [];
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if (changed.has('domain') && this.domain.length > 0) {
      this.dispatchEvent(new CustomEvent('domain', {bubbles: true, composed: true, detail: this.domain}));
    }
    super.update(changed);
  }

  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        this.domain = route.query.domain;
        this._fetchAcountData();
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        section.page {
          max-width: 450px;
        }
        .scrollable {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin: 0px calc(var(--scrollbar-width) + 5px) 10px 5px;
          display: flex;
          flex-direction: column;
        }
        .wrapper:nth-child(even) {
          background-color: var(--table-even-color);
        }
        .selector {
          height: 10px;
          width: 100%;
          background-color: lightslategrey;
          cursor: pointer;
        }
        .selector.selected {
          background-color: pink;
          cursor: default;
        }
        hr {
          width:100%;
          border-top: 1px -solid var(--menu-separator);
        }
        .account {
          display: flex;
          flex-direction: row;
          cursor: pointer;
        }
        .name {
          width: 240px;
        }
        .domain {
          margin-left: 1em;
          width: 50px;
        }
        .sorting {
          margin-left: 4em;
        }
        .actions {
          display: flex;
          flex-direction: row;
          margin: 0 0 30px 20px;
        }
        #save {
          margin-left: 20px;
        }
      </style>
      <section class="page">
        <header>
          <h1>Account Sorter</h1>
          <h2>Domain: ${this.domain}</h2>
          <div class="actions">
            <button id="cancel" cancel @click=${this._cancel}><material-icon>cancel</material-icon>Cancel</button>
            <button id="save" @click=${this._save}><material-icon>save</material-icon>Save</button>
          </div>
        </header>
        
        <section class="scrollable">
          ${this.accounts.map((account,i) => html`
          <div class="wrapper">
            <div class="selector ${classMap({selected: this.selected === i})}" data-index="${i}" @click=${this._changeSelector}></div>
            <div class="account" data-index="${i}" @click=${this._moveAccount}>
              <div class="name">${account.name}</div>
              <div class="domain">(${account.domain})</div>
              <div class="sorting ${classMap({sorted: account.sort !== null})}" >${(account.sort ?? '')}</div>
            </div>
            <hr/>
          </div>
          `)}
        </section>
      </section>
      
    `;
  }
  _cancel(e) {
    e.stopPropagation();
    //first clear out all the sort flags we may have added
    for(const account of this.accounts) {
      account.sort = null;
    }
    //now restore the ones we saved when we first retrieved the data
    for (const p of this.priorities) {
      const account = this.accounts.find(a => a.name === p.name);
      if (account !== undefined) account.sort = p.sort;
    }
    this.sorted = this.selected = this.priorities.length;
    this._sortAccounts();//now resort the result;
      }
  _changeSelector(e) {
    e.stopPropagation();
    const newSelection = parseInt(e.currentTarget.dataset.index,10);
    if (newSelection === this.selected) return; //ignore if already selected
    if (newSelection > this.sorted) {
      for(let i = this.sorted; i < newSelection ; i++) {
        this.accounts[i].sort = i+1;
      }
      this.sorted = newSelection;
    }
    this.selected = newSelection;
  }
  async _fetchAcountData() {
    const response = await api('sorter_data', {domain: this.domain});
    this.accounts = response.accounts;
    this.priorities = response.accounts.filter(a => a.sort !== null).map(a => Object.create({name:a.name,sort: a.sort}));
    this.sorted = this.selected = this.priorities.length;
  }
  _moveAccount(e) {
    e.stopPropagation();
    const accountIndex = parseInt(e.currentTarget.dataset.index, 10);
  //  if (accountIndex === this.selected) return; //pointless doesn't mean anything
    
    if (accountIndex === (this.selected - 1)) {
      //click one above the selection line says, remove this from sort
      this.accounts[accountIndex].sort = null;
       //we now have one less sorted item, and also the selection moves up one
      this.sorted--;
      this.selected--;
    } else {
      
      if (accountIndex < this.selected) {
        this.accounts[accountIndex].sort = this.selected;
        for(let i = accountIndex; i < this.selected; i++) {
          this.accounts[i].sort--;
        }
        this.selected--;
      } else {
        this.accounts[accountIndex].sort = this.selected + 1;
        for(let i = this.selected; i < Math.min(accountIndex,this.sorted); i++) {
          this.accounts[i].sort++;
        }
        this.selected++;
      }
      if (accountIndex  >= this.sorted) this.sorted++; 
    }
    this._sortAccounts();
  }
  _save(e) {
    e.stopPropagation();
    this.priorities = this.accounts.filter(a => a.sort !== null).map(a => Object.assign({},{ name: a.name, sort: a.sort }));
    api('sorter_save', {domain: this.domain, accounts: this.priorities}).then(() => {
      this.dispatchEvent(new CustomEvent('ad-reread',{bubbles: true, composed: true}));
    });
  }
  _sortAccounts() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    this.accounts.sort((a, b) => {
      if (a.sort !== null) {
        if (b.sort !== null) return a.sort - b.sort;
        return -1; //a definitely comes first
      }
      if (b.sort !== null) return 1; //b definitely comes first
      if (a.domain === this.domain) {
        if (b.domain === this.domain) {
          if (a.name === user.account) return -1;
          if (b.name === user.account) return 1;          
          return a.name.localeCompare(b.name);
        }
        return -1;
      }
      if (b.domain === this.domain) return 1;
      if (a.name === user.account) return -1;
      if (b.name === user.account) return 1;
      if (a.domain === b.domain) return a.name.localeCompare(b.name); //sort by name
      return a.domain.localeCompare(b.domain); //sort by domain
    });   

  }
}
customElements.define('sorter-page', SorterPage);