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
     <domains-dialog>
*/
class DomainsDialog extends LitElement {
  static get styles() {
    return [list,css`
      .domains-icon {
        color: var(--domains-icon-color)
      }
    `];
  }
  static get properties() {
    return {
      domains: {type: Array},
      domain: {type: String}
    };
  }
  constructor() {
    super();
    this.domains = [];
    this.domain = '';
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('domains-request', this._gotRequest);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('domains-request', this._gotRequest);
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#domainsmenu');
    this.eventLocked = false;
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <dialog-box id="domainsmenu" @overlay-closed=${this._closing}>
        <div class="listcontainer">
          ${cache(this.domains.map((domain, i) => html`
            ${i !== 0 ? html`<hr class="sep"/>` : ''}
            <button type="button" role="menuitem" 
              data-index="${i}" @click=${this._domainSelected}>
              <span>${domain}</span>
              ${domain === this.domain ? html`<span><material-icon class="domains-icon">check_box</material-icon></span>` : ''}
            </button>
          `))}        
        </div>
      </dialog-box>

    `;
  }
  _domainSelected(e) {
    e.stopPropagation();
    const index =  parseInt(e.currentTarget.dataset.index,10);
    this.domain = this.domains[index];
    this.dialog.close();
  }
  _closing(e) {
    e.stopPropagation();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: this.domain })); //tell the outside world we have a value
    this.eventLocked = false;
  }
  _gotRequest(e) {
    e.stopPropagation();
    if (this.eventLocked) return;
    this.eventLocked = true;
    this.dialog.positionTarget = e.composedPath()[0];
    this.domain = e.detail;
    this.dialog.show();

  }
  _nodomainSelected(e){
    e.stopPropagation();
    this.domain = '';

  }
}
customElements.define('domains-dialog', DomainsDialog);