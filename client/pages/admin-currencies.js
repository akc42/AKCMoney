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
import {classMap} from '../libs/class-map.js';

import '../elements/material-icon.js';
import '../elements/list-selector.js';

import page from '../styles/page.js';
import button from '../styles/button.js';
import error from '../styles/error.js';
import { api } from '../libs/utils.js';
import Route from '../libs/route.js';
/*
     <admin-currencies>: Manage Currencies
*/
class AdminCurrencies extends LitElement {
  static get styles() {
    return [page, button, error, css``];
  }
  static get properties() {
    return {
      currencies: {type: Array}, //Array of currencies
      default: {type: String},
      defaultDesc: {type: String},
      selected: {type: Number}, //Index of currency which means we insert items above (lower index)
      sorted: {type: Number}, //How many of the top currencies in the current list are now sorted
      route: { type: Object }, //
      rate: {type: Number} //rate to use when editing rate
    };
  }
  constructor() {
    super();
    this.currencies = [];
    this.selected = 0;
    this.sorted = 0;
    this.default = '';
    this.defaultDesc = '';
    this.route = {active: false};
    this.router = new Route('/', 'page:currencies');
    this.default = '';
    this.defaultDesc = '';
    this.rate = 0;
    this.overlayLocked = true;
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#ratesetter');
    this.overlayLocked = false;
  }

  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        this.domain = route.query.domain;
        this._fetchCurrencyData();
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        section.page {
          max-width: 450px;
        }
        .dcurrency {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          margin: 5px;
        }
        .dcurrency .name {
          margin-left: 20px;
        }
        .header {
          margin: 0px -5px 2px 5px;
          background-color: var(--table-heading-background);
          font-weight: bold;
        }
        .header > * {
          border: 1px solid white;
          text-align: center;
        }
        .currency, .header {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: 1fr var(--currency-selector-width) 60px 100px;
          grid-template-areas:
            "description description description description" 
            ". name show rate";
        }
        .currency {
          cursor: pointer;
        }
        .description {
          grid-area: description;
        }
        .name {
          grid-area: name;
        }
        .show {
          grid-area: show;
        }
        .rate {
          grid-area: rate;
        }


        .scrollable {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin: 0px calc(var(--scrollbar-width) + 5px) 10px 5px;
          display: flex;
          flex-direction: column;
        }

        .wrapper:nth-child(even) {
          background-color: var(--table-even-color);
        }
        .selector {
          height: 10px;
          width: 100%;
          background-color: lightslategrey;
          cursor: pointer;
        }
        .selector.selected {
          background-color: pink;
          cursor: default;
        }
        hr {
          width:100%;
          border-top: 1px -solid var(--menu-separator);
        }
        .dcurrency {
          display: flex;
          flex-direction: row;
          cursor: pointer;
        }
        .name {
          width: var(--currency-selector-width);
        }

