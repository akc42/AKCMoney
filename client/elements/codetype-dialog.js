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
     <codetype-dialog>
*/
class CodeTypeDialog extends LitElement {
  static get styles() {
    return [list,css`
      .domains-icon {
        color: var(--domains-icon-color)
      }
    `];
  }
  static get properties() {
    return {
      types: {type: Array},
      type: {type: String}
    };
  }
  constructor() {
    super();
    this.types = [];
    this.type = '';
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;
    

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('types-request', this._gotRequest);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('types-request', this._gotRequest);
    this.eventLocked = false;
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#typesmenu');
    this.eventLocked = false;
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        .type {
          margin-right: 5px;
        }
      </style>
      <dialog-box id="typesmenu" @overlay-closed=${this._closing} closeOnClick>
        <div class="listcontainer">
          ${cache(this.types.map((type, i) => html`
            ${i !== 0 ? html`<hr class="sep"/>` : ''}
            <button type="button" role="menuitem" 
              data-index="${i}" @click=${this._typeSelected}>
              <span class="type">${type.type}</span> <span class="description">${type.description}</span>
            </button>
          `))}        
        </div>
      </dialog-box>

    `;
  }
  _typeSelected(e) {
    e.stopPropagation();
    const index =  parseInt(e.currentTarget.dataset.index,10);
    this.type = this.types[index].type;
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('types-reply', {detail: { 
      key: this.type, 
      visual: this.types[index].description
    }}));
    this.dialog.close();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('item-selected', { 
      bubbles: true, 
      composed: true, 
      detail: this.types[index]
    })); //tell the outside world we have a value
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
    this.type = e.detail;
    this.dialog.show();

  }

}
customElements.define('codetype-dialog', CodeTypeDialog);