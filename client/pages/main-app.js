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
import '../libs/details-menu-element.js';
import {configPromise} from '../libs/utils.js';

import page from '../styles/page.js';

/*
     <main-app>: Main Page of the Application
*/
class MainApp extends LitElement {
  static get styles() {
    return [page, css``];
  }
  static get properties() {
    return {
      authorised: {type: Boolean}, //set if the user has logged in
      user: {type: Object}, //Set if authorised,
      version: {type: String}, //Version of software
      copyrightYear: {type: String}, //Year of copyright.
      accounts: {type: Array}, //array of account objects
      domains: {type: Array}, //array of domain names
      offsheet: {type: Array}, //array of offsheet count types
    };
  }
  constructor() {
    super();
    this.authorised = false;
    this.user = {}
    this.version = 'v4.0.0'
    this.copyrightYear = '2020';
    configPromise.then(() => {
      this.version = sessionStorage.getItem('version');
      this.copyrightYear = sessionStorage.getItem('copyrightYear');
    })
  }
  connectedCallback() {
    super.connectedCallback();

  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    if(changed.has('authorised') && this.authorised) {
      this.user = JSON.parse(sessionStorage.getItem('user'));
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
        :host {
          height: 100%;
          display: flex;
          flex-direction: column-reverse;
        }
        header {
          height: 64px;
          display:flex;
          flex-direction:row;
          justify-content: flex-start;
          align-items: center;
        }
        nav {
          height: 64px;
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
        }
        #appinfo {
          margin-left: auto;
          display: flex;
          flex-direction: column;
          justify-content:center;
          align-items: flex-start;
        }


        @media (min-width: 500px) {
          :host, .menucontainer {
            flex-direction: column;
          }

        }

      </style>
      <header>
        <img src="/images/money-logo-32x32.png"/>
        ${cache(this.authorised? html`
          <nav>        
            <details>
              <summary>
                Account Transactions
              </summary>
              <details-menu role="menu" @details-menu-select=${this._accountSelect}>
                ${this.accounts.map((account,i) => html`
                  <button type="button" role="menuitem" data-index="${i}">${account.name} (${account.domain})</button>
                `)}
              </details-menu>
            </details>
            <details>
              <summary>
                Domain Accounting
              </summary>
              <details-menu role="menu" @details-menu-select=${this._domainSelect}>
                ${this.domains.map((domain,i) => html`
                  <button type="button" role="menuitem" data-type="domain" data-index=${i}>${domain}</button>
                `)}
                <hr class="menu-separator"/>
                ${this.offsheet.map((sheet,i) => html`
                  <button type="button" role="menuitem" data-type="sheet" data-index=${i}>${sheet}</button>
                `)}
              </details-menu>
            </details>
            <div class="menuitem" @click=${this._profile}>My Profile</div>
            <div class="menuitem" @click=${this._logoff}>Log Off</div>
            ${cache(user.isAdmin ? html`
              <details>
                <summary>
                  Edit Configuration
                </summary>
                <details-menu role="menu" @details-menu-select=${this._edit}>
                  <button id="accounts" type="button" role="menuitem">Accounts</button>
                  <button id="currency" type="button" role="menuitem">Currency</button>
                  <button id="domains" type="button" role="menuitem">Domains</button>
                  <button id="users" type="button" role="menuitem">Users</button>
                </details-menu>
              </details>
          `:'')}
        </nav>
        `: '')}
        <div id="appinfo">
          <div id="version">${this.version}</div>
          <div id="copy">&copy; 2009-${this.copyrightYear} Alan Chandler</div>
        </div>

      </header>
      <section>
        <error-manager></error-manager>
        <session-manager></session-manager>
        ${cache(this.authorised? html`
          <page-manager></page-manager>
        `:'')}
      </section>
    `;
  }
}
customElements.define('main-app', MainApp);