        .sorting {
          margin-left: 4em;
        }
        .actions {
          display: flex;
          flex-direction: row;
          margin: 0 0 30px 20px;
        }
        #save {
          margin-left: 20px;
        }
        #ratewrap {
          display: grid;
          padding: 2px;
          display: grid;
          background-color: var(--form-background-color);
          color: var(--form-text-color);
          grid-gap: 5px;
          grid-template-columns: 80px 10px 80px;
          grid-template-areas:
            "label . ."
            "input input ."
            "save . cancel";
        }
        #ratewrap label {
          grid-area: label;
          font-weight: bold;
        }
        #ratewrap input {
          grid-area: input;
        }
        #ratewrap button {
          grid-area: save;
        }
        #ratewrap button[cancel] {
          grid-area: cancel;
        }

        @media (min-width: 500px) {
          .currency, .header {
            grid-template-areas:
              "description name show rate";
          }
        }
      </style>
      <dialog-box id="ratesetter" @overlay-closed=${this._closed} @overlay-closing=${this._closing}>
        <div id="ratewrap">
          <label for="rate">Rate</label>
          <input id="rate" .value=${this.rate} required pattern="[0-9]+\.[0-9]+" @input=${this._rateChanged} />
          <button @click=${this._rateSave}><material-icon>save</material-icon><span>Save</span></button>
          <button cancel @click=${this._rateCancel}><material-icon>cancel</material-icon><span>Cancel</span></button> 
        </div> 
      </dialog-box>
      <section class="page">
        <header>
          <h1>Currency Management</h1>
          <div class="dcurrency">
            <div class="description">Default Currency: ${this.defaultDesc}</div>
            <list-selector
              class="name"
              .list=${'currencies'} 
              .key=${this.default} 
              .visual=${this.default} 
              @item-selected=${this._defaultChanged}></list-selector>
          </div>
        </header>
        <div class="header">
          <div class="description">Description</div>
          <div class="name">Name</div>
          <div class="show">View?</div>
          <div class="rate">Rate</div>
        </div>
        <section class="scrollable">
          ${this.currencies.map((currency,i) => html`
          <div class="wrapper">
            ${i !== 0? html`
              <div class="selector ${classMap({ selected: this.selected === i })}" data-index="${i}" @click=${this._changeSelector}></div>
            `:''}
            <div class="currency" data-index="${i}" @click=${this._moveCurrency}>
              <div class="description">${currency.description}</div>
              <div class="name">${currency.name}</div>
              <div class="show ${classMap({sorted: currency.display !== 0})}" >${currency.display !== 0 ? html`
                <material-icon>visibility</material-icon>
              `:''}</div>
              <div class="rate" @click=${this._setRate} data-index="${i}" >${currency.display === 1 ? currency.rate:''}</div>
            </div>
            <hr/>
          </div>
          `)}
        </section>
      </section>
      
    `;
  }

  _changeSelector(e) {
    e.stopPropagation();
    const newSelection = parseInt(e.currentTarget.dataset.index,10);
    if (newSelection === this.selected) return; //ignore if already selected
    if (newSelection <= this.sorted) {
      this.selected = newSelection;
    }
  }
  _closed(e) {
    e.stopPropagation();
    this.overlayLocked = false;
  }
  _closing(e) {
    e.stopPropagation();
    if (!this.rateCanClose) e.preventDefault();
  }
  async _defaultChanged(e) {
    e.stopPropagation();
    const newDefault = e.detail.name;
    const index = this.currencies.findIndex(currency => currency.name === newDefault);
    if (index < 0) throw new Error(`Cannot find default currency:${newDefault} in displayable currencies`);
    const rateDivider = this.currencies[index].rate;
    for(let i = 0; i< this.currencies.length; i ++) {
      if (i !== index) {
        if (this.currencies[i].priority !== null) {
          this.currencies[i].rate = this.currencies[i].rate / rateDivider;
          if (i < index) this.currencies[i].priority++;
          const response = await api('currency_rate', this.currencies[i]);
          if (response.status !== 'OK') throw new Error(response.status);
          this.currencies[i].version++;
        }
      } else {
        this.currencies[i].rate = 1.0;
        this.currencies[i].priority = 0;
        if (this.currencies[i].display === 0) {
          this.currencies[i].display = 1;
          this.sorted++;
        }
      }
    }
    this.default = newDefault;
    const response = await api('currency_default', this.currencies[index]);
    if (response.status !== 'OK') throw new Error(response.status)
    this.currencies[index].version++;
    this._sortCurrencies();
  }
  async _fetchCurrencyData() {
    const response = await api('currency_data', {});
    this.currencies = response.currencies;
    this.sorted = this.currencies.filter(c => c.display === 1).length;
    this.selected = this.sorted;
    if (this.currencies.length > 0) {
      this.default = this.currencies[0].name;
      this.defaultDesc = this.currencies[0].description;
    }
  }
  async _moveCurrency(e) {
    e.stopPropagation();
    const curIndex = parseInt(e.currentTarget.dataset.index, 10);
    if (curIndex === 0) return; //cannot do any sorting with default
  //  if (accountIndex === this.selected) return; //pointless doesn't mean anything
    
    if (curIndex === (this.selected - 1)) {
      //click one above the selection line says, remove this from sort
      this.currencies[curIndex].display = 0;
       //we now have one less sorted item, and also the selection moves up one
      for(let i = this.selected; i < this.sorted; i++) {
        this.currencies[i].priority--;
        const response = await api('currency_priority', this.currencies[i]);
        if (response.status !== 'OK') throw new Error(response.status);
        this.currencies[i].version++;
      }
      this.sorted--;
      this.selected--;
      this.currencies[curIndex].priority = this.sorted; 
      const response = await api('currency_display', this.currencies[curIndex]);
      if (response.status !== 'OK') throw new Error(response.status);
      this.currencies[curIndex].version++;
    } else if (curIndex < this.sorted) {
      if (curIndex < this.selected) {
        this.currencies[curIndex].priority = this.selected;
        for(let i = curIndex; i < this.selected; i++) {
          this.currencies[i].priority--;
          const response = await api('currency_priority', this.currencies[i]);
          if (response.status !== 'OK') throw new Error(response.status);
          this.currencies[i].version++;
        }
        this.selected--;
      } else {
        this.currencies[curIndex].priority = this.selected;
        for(let i = this.selected; i < curIndex; i++) {
          this.currencies[i].priority++;
          const response = await api('currency_priority', this.currencies[i]);
          if (response.status !== 'OK') throw new Error(response.status);
          this.currencies[i].version++;
        }
        this.selected++;
      }
    } else {
      this.currencies[curIndex].display = 1;
      this.currencies[curIndex].priority = this.selected;
      for(let i = this.selected; i < this.sorted; i++) {
        this.currencies[i].priority++;
        const response = await api('currency_priority', this.currencies[i]);
        if (response.status !== 'OK') throw new Error(response.status);
        this.currencies[i].version++;
      }
      this.sorted++;
      this.selected++
      const response = await api('currency_display', this.currencies[curIndex]);
      if (response.status !== 'OK') throw new Error(response.status);
      this.currencies[curIndex].version++;
    }
    this._sortCurrencies();
  }
  _rateCancel(e) {
    e.stopPropagation();
    this.rateCanClose = true;
    this.dialog.close();
  }
  _rateChanged(e) {
    e.stopPropagation();
    const input = e.currentTarget;
    if (input.reportValidity()) {
      input.classList.remove('error');
      this.rate = Number(input.value);
    } else {
      input.classList.add('error');
    }
  }
  _rateSave(e) {
    e.stopPropagation;
    const input = this.shadowRoot.querySelector('#rate');
    if (!input.classList.contains('error')) {
      this.rateCanClose = true;
      this.currencies[this.rateIndex].rate = this.rate;
      api('currency_rate', this.currencies[this.rateIndex]).then(response => {
        if (response.status !== 'OK') throw new Error(response.status);
        this.currencies[this.rateIndex].version++;
        this.requestUpdate();
      });
    } 
  }
  _setRate(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (index === 0 || this.currencies[index].display !== 1 || this.overlayLocked) return;
    this.overlayLocked;
    this.rate = this.currencies[index].rate;
    this.rateIndex = index;
    this.rateCanClose = false;
    this.dialog.positionTarget = e.currentTarget;
    this.dialog.show();
  }
  _sortCurrencies() {
    this.currencies.sort((a, b) => {
      if (a.name === this.default) return -1; //a definitely comes first
      if (b.name === this.default) return 1; //b definitely comes first
      if (a.display === 1) {
        if (b.display === 1) return a.priority - b.priority
        return -1;
      }
      if (b.display === 1) return 1;
      if (a.priority !== null) {
        if (b.priority !==null) return a.priority - b.priority
        return -1;
      }
      if (b.priority !== null) return 1;
      return a.name.localeCompare(b.name); //sort by name
    });  
    this.requestUpdate(); 
    this.dispatchEvent(new CustomEvent('currency_reread', { bubbles: true, composed: true }));
  }
}
customElements.define('admin-currencies', AdminCurrencies);