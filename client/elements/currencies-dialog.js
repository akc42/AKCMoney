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
import { api, domHost } from '../libs/utils.js';
import './material-icon.js';
import './dialog-box.js';

import list from '../styles/list.js';

/*
     <currencies-dialog>
*/
class CurrenciesDialog extends LitElement {
  static get styles() {
    return [list,css`
      .currency-icon {
        color: var(--currency-icon-color)
      }
    `];
  }
  static get properties() {
    return {
      currencies: {type: Array},
      currency: {type: String}
    };
  }
  constructor() {
    super();
    this.currencies = [];
    this.currency = '';
    this._gotRequest = this._gotRequest.bind(this);
    this._setRate = this._setRate.bind(this);
    this.eventLocked = true;

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('currencies-request', this._gotRequest);
    this.domHost.addEventListener('currency-rate', this._setRate);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('currencies-request', this._gotRequest);
    this.domHost.removeEventListener('currency-rate', this._setRate);
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
              <span>${currency.name}, ${currency.description}</span>
            </button>
          `))}        
        </div>
      </dialog-box>

    `;
  }
  _currencySelected(e) {
    e.stopPropagation();
    const index =  parseInt(e.currentTarget.dataset.index,10);
    this.currency = this.currencies[index].name;
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('currencies-reply', {detail: {
      key: this.currency,
      visual: this.currency
    }}))
    this.dialog.close();
    this.apiPromise = api('get_currency_rate',{name:this.currency});
    
  }
  async _closing(e) {
    e.stopPropagation();
    const currency = this.currencies.find(c => c.name === this.currency);
    const response = await this.apiPromise; //await the updated value we just received.
    currency.version = response.version;
    currency.rate = response.rate;
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('item-selected', { 
      bubbles: true, composed: true, detail: currency 
    })); //tell the outside world we have a value
    this.eventLocked = false;
  }

  _gotRequest(e) {
    e.stopPropagation();
    if (this.eventLocked) return;
    this.eventLocked = true;
    this.dialog.positionTarget = e.composedPath()[0];
    this.currency = e.detail.key;
    this.dialog.show();

  }
  _setRate(e) {
    e.stopPropagation();
    const currency = e.detail;
    const {version} = this.currencies.find(c => c.name === currency.name);
    currency.version = version;
    api('set_currency_rate', currency).then(response => {
      if(response.status === 'OK') {
        const currency = this.currencies.find(c => c.name === response.name);
        currency.version = response.version;
        currency.rate = response.rate;
      } else {
        throw new Error('Currency Version Error');
      }
    });

  }

}
customElements.define('currencies-dialog', CurrenciesDialog);