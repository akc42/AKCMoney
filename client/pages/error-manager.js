/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Football Mobile.

    Football Mobile is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Football Mobile is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Football Mobile.  If not, see <http://www.gnu.org/licenses/>.
*/
import { LitElement, html, css } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';


import button from '../styles/button.js';
import page from '../styles/page.js';

import {Debug, configPromise} from '../libs/utils.js';


/*
     <error-manager>: a page which handles errors.
*/
class ErrorManager extends LitElement {
  static get styles() {
    return [button, css`
      .forbidden {
        color: red;
        font-weight: bold;
      }
    `, page];
  }
  static get properties() {
    return {
      anError: {type: Boolean},
      forbidden: {type: Boolean},
      serverDown: {type: Boolean}
    };
  }

  constructor() {
    super();
    configPromise.then(() => {
      this.logger = Debug('error'); //forces logging in default config
    });

    this.anError = false;
    this.forbidden = false;
    this.serverDown = false;
    this._clientError = this._clientError.bind(this);
    this._serverError = this._serverError.bind(this);
    this._promiseRejection = this._promiseRejection.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('error', this._clientError);
    window.addEventListener('app-error', this._clientError);
    window.addEventListener('api-error', this._serverError);
    window.addEventListener('unhandledrejection', this._promiseRejection);
    this.forbidden = false;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('error', this._clientError);
    window.removeEventListener('app-error', this._clientError);
    window.removeEventListener('api-error', this._serverError);
    window.removeEventListener('unhandledrejection', this._promiseRejection);

  }
  render() {
    return html`
      ${cache(this.anError?html`
        <h1>${this.forbidden ? 'Forbidden' : 'Something Went Wrong'}</h1>
        ${cache(this.forbidden ? html`
          <p class="forbidden">You have tried to access a forbidden area.</p>
        `: this.serverDown? html`
          <p>It looks as though the <strong>api server</strong> is not running at the moment.  Please check and then restart</p>
          <button  @click=${this._reset}>Restart</button>
        `:html`
          <p>We are sorry but something has gone wrong with the operation of the site.  The problem has been logged
          with the server and it will be dealt with soon.</p>
          <p>Nevertheless, you may wish to e-mail the web master (<a href="mailto:${sessionStorage.getItem('webmaster')}">${sessionStorage.getItem('webmaster')}</a>) to let
          them know that there has been an issue.</p>             
          <button @click=${this._reset}>Restart</button>
        `)}
      `: '')}
    `;
  }
  _clientError(e) {
    if (this.anError) return;
    e.preventDefault();
    const message = `Client Error:
${e.error.stack}
has occured`;
    this.logger(message);
    this.dispatchEvent(new CustomEvent('error-status',{bubbles: true, composed: true, detail:'error'}));
    this.anError = true;
  }
  _promiseRejection(e) {
    if (this.anError) return;
    e.preventDefault();
    const possibleError = e.reason;

    if (possibleError.type === 'api-error') {
      this._serverError(possibleError)
    } else {
      
      this.logger(possibleError);
      this.dispatchEvent(new CustomEvent('error-status',{bubbles: true, composed: true, detail:'error'}));
      this.anError = true;
    }
  }
  _reset() {
    this.anError = false;
    this.forbidden = false;
    this.serverDown = false;
    this.dispatchEvent(new CustomEvent('error-status',{bubbles: true, composed: true, detail:'reset'}));
    window.location.reload();
  }
  _serverError(e) {
    if (this.anError) return;
//    e.preventDefault();
    //put us back to home
    window.history.pushState({}, null, '/');
    window.dispatchEvent(new CustomEvent('location-altered',{bubbles: true, composed: true}));
    if (e.reason === 403) {
      //unauthorised so log off
      window.dispatchEvent(new CustomEvent('auth-changed', {bubbles: true, composed: true, detail:false}));
      this.forbidden=true;

    }
    if (e.detail !== undefined && isNaN(e.detail)) this.serverDown = true;
    this.dispatchEvent(new CustomEvent('error-status',{bubbles: true, composed: true, detail:'error'}));
    this.anError = true;
  }


}
customElements.define('error-manager', ErrorManager);