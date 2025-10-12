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
import {cache} from '../libs/cache.js';

import Route from '../libs/route.js';
import api from '../libs/post-api.js';

import page from '../styles/page.js';
import menu from '../styles/menu.js';

import '../elements/dialog-box.js';
import '../elements/list-selector.js';
import '../elements/domain-code.js';

/*
     <domain-page>: Displays a yealy accounts for the domain
*/
class DomainPage extends LitElement {
  static get styles() {
    return [page, menu,css`
        section.page {
          max-width: 800px;
        }
        .header, .footer {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: 40px 1fr repeat(2, var(--amount-width)) 70px;
          grid-template-areas:
            "type code amount balance show";
        }
        .header {
          margin: 0px 5px;
          background-color: var(--table-heading-background);
          font-weight: bold;
        }
        .footer {
          background-color: white;
          margin: 0px 5px;
          font-weight: bold;
          padding: 5px 8px;
          grid-gap: 0px;
        }
        .footer * {
          padding: 3px 0px;
          background-color: var(--table-panel-background);
        }
        .type {
          grid-area: type;
        }
        .code {
          grid-area: code;
        }
        .header .amount, .header .balance {
          text-align: center;
        }
        .footer .amount, .footer .balance {
          text-align: right;
        }
        .amount {
          grid-area: amount;
        
        }
        .balance {
          grid-area: balance;
        
        }
        .show {
          grid-area: show;
        }
        #codes {
          background-color: white;
          color: var(--table-text-color);
          margin: 0px calc(var(--scrollbar-width) + 5px) 0px 5px;
          display: flex;
          flex-direction: column;

        }
        #ysel {
          width: var(--year-selector-width);
          margin: 5px 0 10px 5px;
        }
        @media (min-width: 500px) {
          .header,.footer {
            grid-template-areas:
              "type code amount balance show";    
          }

        }    
    `];
  }
  static get properties() {
    return {
      route: {type: Object},
      domain: {type: String},
      year: {type: Number},
      years: {type: Array}, 
      codes: {type: Array},
      balances: {type: Array}, //matches codes array with balance after code
      profit: {type: Number},
      start: {type: Number},
      end: {type: Number},
      repeats: {type: Array}
    };
  }
  constructor() {
    super();
    this.route = {active: false};
    this.domain = '';
    this.year = 0;
    this.years = [];
    this.codes = [];
    this.balances = [];
    this.profit = 0;
    this.start = 0;
    this.end = 0;
    this.repeats = [];
    this.router = new Route('/:domain','page:domain');
    this.eventLocked = true;
  }
  connectedCallback() {
    super.connectedCallback();
    const d = new Date();
    this.year = d.getFullYear();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.year = 0;
  }
  update(changed) {
    if((changed.has('domain') || changed.has('year')) && this.domain.length > 0 && this.year > 0){
      this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: true}));
      api('domain_codes', {domain: this.domain, year: this.year}).then(response => {
        this.start = response.start;
        this.end = response.end;
        this.codes = response.codes;
        this._rebalance();
        this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: false}));
      }).catch((err) => {
        this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: false}));
        throw new Error(err);  
      });
    }
    if (changed.has('year') && this.year > 0) {
      this.dispatchEvent(new CustomEvent('domain-year-changed', { bubbles: true, composed: true, detail: this.year }));
    }
    super.update(changed);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#years');
    this.eventLocked = false;
  }
  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        this.domain = route.params.domain
        this.dispatchEvent(new CustomEvent('domain-changed',{bubbles:true,composed:true,detail:this.domain}));

      }
    }
    if (changed.has('year') && this.year > 0) {
      const codes = this.shadowRoot.querySelectorAll('domain-code');
      for (const code of codes) {
        code.expanded = false;
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <section class="page">
        <h1>Accounting Reports</h1>
        <h2>Domain: ${this.domain}</h2>
        <list-selector
          id="ysel"
          class="years"
          .list=${'years'}
          .key=${this.year.toString()}
          .visual=${this.year.toString()}
          @years-reply=${this._yearSelected}></list-selector>
        <div class="header">
            <div class="type">Type</div>
            <div class="code">Account Code</div>
            <div class="amount">Totals</div>
            <div class="balance">Profit</div>
            <div class="show">Show/Hide</div>
        </div>
        <section id=codes class="scrollable">
          ${this.codes.map((code,i) => html`
            <domain-code
              .domain=${this.domain}
              .code=${code} 
              .start=${this.start} 
              .end=${this.end} 
              .balance=${this.balances[i]}
              .repeats=${this.repeats}
              .codes=${this.codes}
              data-index=${i}></domain-code>
          `)}
        </section>
        <div class="footer">
            <div class="type"></div>
            <div class="code">Profit</div>
            <div class="amount"></div>
            <div class="balance">${(this.profit/100).toFixed(2)}</div>
            <div class="show"></div>
        
        </div>
      </section>
    `;
  }
  _closing(e) {
    e.stopPropagation();
    this.eventLocked = false;
  }
  _rebalance() {
    this.balances = []
    this.profit = 0;
    for (let i = 0; i < this.codes.length; i++) {
      switch (this.codes[i].type) {
        case 'R':
        case 'B':
          this.profit += this.codes[i].tamount;
          break;
        case 'C':
        case 'A':
          this.profit -= this.codes[i].tamount;
          break;

      }
      this.balances[i] = this.profit;
    }



  }
  _selectYear(e) {
    e.stopPropagation();
    this.year = parseInt(e.currentTarget.dataset.year,10);
    this.dialog.close();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('year-reply',{
      bubbles: true,
      composed: true,
      detail: {
        key: this.year,
        visual: this.year
      }
    }));
  }
  _tamountChanged(e) {
    e.stopPropagation()
    const index = parseInt(e.currentTarget.dataset.index,10);
    this.codes[index].tamount = e.detail;
    this._rebalance();
  }
  _yearSelected(e) {
    e.stopPropagation();
    this.year = e.detail;
  }

}
customElements.define('domain-page', DomainPage);