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
import {submit} from '../libs/utils.js';

import '../elements/list-selector.js';

import page from '../styles/page.js';
import error from '../styles/error.js';

import button from '../styles/button.js';


/*
     <profile-page>: Page to edit your use account
*/
class ProflePage extends LitElement {
  static get styles() {
    return [page, button, error, css``];
  }
  static get properties() {
    return {
      name: {type: String},
      password: {type: String},
      replica: {type: String},
      account: {type: String},
      domain: {type: String},
      visible: {type: Boolean},
      pneeded: {type: Boolean},
      route: {type: Object},
      message: {type: String}
    };
  }
  constructor() {
    super();
    this.name = '';
    this.password = '';
    this.replica = '';
    this.account = '';
    this.domain = '';

    this.visible = false;
    this.pneeded = false;
    this.route = {active: false};
    this.message = '';
    this._passwordCheck = this._passwordCheck.bind(this);
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
    this.errormessage = this.shadowRoot.querySelector('#errormessage');
  }
  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const user = JSON.parse(sessionStorage.getItem('user'));
      this.name = user.name
      this.domain = user.domain;
      this.account = user.account;
      this.visibile = false;
      if (this.route.query.status !== undefined) {
        this.message = 'Someone else has updated your profile in Parallel.  Try Again';
        this.errormessage.removeAttribute('hidden');        
      } else {
        this.message = '';
        if (this.errormessage) this.errormessage.setAttribute('hidden','');
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        section.page {
          max-width: 600px;
        }
        form {
          margin: 10px;
          padding: 20px;
          border-radius: 5px;
          display: grid;
          grid-gap: 2px;
          grid-template-columns:  repeat(2,calc(var(--name-input-length) + 20px)) 1fr;
          grid-template-rows: repeat(9,25px) 40px;
          grid-template-areas:
            "error error ."
            "userlabel see ."
            "userinput see ."
            "passlabel replabel ."
            "passinput repinput ."
            "domainlabel . ."
            "domainsel . ."
            "accountlabel . ."
            "accountsel accountsel ."
            ". . ."
            ". save save";

        }

        label[for="username"] {
          grid-area: userlabel;
        }
        #see {
          grid-area: see;
        }
        #see material-icon {
          cursor:pointer;
        }
        #username {
          grid-area: userinput;
        }
        label {
          font-weight: bold;
          align-self: end;
        }
        label[for="password"] {
          grid-area: passlabel;
        }
        label[for="replica"] {
          grid-area: replabel;
        }
        #password {
          grid-area: passinput;
        }
        #replica {
          grid-area: repinput;
        }
        label[for="domain"] {
          grid-area: domainlabel;
        }
        #domain {
          grid-area: domainsel;
        }
        label[for="account"] {
          grid-area: accountlabel;
        }
        #account {
          grid-area: accountsel;
        }
        button {
          grid-area: save;
          justify-self: end;
        }
        #errormessage {
          grid-area: error;
        }

      </style>
      <section class="page">
        <h1>My Account</h1>
        <div class="userpreamble">
          <p>This page allows you to update your username, password default domain and/or your default account (the one that will appear when you first login).  If you wish to change your user name, your update will only work if the new name is not already taken.</p>
          <p>If you wish to leave your password as it currently is, then leave the password field blank. Otherwise fill in the password
          field with your new password, and enter the <em>same</em> new password in the confirm field.</p>
          <p><em>Save and Close</em> when you have finished making your changes.</p>
        </div>
        <form id="profile" action="/profile" @submit=${submit} .validator=${this._passwordCheck} @form-response=${this._formResponse}>
          <div id="errormessage" class="error" role="alert" hidden>
            <material-icon>cancel</material-icon><span>${this.message}</span>
          </div>
          <label for="username">Username:</label>
          <input id="username" name="name" .value=${this.name} required @input=${this._nameChange}/>
          <p id="see">
            <material-icon @click=${this._toggleVisibility}>${this.visible ? 'visibility_off' : 'visibility'}</material-icon>
            Click the eye to ${this.visible ? 'hide' : 'show'} password</p>
          <label for="password">Password:</label>
          <input id="password" name="password" type="${this.visible ? 'text':'password'}" .value=${this.password} @input=${this._pwChanged}/>
          <label for="replica">Confirm Password:</label>
          <input id="replica" name="replica" type="${this.visible ? 'text' : 'password'}" .value=${this.replica} @input=${this._repChanged}/>
          <label for="domain">Default Domain</label>
          <input type="hidden" name="domain" .value=${this.domain} />
          <list-selector id="domain" list="domains" .key=${this.domain} .visual=${this.domain} @item-selected=${this._domainChanged}></list-selector>
          <label for="account">Default Account:</label>
          <input type="hidden" name="account" .value=${this.account} />
          <list-selector id="account" list="accounts" .key=${this.account} .visual=${this.account} @item-selected=${this._accountChanged}></list-selector>
          <button type="submit" @click=${this._update}><material-icon>save</material-icon><span>Save and Close</span></button>  
        </form>
      </section>

    `;
  }
  _accountChanged(e) {
    e.stopPropagation();
    this.account = e.detail;
  }
  _domainChanged(e) {
    e.stopPropagation();
    this.domain = e.detail;
  }
  _formResponse(e) {
    e.stopPropagation();
    const response = e.detail;
    if (response !== null) {
      switch (response.status) {
        case 'good':
          this.message = '';
          this.password = '';
          this.replica = ''
          this.errormessage.setAttribute('hidden','');
          this.dispatchEvent(new CustomEvent('user-refresh',{bubbles:true,composed:true,detail:true}));
          break;
        case 'parallel':
          this.message = 'Someone else has updated your profile in Parallel.  Try Again';
          this.errormessage.removeAttribute('hidden');
          this.dispatchEvent(new CustomEvent('user-refresh',{bubbles:true,composed:true,detail:false}));
          break;
        case 'name':
          this.message = 'Name already taken';
          this.errormessage.removeAttribute('hidden');
          break;
        case 'different':
          this.message = 'Password and Confirmation do not match';
          this.errormessage.removeAttribute('hidden');
          break;
      }
    } else if (!this._passwordCheck()) {
      this.message = 'Password and Confirmation do not match';
      this.errormessage.removeAttribute('hidden');
    } else if (this.name.length === 0) {
      this.message = 'Name field Required';
      this.errormessage.removeAttribute('hidden');      
    } else {
      this.message = 'Unknown Error in input';
      this.errormessage.removeAttribute('hidden');  
    }

  }
  _nameChange(e) {
    e.stopPropagation();
    this.name = e.currentTarget.value;
    if (this.name.length > 0) this.errormessage.setAttribute('hidden','');
  }
  _passwordCheck() {
    if (this.password.length > 0) {
      return this.password === this.replica;
    } 
    return this.replica.length === 0; 
  }
  _pwChanged(e) {
    e.stopPropagation();
    this.password = e.currentTarget.value;
  }
  _repChanged(e) {
    e.stopPropagation();
    this.replica = e.currentTarget.value;
  }
  _toggleVisibility(e) {
    e.stopPropagation();
    this.visible = !this.visible
  }
}
customElements.define('profile-page', ProflePage);