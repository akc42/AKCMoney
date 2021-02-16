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
import domHost from '../libs/dom-host.js';
import './dialog-box.js';
import './material-icon.js';

import button from '../styles/button.js';

/*
     <zero-dialog>
*/
class ZeroDialog extends LitElement {
  static get styles() {
    return [button,css`
      :host {
        margin: 5px;
      }
      dialog-box {
        background-color: transparent!important;
      }
      .container {
        background-color: transparent;
        color: var(--color);
        display: flex;
        flex-direction: column;
        align-items: center;
        border: none;
        padding: 5px;
        border-radius:5px;
        box-shadow: 2px 2px 5px 4px var(--shadow-color);
      }
     `];
  }
  static get properties() {
    return {
      
    };
  }
  constructor() {
    super();
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('zero-request', this._gotRequest);

  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('zero-request', this._gotRequest);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#diag');
    this.eventLocked = false;
  }
  render() {
    return html`
      <style>
      </style>
      <dialog-box id="diag" @overlay-closed=${this._dialogClosed} closeOnClick>
        <div class="container">
          <button id="zselect" role="menuitem" @click=${this._replyToCaller}><material-icon>exposure_zero</material-icon> Balance</button>
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
    this.dialog.positionTarget = e.composedPath()[0];
    this.dialog.show();
  }
  _replyToCaller(e) {
    e.stopPropagation();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('zero-reply', { bubbles: true, composed: true }));
    this.dialog.close();

  }

}
customElements.define('zero-dialog', ZeroDialog);