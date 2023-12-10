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
import { LitElement, html, css } from '../libs/lit-element.js'
import {cache} from '../libs/cache.js';
import {classMap} from '../libs/class-map.js';
import config from '../libs/config.js';
import domHost  from '../libs/dom-host.js';
import './material-icon.js';
import './dialog-box.js';

import list from '../styles/list.js';

/*
     <accounts-dialog>
*/
class AccountsDialog extends LitElement {
  static get styles() {
    return [list,css`
      .accounts-icon {
        color: var(--accounts-icon-color);
      }
    `];
  }
  static get properties() {
    return {
      mainMenu: {type: Boolean},
      accounts: {type: Array},
      account: {type: String}
    };
  }
  constructor() {
    super();
    this.mainMenu = false;
    this.accounts = [];
    this.account = '';
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('accounts-request', this._gotRequest);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('accounts-request', this._gotRequest);
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#accountsmenu');
    this.eventLocked = false;
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <dialog-box id="accountsmenu" position="${this.mainMenu ? 'right' : 'target'}" @overlay-closed=${this._closing} closeOnClick>
        <div class="listcontainer ${classMap({reverse: this.mainMenu})}">
          ${!this.mainMenu ? html`
              <button type="button" role="menuitem"
                @click=${this._noAccountSelected}>
                <span>${config.nullAccount}</span>
              </button>
              <hr class="sep"/>
          ` : ''}
          ${cache(this.accounts.map((account, i) => html`
            ${i !== 0 ? html`<hr class="sep"/>` : ''}
            <button type="button" role="menuitem"
              data-index="${i}" @click=${this._accountSelected}>
              <span>${account.name} (${account.domain})</span>
              ${this.mainMenu && account.name === this.account ? html`<span><material-icon class="accounts-icon">check_box</material-icon></span>` : ''}
            </button>
          `))}
        </div>
      </dialog-box>

    `;
  }
  _accountSelected(e) {
    e.stopPropagation();
    const index =  parseInt(e.currentTarget.dataset.index,10);
    this.account = this.accounts[index].name;
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('accounts-reply', {
      detail: {
        key: this.account,
        visual: this.account
      }
    }));
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('item-selected', {
      bubbles: true,
      composed: true,
      detail: this.account
    })); //tell the outside world we have a value
    this.dialog.close();
  }
  _closing(e) {
    e.stopPropagation();
    this.eventLocked = false;
  }
  _gotRequest(e) {
    e.stopPropagation();
    if (this.eventLocked) return;
    this.eventLocked = true;
    this.dialog.positionTarget = e.composedPath()[0];
    this.account = e.detail.key === null ? '': e.detail.key;
    this.dialog.show();

  }
  _noAccountSelected(e){
    e.stopPropagation();
    this.account = '';
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('accounts-reply', {
      detail: {
        key: null,
        visual: config.nullAccount
      }
    }));
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('item-selected', {
      bubbles: true,
      composed: true,
      detail: null
    })); //tell the outside world we have a value
    this.dialog.close()
  }
}
customElements.define('accounts-dialog', AccountsDialog);
