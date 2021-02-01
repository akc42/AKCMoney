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

import '../elements/form-manager.js';

import page from '../styles/page.js';
import button from '../styles/button.js';
import error from '../styles/error.js';

import { submit } from '../modules/form.js';

/*
     <login-page>: Manages a user login.
*/
class LoginPage extends LitElement {
  static get styles() {
    return [page, button, error, css`
        section.page {
          max-width: 600px;
        }
        form {
          margin: 10px;
          padding: 20px;
          border-radius: 5px;
          display: grid;
          grid-template-columns:  calc(var(--name-input-width) + 20px) 100px;
          grid-template-rows: repeat(5,25px) 40px;
          grid-gap: 2px;
          grid-template-areas:
            "error error"
            "userlabel ."
            "username remember"
            "passwordlabel ."
            "password eye"
            ". login";
          align-items: center;
        }
        [role="alert"] {
          grid-area: error;

        }
        label[for="username"] {
          grid-area: userlabel;
          align-self:end;
          font-weight: bold;
        }
        #username {
          grid-area:username;
          width: var(--name-input-length);
          border:1px solid var(--input-border-color);
        }

        label[for=pwd] {
          grid-area: passwordlabel;
          align-self:end;
          font-weight: bold;
        }
        #pwd {
          grid-area: password;
          width: var(--pw-input-length);
          border:1px solid var(--input-border-color);
        }
        #see {
          grid-area: eye;
          cursor:pointer;
        }
        label[for="rememberme"] {
          grid-area: remember;
        }
        #submit {
          grid-area: login;
          width: 80px;
          justify-self: end;
        }
    `];
  }
  static get properties() {
    return {
      name: {type: String}, //user name
      password: {type: String}, //user password
      remember: {type: Boolean}, //remember flag
      visible: {type: Boolean}, //password visibility
      error: {type: Boolean} //an error (invalid user name or password)
    };
  }
  constructor() {
    super();
    this.name = '';
    this.password = '';
    this.remember = true;
    this.visible = false;
    this.error = false;
  }
  connectedCallback() {
    super.connectedCallback();
    //ensure these are reset every entry, we can leave the name as it last was
    this.password = '';
    this.visible = false;
    this.error = false;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
    this.loginForm = this.shadowRoot.querySelector('#login');
    this.errormessage = this.shadowRoot.querySelector('#errormessage');
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <section class="page">
      
        <h1>Log In</h1>
        <div class="loginpreamble">
          <p>Please enter your username and password to access this accounting system.</p>
          <p>If you do not wish to be remembered on this computer after you close the browser please uncheck the &#8220;<em>Remember Me</em>&#8221; check box</p>
        </div>
        <form id="login" action="/login" @submit=${submit} @form-response=${this._login}>
          <div id="errormessage" class="error" role="alert" hidden>
            <material-icon>cancel</material-icon><span>Invalid Credentials, please try again</span>
          </div>
          <label for="username">Username:</label>
          <input class="field" type="text" name="username" id="username" value="" required @blur=${this._reset}/>
          <label for="rememberme">
            <input name="remember" id="rememberme" type="checkbox" checked @input=${this._reset}/>
              Remember me
          </label> 
          <label for="pwd">Password:</label>
          <input class="field" type="${this.visible? 'text': 'password'}" name="pwd" id="pwd"  @blur=${this._reset}/>
          <p id="see">
            <material-icon @click=${this._toggleVisibility}>${this.visible ? 'visibility_off' : 'visibility'}</material-icon>
            Click the eye to ${this.visible ? 'hide' : 'show'} password</p>
          <button id="submit" type="submit"><material-icon>login</material-icon><span>Log In</span></button>
      </form>
    
    </section> 
  `;
  }

  _login(e) {
    e.stopPropagation();
    const response = e.response;
    if (response) {
      if (response.uid !== undefined) {
        sessionStorage.setItem('user', JSON.stringify(response));
        this.dispatchEvent(new CustomEvent('session-state', {bubbles: true, composed: true, detail: 'authorised'}));
        return;
      }
    }
    this.errormessage.removeAttribute('hidden');
  }
  _reset(e) {
    e.stopPropagation();
    if (this.errormessage) this.errormessage.setAttribute('hidden','');
  }
  _toggleVisibility(e) {
    e.stopPropagation();
    this.visible = !this.visible;
  }
}
customElements.define('login-page', LoginPage);