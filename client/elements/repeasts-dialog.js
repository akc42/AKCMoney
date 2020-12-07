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
import { domHost } from '../libs/utils.js';
import './material-icon.js';
import './dialog-box.js';

import list from '../styles/list.js';

/*
     <currencies-dialog>
*/
class RepeatsDialog extends LitElement {
  static get styles() {
    return [list,css``];
  }
  static get properties() {
    return {
      repeats: {type: Array},
      repeat: {type: Number}
    };
  }
  constructor() {
    super();
    this.repeats = [];
    this.repeat = '';
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('currencies-request', this._gotRequest);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('currencies-request', this._gotRequest);
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#currenciesmenu');
    this.eventLocked = false;
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <dialog-box id="currenciesmenu" @overlay-closed=${this._closing}>
        <div class="listcontainer">
          ${cache(this.currencies.map((currency, i) => html`
            ${i !== 0 ? html`<hr class="sep"/>` : ''}
            <button type="button" role="menuitem"
              data-index="${i}" @click=${this._currencySelected}>
              <span>${currency}</span>
              ${currency === this.currency ? html`<span><material-icon class="currency-icon">check_box</material-icon></span>` : ''}
            </button>
          `))}
        </div>
      </dialog-box>

    `;
  }
  _currencySelected(e) {
    e.stopPropagation();
    const index =  parseInt(e.currentTarget.dataset.index,10);
    this.currency = this.currencies[index];
    this.dialog.close();
  }
  _closing(e) {
    e.stopPropagation();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('item-selected', { bubbles: true, composed: true, detail: this.currency })); //tell the outside world we have a value
    this.eventLocked = false;
  }
  _gotRequest(e) {
    e.stopPropagation();
    if (this.eventLocked) return;
    this.eventLocked = true;
    this.dialog.positionTarget = e.composedPath()[0];
    this.repeat= e.detail;
    this.dialog.show();

  }

}
customElements.define('repeats-dialog', RepeatssDialog);
