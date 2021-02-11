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

import api from '../libs/post-api.js';
import AppKeys from '../libs/app-keys.js';
import configPromise from '../libs/config-promise.js';
import {switchPath} from '../libs/switch-path.js';

import '../elements/material-icon.js';
import '../elements/dialog-box.js';
import '../elements/accounts-dialog.js';
import '../elements/domains-dialog.js';
import '../elements/currencies-dialog.js';
import '../elements/codes-dialog.js';
import '../elements/repeats-dialog.js';
import './error-manager.js';

import csv from '../modules/csv.js';
import pdf from '../modules/pdf.js';


import tooltip from '../styles/tooltip.js';
import menu from '../styles/menu.js';
import './session-manager.js';




/*
     <main-app>: Main Page of the Application
*/
class MainApp extends LitElement {
  static get styles() {
    return [tooltip, menu, css``];
  }
  static get properties() {
    return {
      authorised: {type: Boolean}, //set if the user has logged in
      user: {type: Object}, //Set if authorised,
      version: {type: String}, //Version of software
      copyrightYear: {type: String}, //Year of copyright.
      accounts: {type: Array}, //array of account objects
      account: {type: String}, //last selected account name (one opened when hitting home)
      domains: {type: Array}, //array of domain names
      domain: {type: Array}, //currently selected
      offsheet: {type: Array}, //array of offsheet count types
      currencies: {type: Array}, //Valid Currencies
      repeats: {type: Array}, //Repeat types
      codes: {type: Array}, //Accounting COdes
      serverError: {type: Boolean}, //Set if server error happening
      page: {type: String} //current subpage being displayed
    };
  }
  constructor() {
    super();
    this.authorised = false;
    this.user = {uid: 0, isAdmin: false, account: '', domain: ''}
    this.version = 'v4.0.0'
    this.copyrightYear = '2021';
    this.accounts = [];
    this.account = '';
    this.domains = [];
    this.domain = '';
    this.offsheet =[];
    this.currencies = [];
    this.codes = [];
    this.repeats = [];
    this.serverError = false;
    this.page = '';
    this.domainYear = 0;
    this.code = 0;
    configPromise.then(() => {
      this.version = sessionStorage.getItem('version');
      this.copyrightYear = sessionStorage.getItem('copyrightYear');
    });
    this._keyPressed = this._keyPressed.bind(this);

  }
  connectedCallback() {
    super.connectedCallback();
    this.removeAttribute('unresolved');
    if (this.keys !== undefined && this.authorised) {
      document.body.addEventListener('key-pressed', this._keyPressed);
      this.keys.connect();
    }

  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.keys !== undefined) this.keys.disconnect()
    document.body.removeEventListener('key-pressed', this._keyPressed);
  }
  update(changed) {
    if (changed.has('domain') && this.domain.length > 0) {
      this._fetchAccDom();
      this._fetchOff();
    }
    if (changed.has('user')) {
      if (this.user.uid > 0) {
        import('./page-manager.js');
        document.body.addEventListener('key-pressed', this._keyPressed);
        if (this.keys === undefined) {
          this.keys = new AppKeys(document.body, 'f1 f2 f3 f4 f12');
        } else {
          this.keys.connect();
        }
        if (!changed.has('domain')) {
          this._fetchAccDom();
          this._fetchOff();
        }
      } else {
        if (this.keys !== undefined) this.keys.disconnect()
        document.body.removeEventListener('key-pressed', this._keyPressed);
      }
    }
    super.update(changed);
  }
  firstUpdated() {
    const scrollDiv = document.createElement("div");
    scrollDiv.className = "scrollbar-measure";
    this.shadowRoot.appendChild(scrollDiv);

    // Get the scrollbar width
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.style.setProperty('--scrollbar-width', `-${scrollbarWidth}px`);

    // Delete the DIV
    this.shadowRoot.removeChild(scrollDiv);
  }
  updated(changed) {
    if (changed.has('authorised')) {
      if (this.authorised) {
        this.user = JSON.parse(sessionStorage.getItem('user'));
        if ((this.user.account ?? '').length > 0) this.account = this.user.account;
        if((this.user.domain ?? '').length > 0) this.domain = this.user.domain;
        api('/standing').then(response => {
          this.codes = response.codes;
          this.repeats = response.repeats;
          this.currencies = response.currencies;
        })
      } else {
        this.user = {uid: 0};
      }
    }
    if (changed.has('user')) {
      if (this.user.uid > 0) {
        this.menuIcon = this.shadowRoot.querySelector('#menuicon')
        this.mainMenu = this.shadowRoot.querySelector('#mainmenu');
        this.accountsMenu = this.shadowRoot.querySelector('#accountsmenu');
        this.domainsMenu = this.shadowRoot.querySelector('#domainsmenu');
        this.adminMenu = this.shadowRoot.querySelector('#adminmenu');
        this.extrasMenu = this.shadowRoot.querySelector('#extrasmenu')
      } else {
        this.menuicon = null;
        this.mainMenu = null;
        this.accountsMenu = null;
        this.domainsMenu = null;
        this.adminMenu = null;
        this.extrasMenu = null;
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        :host {
          height: 100%;
          display: flex;
          flex-direction: column-reverse;
        }
        .scrollbar-measure {
          width: 100px;
          height: 100px;
          overflow: scroll;
          position: absolute;
          top: -9999px;
        }
        header {
          height: 64px;
          display:flex;
          flex-direction:row;
          justify-content: space-between;
          align-items: center;
          color: lightgrey;
background: #0073bf;
background: -moz-linear-gradient(top, #e2e5e6 0%, #e2e5e6 4%, #388fcb 7%, #0073bf 50%, #388fcb 100%);
background: -webkit-gradient(left top, left bottom, color-stop(0%, #e2e5e6), color-stop(4%, #e2e5e6), color-stop(7%, #388fcb), color-stop(50%, #0073bf), color-stop(100%, #388fcb));
background: -webkit-linear-gradient(top, #e2e5e6 0%, #e2e5e6 4%, #388fcb 7%, #0073bf 50%, #388fcb 100%);
background: -o-linear-gradient(top, #e2e5e6 0%, #e2e5e6 4%, #388fcb 7%, #0073bf 50%, #388fcb 100%);
background: -ms-linear-gradient(top, #e2e5e6 0%, #e2e5e6 4%, #388fcb 7%, #0073bf 50%, #388fcb 100%);
background: linear-gradient(to bottom, #e2e5e6 0%, #e2e5e6 4%, #388fcb 7%, #0073bf 50%, #388fcb 100%);
-webkit-box-shadow: 0px -5px 31px 4px var(--shadow-color);;
-moz-box-shadow: 0px -5px 31px 4px var(--shadow-color);
box-shadow: 0px -5px 31px 4px var(--shadow-color);
        }
        section {
          height: calc(100vh - 64px);
          margin: 0 5px;
          overflow:hidden;
        }
        #menuicon {
          --icon-size: 40px;
          margin-left: 20px;
          background-color: var(--button-color);
          color: var(--button-text-color);
          border: none;
          border-radius: 5px;
          -webkit-box-shadow: 0px 3px 20px 2px var(--shadow-color);
          -moz-box-shadow: 0px 3px 20px 2px var(--shadow-color);
          box-shadow: 0px 3px 20px 2px var(--shadow-color);
          cursor: pointer;
        }
        button:active {
          box-shadow: none;
        }
        hr.sep {
          width:100%;
          border-top: 1px -solid var(--menu-separator);
        }
        .iconreplace {
          width: var(--icon-size);
          height:var(--icon-size);
          background-color: transparent;
        }
        .menucontainer {
          display: flex;
          flex-direction: column-reverse;
          margin: 2px;
          max-height: 70vh;
          overflow-y:auto;
          overflow-x: hidden;
          scroll-snap-type: y mandatory;

        }
        #mainmenu .menucontainer {
          min-width: 160px;
        }
        #domainsmenu .menucontainer, #adminmenu .menucontainer {
          min-width: 160px;
        }
        #accountsmenu .menucontainer {
          min-width: 160px;
          max-width: 300px;
        }

        details {
          position: relative;
        }
        summary, button {
          cursor: pointer;
        }

        .menu-separator {
          align-self: center;
          margin:0;
        }

        #logo {
          height:32px;
          width: 32px;
          margin-left: 16px;
          background-image: url("/images/money-logo-32x32.png")
        }

        #logocontainer {
          display: flex;
          flex-direction: row;
          justify-content: center;
          flex: 1 0 auto;
        }
        #logo {
          height: 32px;
          width: 32px;
          background-size: 32px 32px;
          background-image: url("/images/money-logo-32x32.png");
        }
        #appinfo {
          display:flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin-right:20px;
        }
        #version {
          font-size: 12px;
        }
        #copy {
          font-size: 8px;
        }
        page-manager[hidden], session-manager[hidden], error-manager[hidden] {
          display: none !important;
        }

        .home-icon {
          color: var(--home-icon-color);
        }
        .accounts-icon {
          color: var(--accounts-icon-color);
        }
        .domains-icon {
          color: var(--domains-icon-color)
        }
        .profile-icon {
          color: var(--profile-icon-color);
        }
        .logoff-icon {
          color: var(--logoff-icon-color);
        }
        .admin-icon {
          color: var(--admin-icon-color);
        }
        .currency-icon {
          color: var(--currency-icon-color);
        }
        .codes-icon {
          color: var(--codes-icon-color);
        }
        .users-icon {
          color: var(--users-icon-color);
        }
        .sort-icon {
          color: var(--sort-icon-color);
        }
        .pdf-icon {
          color: var(--pdf-icon-color);
        }
        .csv-icon {
          color: var(--csv-icon-color);
        }
        .more-icon {
          color: var(--more-icon-color);
        }
        #copy {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
        }

        @media (min-width: 500px) {
          :host, .menucontainer {
            flex-direction: column;
          }
          header {

background: -moz-linear-gradient(top,  #388fcb 0%, #0073bf 50%, #388fcb 93%, #e2e5e6 96%, #e2e5e6 100%);
background: -webkit-gradient(left top, left bottom, color-stop(0%, #388fcb), color-stop(50%, #0073bf), color-stop(93%, #388fcb), color-stop(96%, #e2e5e6), color-stop(100%, #e2e5e6));
background: -webkit-linear-gradient(top,#388fcb 0%, #0073bf 50%, #388fcb 93%, #e2e5e6 96%, #e2e5e6 100%);
background: -o-linear-gradient(top,#388fcb 0%, #0073bf 50%, #388fcb 93%, #e2e5e6 96%, #e2e5e6 100%);
background: -ms-linear-gradient(top,#388fcb 0%, #0073bf 50%, #388fcb 93%, #e2e5e6 96%, #e2e5e6 100%);
background: linear-gradient(to bottom,#388fcb 0%, #0073bf 50%, #388fcb 93%, #e2e5e6 96%, #e2e5e6 100%);
-webkit-box-shadow: -1px 5px 31px 4px var(--shadow-color);;
-moz-box-shadow: 0px 5px 31px 4px var(--shadow-color);
box-shadow: 0px 5px 31px 4px var(--shadow-color);
          }
          #currentdomain {
            font-size: 14px;
            font-weight: bold;
          }
          #copy {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          #copyyear {
            margin-right: 1em;
          }
        }


      </style>

      <waiting-indicator></waiting-indicator>
      ${cache(this.authorised?html`
        <currencies-dialog .currencies=${this.currencies}></currencies-dialog>
        <repeats-dialog .repeats=${this.repeats}></repeats-dialog>
        <codes-dialog .codes=${this.codes}></codes-dialog>
        <domains-dialog .domains=${this.domains}></domains-dialog>
        <accounts-dialog id="accountsmenu" .accounts=${this.accounts}></accounts-dialog>
        <dialog-box id="mainmenu" closeOnClick>
          <div class="menucontainer">
            <button type="button" role="menuitem" @click=${this._goHome}>
              <material-icon class="home-icon">home</material-icon><span>Home</span> <span>F2</span>
            </button>
            ${this.accounts.length > 0 || this.domains.length > 0 || this.offsheet.length > 0 ? html`
              <hr class="sep"/>
            `:``}
            ${this.accounts.length > 0 ? html`
              <button type="button" id="am" role="menuitem" @click=${this._accountsMenu} @item-selected=${this._accountSelected}>
                <material-icon class="accounts-icon">topic</material-icon>
                <span>Accounts</span>
                <span><material-icon>navigate_next</material-icon></span>
              </button>
            `: ''}
            ${this.domains.length > 0 || this.offsheet.length > 0 ? html`
              <button type="button" id="dm" role="menuitem" @click=${this._domainsMenu}>
                <material-icon class="domains-icon">domain</material-icon>
                <span>Domains</span>
                <span><material-icon>navigate_next</material-icon></span>
              </button>
            `: ''}
            <hr class="sep"/>
            <button type="button" id="profile" role="menuitem" @click=${this._editProfile}>
              <material-icon class="profile-icon">account_box</material-icon><span>Edit Profile</span> <span>F12</span>
            </button>
            <button id="em" type="button" role="menuitem" @click=${this._extrasMenu}>
              <material-icon class="more-icon">more_horiz</material-icon><span>Extras</span>
              <span><material-icon>navigate_next</material-icon></span>
            </button>
            <button type="button" role="menuitem" @click=${this._logoff}>
              <material-icon class="logoff-icon">exit_to_app</material-icon><span>Log Off</span>
            </button>
            ${this.user.isAdmin ? html`
              <button id="ad" type="button" role="menuitem" @click=${this._adminMenu}>
                <material-icon class="admin-icon">font_download</material-icon>
                <span>Admin</span><span><material-icon>navigate_next</material-icon></span>
              </button>
            `:''}
          </div>
        </dialog-box>

        <dialog-box id="domainsmenu" position="right" closeOnClick>
          <div class="menucontainer">
            ${this.domains.map((domain, i) => html`
              <button type="button" role="menuitem"
                data-index=${i} @click=${this._domainSelected}>
                <span>${domain}</span>
                ${domain === this.domain ? html`<span><material-icon class="domains-icon">check_box</material-icon></span>` : ''}
              </button>
            `)}
            ${this.offsheet.length > 0 ? html`<hr class="sep"/>`:''}
            ${this.offsheet.map((sheet, i) => html`
              <button type="button" role="menuitem"
                data-index=${i} @click=${this._offsheetSelected}><span>${sheet.description}</span></button>
            `)}
          </div>
        </dialog-box>
        <dialog-box id="extrasmenu" position="right" closeOnClick>
          <div class="menucontainer">
            ${cache((this.page === 'account' || this.page === 'domain' || this.page === 'offsheet') ? html`
              <button id="pdf" type="button" role="menuitem" @click=${this._makePDF}>
                <material-icon class="pdf-icon">picture_as_pdf</material-icon><span>Make ${
                  this.page === 'domain' ? 'Domain' : 'Account'} PDF</span>
              </button>
            `:'')}
            ${cache((this.page === 'account' || this.page === 'domain') ? html`
              <button id="csv" type="button" role="menuitem" @click=${this._makeCSV}>
                <material-icon class="csv-icon">insert_chart_outlined</material-icon><span>Make ${
              this.page.charAt(0).toUpperCase() + this.page.slice(1)} CSV</span>
              </button>
            `:'')}
            <button type="button" id="sorter" role="menuitem" @click=${this._editSorter}>
              <material-icon class="sort-icon">format_line_spacing</material-icon><span>Sort Accounts</span>
            </button>
          </div>
        </dialog-box>
        ${this.user.isAdmin === 1 ? html`
          <dialog-box id="adminmenu" position="right" closeOnClick>
            <div class="menucontainer">
                <button id="accounts" type="button" role="menuitem" @click=${this._selectPage}>
                  <material-icon class="accounts-icon">topic</material-icon><span>Accounts</span>
                </button>
                <button id="domains" type="button" role="menuitem" @click=${this._selectPage}>
                  <material-icon class="domains-icon">domain</material-icon><span>Domains</span>
                </button>
                <button id="currencies" type="button" role="menuitem" @click=${this._selectPage}>
                  <material-icon class="currency-icon">local_atm</material-icon><span>Currency</span></button>

                <button id="codes" type="button" role="menuitem" @click=${this._selectPage}>
                  <material-icon class="codes-icon">qr_code</material-icon><span>Accounting Codes</span>
                </button>
                <button id="users" type="button" role="menuitem" @click=${this._selectPage}>
                  <material-icon class="users-icon">people</material-icon><span>Users</span>
                </button>
            </div>
          </dialog-box>
        `:''}
      `:'')}
      <header>
        ${cache(this.authorised  && !this.serverError ? html`
          <button id="menuicon"  class="right" @click=${this._menu} data-tooltip="Main Menu">
            <material-icon>menu</material-icon>
          </button>
        `: html`<div class="iconreplace"></div>`)}
        <div id="logocontainer" data-tooltip="AKCMoney">
          ${cache(this.domain.length > 0 ? html`<div id="currentdomain">Domain: ${this.domain}</div>`:html`<div id="logo"></div>`)}
        </div>
        <div id="appinfo">
          <div id="version">${this.version}</div>
          <div id="copy">
            <div id="copyyear">&copy; 2009-${this.copyrightYear}</div>
            <div id="owner">Alan Chandler</div>
          </div>
        </div>

      </header>
      <section>
        <error-manager
          ?hidden=${!this.serverError}
          @error-status=${this._errorChanged};
          @auth-changed=${this._authChanged}></error-manager>
        <session-manager
          ?hidden=${this.authorised || this.serverError}
          id="session"
          @auth-changed=${this._authChanged}></session-manager>
        ${cache(this.authorised ? html`
          <page-manager
            id="pages"
            .account=${this.account}
            .domain=${this.domain}
            .domains=${this.domains}
            .accounts=${this.accounts}
            .codes=${this.codes}
            .repeats=${this.repeats}
            ?hidden=${this.serverError}
            @code-changed=${this._codeChanged}
            @domain-changed=${this._domainChanged}
            @account-changed=${this._accountChanged}
            @domain-year-changed=${this._domainYearChanged}
            @page-changed=${this._pageChanged}
            @user-refresh=${this._userRefresh}
            @ad-reread=${this._fetchAccDom}
            @of-reread=${this._fetchOff}
            @currencies-reread=${this._fetchCurrencies}></page-manager>

        `: '')}
      </section>
    `;
  }
  _accountChanged(e) {
    e.stopPropagation();
    this.account = e.detail;
  }
  _accountSelected(e) {
    e.stopPropagation();
    this.account = e.detail;
    this.accountsMenu.mainMenu = false;
    this.mainMenu.close();
    switchPath('/account', {account: this.account});
  }
  _accountsMenu(e) {
    e.stopPropagation();
    if (this.accountsMenu) {
      this.accountsMenu.mainMenu = true;
      const menu = this.shadowRoot.querySelector('#am');
      menu.dispatchEvent(new CustomEvent('accounts-request', {bubbles:true, composed:true, detail:{key:this.account}}));
    }
  }
  _adminMenu(e) {
    e.stopPropagation();
    if (this.adminMenu) {
      this.adminMenu.positionTarget = this.shadowRoot.querySelector('#ad')
      this.adminMenu.show();
    }
  }
  _authChanged(e) {
    e.stopPropagation();
    this.authorised = e.detail;
  }
  _codeChanged(e) {
    e.stopPropagation();
    this.code = e.detail;
  }
  _domainChanged(e) {
    e.stopPropagation();
    this.domain = e.detail;
  }
  _domainSelected(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.domain = this.domains[index];
    this.domainsMenu.close();
    this.mainMenu.close();
    switchPath('/domain', { domain: this.domain });
  }
  _domainsMenu(e) {
    e.stopPropagation();
    if (this.domainsMenu) {
      this.domainsMenu.positionTarget = this.shadowRoot.querySelector('#dm');
      this.domainsMenu.show();
    }

  }
  _domainYearChanged(e) {
    e.stopPropagation();
    this.domainYear = e.detail;
  }
  _editProfile(e) {
    e.stopPropagation();
    this.mainMenu.close()
    switchPath('/profile');
  }
  _editSorter(e) {
    e.stopPropagation();
    this.extrasMenu.close();
    this.mainMenu.close();
    switchPath('/sorter', {domain: this.domain});
  }
  _errorChanged(e) {
    e.stopPropagation();
    if (e.detail === 'error') {
      this.serverError = true;
    } else if (e.detail === 'reset') {
      this.serverError = false;
      this.dispatchEvent(new CustomEvent('session-state', { bubbles: true, composed: true, detail:'reset'}));
    }
  }
  _extrasMenu(e) {
    e.stopPropagation();
    if (this.extrasMenu) {
      this.extrasMenu.positionTarget = this.shadowRoot.querySelector('#em');
      this.extrasMenu.show();
    }
  }
  async _fetchAccDom() {
    const response = await api('account_domain_lists',{domain: this.domain});
    this.accounts = response.accounts;
    this.domains = response.domains;

  }
  async _fetchCurrencies(e) {
    e.stopPropagation();
    const response = await api('currencies_refresh',{});
    this.currencies = response.currencies;
  }
  async _fetchOff() {
    const response = await api('offsheet_list', { domain: this.domain });
    this.offsheet = response.offsheet
  }
  _goHome(e) {
    e.stopPropagation();
    this.account = this.user.account;
    this.domain = this.user.domain;
    this.mainMenu.close();
    switchPath('/account', {account: this.account});
  }
  _keyPressed(e) {
    e.stopPropagation();
    e.preventDefault();
    switch (e.key) {
      case 'f2':
        switchPath('/');
        break;
      case 'f3':
        this._menu(e)
        this._accountsMenu(e);
        break;
      case 'f4':
        this._menu(e);
        this._domainsMenu(e);
        break;
      case 'f5':
        this._menu(e);
        this._adminMenu(e);
        break;
      case 'f12':
        switchPath('/profile');
        break;
    }
  }
  _logoff(e) {
    e.stopPropagation();
    this.authorised = false;
    this.user = { uid: 0, isAdmin: false, account: '', domain: '' };
    this.dispatchEvent(new CustomEvent('session-state', { bubbles: true, composed: true, detail:'logoff'}));
  }
  _makeCSV(e) {
    e.stopPropagation()
    this.extrasMenu.close();
    this.mainMenu.close();
    switch (this.page) {
      case 'account':
        csv('account', { account: this.account });
        break;
      case 'domain':
        csv('domain', { domain: this.domain, year: this.domainYear });
        break;
    }

  }
  _makePDF(e) {
    e.stopPropagation();
    this.extrasMenu.close();
    this.mainMenu.close();
    switch (this.page) {
      case 'account':
        pdf('account', { account: this.account });
        break;
      case 'domain' :
        pdf('domain',{domain: this.domain, year: this.domainYear});
        break;
      case 'offsheet':
        pdf('offsheet',{code: this.code});
        break;
    }
    
  }
  _menu(e) {
    e.stopPropagation();
    if(this.mainMenu) {
      this.mainMenu.positionTarget = this.menuIcon;
      this.mainMenu.show();
    }
  }
  _offsheetSelected(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.domainsMenu.close();
    this.mainMenu.close();
    switchPath('/offsheet', this.offsheet[index]);
  }
  _pageChanged(e) {
    e.stopPropagation();
    this.page = e.detail.toLowerCase();  //useful to know for menu
  }
  _selectPage(e) {
    e.stopPropagation();
    const target = e.currentTarget.id;
    this.adminMenu.close();
    this.mainMenu.close();
    switchPath(`/admin/${target}`);
  }
  _userRefresh(e) {
    e.stopPropagation();
    const status = e.detail;
    //the following two statements will cause a re-validation of user.
    this.authorised = false;
    this.dispatchEvent(new CustomEvent('session-state',{bubbles: true, composed: true, detail:'reset'}));
    if (status) {
      switchPath('/');  //successfully updated profile
    } else {
      switchPath('/profile', {status: 'parallel'}); //failed because of parallel update, so re-enter;
    }
  }
}
customElements.define('main-app', MainApp);
