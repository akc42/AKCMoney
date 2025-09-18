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
import api from '../libs/post-api.js';
import '../elements/material-icon.js';
import '../elements/list-selector.js';
import page from '../styles/page.js';
import button from '../styles/button.js';
import input from '../styles/error.js';
import {Debug} from '../libs/debug.js';

const debug = Debug('admin-accounts');

/*
     <admin-accounts>: Edit the list of accounts and assign them to correct domain and currency
*/
class AdminAccounts extends LitElement {
  static get styles() {
    return [page,button, input,css`
        h3 {
          text-align: center;
        }
        .header {
          margin: 0px -5px 2px 5px;
          background-color: var(--table-heading-background);
          font-weight: bold;
        }
        .header > * {
          border: 1px solid white;
          text-align: center;
        }
        .account, .header {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: 1fr var(--domain-selector-width) var(--currency-selector-width) 20px 80px;
        }
        .account {
          grid-template-areas:
            "name name name name name"
            ". domain currency archive action";
        }
        .header {
           grid-template-areas:
            "name name name name name"
            ". domain currency archive archive";
         
        }
        .name {
          grid-area: name;
        }
        .domain {
          grid-area: domain;
        }
        .currency {
          grid-area: currency;
        }
        .archive, .unarchive {
          grid-area: archive;
          margin-top: 1px;
          cursor: pointer;
          align-self:start;
          justify-self:center;
          box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.48);
          border-radius:2px;
        }
        .archive:active, .archive:hover, .unarchive:active, .unarchive:hover {
          box-shadow: none;
        }

        .archive {
          color:var(--unarchived-icon-color);
        }
        .header .archive {
          color: var(--table-text-color);
          justify-self: start;
          box-shadow: none;
          cursor: default;
        }
        .unarchive {
          color: var(--archived-icon-color);
        }
        .action {
          grid-area: action;
        }
        #newa >material-icon {
          color: var(--add-icon-color);
        }
        .dela >material-icon {
          color:var(--delete-icon-color);
        }
        .scrollable {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin: 0px calc(var(--scrollbar-width) + 5px) 10px 5px;
          display: flex;
          flex-direction: column;
          padding-right: var(--scrollbar-width);
        }
        #newaccount {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin-left: 5px;
        }
        #domainselector.error {
          background-color: var(--input-error-color);
        }
        @media (min-width: 500px) {
          .header {
            grid-template-areas: 
              "name domain currency archive archive"

          } 
          .account {
            grid-template-areas: 
              "name domain currency archive action"
          }
        }    
    `];
  }
  static get properties() {
    return {
      accounts: {type: Array},
      name: {type: String},
      domain: {type: String},
      currency: {type: String},
      route: {type: Object}
    };
  }
  constructor() {
    super();
    this.accounts = [];
    this.name = '';
    this.domain = '';
    this.currency = '';
    this.route = {active: false};
    this.router = new Route('/','page:accounts');
  }
  update(changed) {
    if (changed.has('accounts') && changed.get('accounts') !== undefined && changed.get('accounts').length > 0) {
      this.dispatchEvent(new CustomEvent('ad-reread',{bubbles: true, composed: true}))
    }
    super.update(changed);
  }

  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        this._fetchAccountsData();
      }
    }

    super.updated(changed);
  }
  render() {
    return html`
      <section class="page">
        <h1>Accounts Manager</h1>
        <h3>Accounts List</h3>
        <div class="header">
          <div class="name">Name</div>
          <div class="domain">Domain</div>
          <div class="currency">Currency</div>
          <div class="archive">Archive</div>
          <div class="action"></div>          
        </div>
        <div id="newaccount" class="account">
          <input 
            class="name" 
            id="newname" .value=${this.name} @input=${this._nameChanged} @blur=${this._nameCheck} data-index="-1"/>
          <list-selector 
            id="domainselector"
            class="domain"
            list=${'domains'} 
            .key=${this.domain} 
            .visual=${this.domain} 
            @item-selected=${this._domainChanged}></list-selector>
          <list-selector 
            class="currency"
            .list=${'currencies'} 
            .key=${this.currency} 
            .visual=${this.currency} 
            @item-selected=${this._currencyChanged}></list-selector>
          <button id="newa" class="action" @click=${this._addAccount}><material-icon>post_add</material-icon><span>Add</span></button>
        </div>
        <section class="scrollable">
          ${this.accounts.map((account,i) => html`
            <div class="account">
              <input class="name" .value=${account.name} @input=${this._nameCheck} data-index="${i}" @blur=${this._accountNameChanged}/>
              <list-selector
                class="domain"
                list=${'domains'} 
                .key=${account.domain} 
                .visual=${account.domain} 
                data-index="${i}"
                @item-selected=${this._accountDomainChanged}></list-selector>
              <list-selector
                class="currency"
                .list=${'currencies'} 
                .key=${account.currency} 
                .visual=${account.currency} 
                data-index="${i}"
                @item-selected=${this._accountCurrencyChanged}></list-selector>
              ${account.archived === 0 ? html`
                <material-icon class="archive" @click=${this._archive} data-index="${i}">archive</material-icon>
              `:html`
                <material-icon class="unarchive" @click=${this._unarchive} data-index="${i}">unarchive</material-icon>
              `}
              <button 
                class="dela action"
                data-index="${i}" 
                @click=${this._deleteAccount} 
                @delete-reply=${this._deleteConfirm}><material-icon>delete_forever</material-icon><span>Delete</span></button>
            </div>
                
        `)}
        </section>
      </section>
    `;
  }
  _addAccount(e) {
    const nameInput = this.shadowRoot.querySelector('#newname');
    e.stopPropagation();
    if (this.name.length === 0) {
      nameInput.classList.add('error');
    } else if (this.domain.length > 0 && !nameInput.classList.contains('error')) {
      debug('adding account name', this.name, 'domain', this.domain, 'currency', this.currency);
      api('account_add', {name: this.name, domain: this.domain, currency: this.currency}).then(response => {
        if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
        debug('success adding account name', this.name);
        this.name = ''; //Only reset name as that has to be unique - assume we are keeping exisiting settings
        this.accounts = response.accounts;  
      
      });
    } else {
      const domainselect = this.shadowRoot.querySelector('#domainselector');
      domainselect.classList.add('error');
    }
  }
  
  _accountCurrencyChanged(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const currency = e.detail.name;
    api('account_currency',{
      name: this.accounts[index].name, 
      currency: currency,
      dversion: this.accounts[index].dversion
    }).then(response => {
      if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
      this.accounts = response.accounts;
    });
  }
  _accountDomainChanged(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const domain = e.detail.key;
    api('account_domain', {
      name: this.accounts[index].name,
      domain: domain,
      dversion: this.accounts[index].dversion
    }).then(response => {
      if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
      this.accounts = response.accounts;
    });
  }
  _accountNameChanged(e) {
    e.stopPropagation();
    if (!e.currentTarget.classList.has('error')) {
      if (this.accounts[index].name !== e.currentTarget.value) {
        api('account_name', { old: this.accounts[index].name, new: e.currentTarget.value, dversion: this.accounts[index].dversion }).then(response => {
          if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
          this.accounts = response.accounts;
        });
      }
    }
  }
  _archive(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this._archiveChanged(index,true);
  }
  _archiveChanged(index,archive){
    api('account_archive',{name: this.accounts[index].name, dversion: this.accounts[index].dversion, archive: archive} ).then(response => {
      if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
      this.accounts = response.accounts;
    })
  }
  _currencyChanged(e) {
    e.stopPropagation();
    this.currency = e.detail.name;
  }
  _deleteAccount(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.dispatchEvent(new CustomEvent('delete-request', { 
      bubbles: true, 
      composed: true, 
      detail: `this account (${this.accounts[index].name})` 
    }));
  }
  _deleteConfirm(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    api('account_delete', {name: this.accounts[index].name, dversion: this.accounts[index].dversion}).then(response => {
      if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
      this.accounts = response.accounts;
    });
  }
  _domainChanged(e) {
    e.stopPropagation();
    this.domain = e.detail;
    const domainselect = this.shadowRoot.querySelector('#domainselector');
    domainselect.classList.remove('error');
  }
  async _fetchAccountsData() {
    const response = await api('accounts',{});
    this.currency = response.currency;
    this.accounts = response.accounts;
  }
  _nameChanged(e) {
    e.stopPropagation();
    this.name = e.currentTarget.value;
    e.currentTarget.classList.remove('error');
  }
  _nameCheck(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index,10);
    const name = e.currentTarget.value;
    if (name.length === 0) {
      if (index >= 0) {
        e.currentTarget.classList.add('error'); //must not set name length to nothing on existing account so show error
      }
      return;
    }
    let found = false;
    //check name is unique
    for(let i=0; i< this.accounts.length; i++) {
      if (i !== index) {
        if (this.accounts[i].name.toLowerCase() === name.toLowerCase()) {
          found = true; //name not unique
          break;
        }
      }
    }
    if (found) {
      e.currentTarget.classList.add('error');
    } else {
      e.currentTarget.classList.remove('error');
    }

  }
  _unarchive(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this._archiveChanged(index, false);
  }
}
customElements.define('admin-accounts', AdminAccounts);