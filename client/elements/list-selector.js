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

import './material-icon.js';

/*
     <clist-selector>
*/
class ListSelector extends LitElement {
  static get styles() {
    return css``;
  }
  static get properties() {
    return {
      value:{type: String},
      list: {type: String},
      name: {type: String}
    };
  }
  constructor() {
    super();
    this.value = '';
    this.list = '';
    this.name = '';
    this._reply = this._reply.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.list.length > 0) {
      this.addEventListener(`${this.list}-reply`, this._reply);
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.list.length > 0) {
      this.removeEventListener(`${this.list}-reply`, this._reply);
    }
  }
  update(changed) {
    if(changed.has('list')) {
      if (this.list.length > 0) {
        this.addEventListener(`${this.list}-reply`, this._reply);
      } else {
        this.removeEventListener(`${changed.get('list')}-reply`, this._reply);
      }
    }
    if (changed.has('value') && changed.get('value') !== undefined) {
      this.dispatchEvent(new CustomEvent('value-changed',{bubbles:true,composed: true, detail: this.value }))
    }
    super.update(changed);
  }
  firstUpdated() {
  }
  updated(changed) {
    super.updated(changed);
  }
  render() {
    return html`
      <style>
        #container {
          color: black;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          background-color: white;
          border-width: 1px;
          border-style: solid;
          border-color: rgb(118, 118, 118);
          padding: 1px 2px;
          margin: 0;
          cursor: pointer;
        }
      </style>
      <div id="container" @click=${this._displayDialog}>
        <div id="list">${this.value}</div>
        <material-icon>arrow_drop_down</material-icon>
      </div>
    `;
  }
  _displayDialog(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent(`${this.list}-request`,{bubbles: true, composed: true, detail: this.value}));
  }
  _reply(e) {
    e.stopPropagation();
    this.value = e.detail;
  }
}
customElements.define('list-selector', ListSelector);