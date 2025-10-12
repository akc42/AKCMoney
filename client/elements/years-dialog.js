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
import { classMap } from '../libs/class-map.js';
import domHost from '../libs/dom-host.js';
import api from '../libs/post-api.js';
import './material-icon.js';
import './dialog-box.js';

import list from '../styles/list.js';

/*
     <years-dialog>
*/
class YearsDialog extends LitElement {
  static get styles() {
    return [list,css`
      button[role="menuitem"].selected {
        background-color: royalblue;
        color: white;
      }
    `];
  }
  static get properties() {
    return {
      years: {type: Array},
      domain: {type: String},
      year: {type: Number}
    };
  }
  constructor() {
    super();
    this.years = [];
    this.year = new Date().getFullYear();
    this.domain = '';
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;
    

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('years-request', this._gotRequest);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('years-request', this._gotRequest);
    this.eventLocked = false;
    this.domain = '';
  }
  update(changed) {
    if(changed.has('domain') && this.domain.length > 0) {
        this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: true}));
        api('domain_range', {domain: this.domain}).then(response => {
          if (response.min !== null && response.min > 0) {
            this.years = [];
            const firstDate = new Date();
            firstDate.setTime(response.min * 1000);
            const earliest = Math.min(this.year, firstDate.getFullYear());
            const lastDate = new Date();
            lastDate.setTime(response.max * 1000);
            const latest = Math.max(this.year, lastDate.getFullYear());
            for(let i = earliest; i <= latest; i++ ) {
              this.years.push(i);
            }
          }
          this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: false}));
        }).catch((err) => {
          this.dispatchEvent(new CustomEvent('wait-request', {bubbles: true, composed: true, detail: false}));
          throw new Error(err);
        });
    } 
    super.update(changed);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#years');
    this.eventLocked = false;
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <dialog-box id="years" closeOnClick @overlay-closed=${this._closing}>
        ${cache(this.years.map(year => html`
          <button role="menuitem" @click=${this._selectYear} data-year="${year}" class="${classMap({selected: year === this.year})}">
            <span>${year}</span>
          </button>
        `))}
      </dialog-box>
    `;
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
    this.year = Number(e.detail.key);
    this.dialog.show();

  }
  _selectYear(e) {
    e.stopPropagation();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('years-reply', {detail:e.currentTarget.dataset.year}));
    this.dialog.close();
  }
}
customElements.define('years-dialog', YearsDialog);