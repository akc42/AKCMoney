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
import domHost  from '../libs/dom-host.js';
import './material-icon.js';
import './dialog-box.js';

import list from '../styles/list.js';

/*
     <codes-dialog>
*/
class CodesDialog extends LitElement {
  static get styles() {
    return [list,css`
      .codes-icon {
        color: var(--codes-icon-color)
      }
    `];
  }
  static get properties() {
    return {
      codes: {type: Array},
      code: {type: String}
    };
  }
  constructor() {
    super();
    this.codes = [];
    this.code = '';
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('codes-request', this._gotRequest);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('codes-request', this._gotRequest);
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
    this.dialog = this.shadowRoot.querySelector('#codesmenu');
    this.eventLocked = false;
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <dialog-box id="codesmenu" @overlay-closed=${this._closing} closeOnClick>
        <div class="listcontainer">
          <button type="button" role="menuitem" @click=${this._nocodeSelected}>
            <span>${sessionStorage.getItem('nullCode')}</span>
          </button>
          ${cache(this.codes.map((code, i) => html`
            ${i !== 0 ? html`<hr class="sep"/>` : ''}
            <button type="button" role="menuitem" 
              data-index="${i}" @click=${this._codeSelected}>
              <span>${code.description}</span>
            </button>
          `))}        
        </div>
      </dialog-box>

    `;
  }
  _codeSelected(e) {
    e.stopPropagation();
    const index =  parseInt(e.currentTarget.dataset.index,10);
    this.code = this.codes[index];
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('codes-reply', { 
      detail: { key: this.code.id, visual: this.code.description }
    }));
    this.dialog.close();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('item-selected', { 
      bubbles: true, 
      composed: true, 
      detail: this.code 
    })); //tell the outside world we have a value
  }
  _closing(e) {
    e.stopPropagation();
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('item-selected', { bubbles: true, composed: true, detail: this.code })); //tell the outside world we have a value
    this.eventLocked = false;
  }
  _gotRequest(e) {
    e.stopPropagation();
    if (this.eventLocked) return;
    this.eventLocked = true;
    this.dialog.positionTarget = e.composedPath()[0];
    this.code = e.detail;
    this.dialog.show();

  }
  _nocodeSelected(e){
    e.stopPropagation();
    this.code = {id: 0, type: ''};
    this.dialog.positionTarget.dispatchEvent(new CustomEvent('codes-reply', {
      detail: { key: 0, visual: sessionStorage.getItem('nullCode') }
    }));
    this.dialog.close();

  }
}
customElements.define('codes-dialog', CodesDialog);