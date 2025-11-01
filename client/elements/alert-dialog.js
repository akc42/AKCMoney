/**
@licence
    Copyright (c) 2025 Alan Chandler, all rights reserved

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
import {unsafeHTML} from '../libs/unsafe-html.js';

import domHost from '../libs/dom-host.js';
import './dialog-box.js';
import './material-icon.js';


/*
     <alert-dialog>
*/
class AlertDialog extends LitElement {
  static styles = [css`
    :host {
      margin: 0px;
    }
    dialog-box {
      background-color: transparent!important;
    }
    .container {
      background-color: white;
      color: var(--color);
      display: flex;
      flex-direction: column;
      align-items: center;
      border: none;
      padding: 5px;
      border-radius:5px;
      box-shadow: 2px 2px 5px 4px var(--shadow-color);
      }
      h1 {
        color: red;
      }
      p {
        color: black;
      }
  `];
  
  static properties = {
    message: {type: String}    
  };
  
  constructor() {
    super();
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;
    this.message = ''

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('alert-request', this._gotRequest);

  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('alert-request', this._gotRequest);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#diag');
    this.eventLocked = false;
  }
  render() {
    return html`
      <dialog-box id="diag" @overlay-closed=${this._dialogClosed} closeOnClick position="centre">
        <div class="container">
          <h1>Alert</h1>
          <p>${unsafeHTML(this.message)}</p>
        </div>
      </dialog-box>
    `;
  }
  _dialogClosed(e) {
    this.eventLocked = false;
  }

  _gotRequest(e) {
    e.stopPropagation();
    if (this.eventLocked) return;
    this.eventLocked = true;
    this.message = e.detail;
    this.dialog.show();
  }
}
customElements.define('alert-dialog', AlertDialog);