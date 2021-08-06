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


import { LitElement, html } from '../libs/lit-element.js';

import api from '../libs/post-api.js';
import configPromise from '../libs/config-promise.js';
import {switchPath} from '../libs/switch-path.js';

import page from '../styles/page.js';

import Debug from '../libs/debug.js';


import  '../elements/waiting-indicator.js';

import '/api/user.js';  //create user cookie

const debug = Debug('session');



/*
     <session-manager>
*/
class SessionManager extends LitElement {
  static get styles() {
    return page;
  }

  static get properties() {
    return {
      state: {type: String},
      authorised: {type: Boolean},
      user: {type:Object},
    };
  }
  constructor() {
    super();
    this.state = ''
    this.authorised = false;
    this.user = {uid: 0};
    this.email = '';
    this._setState = this._setState.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('session-state', this._setState);
    this.authorised = false;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('session-state', this._setState);
    this.authorised = null;
  }
  update(changed) {
    if (changed.has('authorised')) {
      if (!this.authorised) {
        this.state = 'reset';
      }
      this.dispatchEvent(new CustomEvent('auth-changed',{bubbles: true, composed: true, detail:this.authorised}));
    }
    super.update(changed);
  }
  updated(changed) {
    if (changed.has('state')) {
      debug(`state-changed to ${this.state}`);
      this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:true}));
      switch(this.state) {
        case 'authorised':
          this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:false}));
          this.authorised = true;     
          break;
        case 'error': 
          //just suspend if error
          this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:false}));
          break;
        case 'login':
          import('./login-page.js').then(() => this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:false})));
          break;
        case 'logoff':
          this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:false}));
          //remove the cookie
          document.cookie = `${sessionStorage.getItem('authCookie')}=;expires=Thu, 01 Jan 1970 00:00:01 GMT; Path=/`;
          switchPath('/');
          this.state = 'reset';
          break;
        case 'reset':
          this.authorised = false;
          configPromise().then(() => { //only using this to wait until globals has been read, since this is the first state
            const authTester = new RegExp(`^(.*; +)?${sessionStorage.getItem('authCookie')}=([^;]+)(.*)?$`);
            const matches = document.cookie.match(authTester);
            if (matches) {
              performance.mark('start_user_validate');
              api('validate_user',{}).then(response => {
                this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:false}));
                performance.mark('end_user_validate');
                performance.measure('user_validate', 'start_user_validate', 'end_user_validate');
                if (response.user !== undefined) {
                  sessionStorage.setItem('user', JSON.stringify(response.user));
                  this.state = 'authorised';
                } else {
                  this.state = 'login';
                }
              });
            } else {
              this.state = 'login'
            }
          });

      }
    }
    super.updated(changed);
  }

  render() {
    return html`
      ${this.state === 'login' ? html`<login-page ></login-page>`:''}
    `;
  }
  _setState(e) {
    e.stopPropagation();
    this.state = e.detail;
  }
}
customElements.define('session-manager', SessionManager);
