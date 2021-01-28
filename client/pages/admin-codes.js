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

import Route from '../libs/route.js';
import { api } from '../libs/utils.js';
import '../elements/material-icon.js';
import '../elements/list-selector.js';
import '../elements/codetype-dialog.js';

import page from '../styles/page.js';
import button from '../styles/button.js';
import input from '../styles/error.js';


/*
     <admin-codes>: Edit the list of accounting codes and assign them to correct type
*/
class AdminCodes extends LitElement {
  static get styles() {
    return [page,button, input,css``];
  }
  static get properties() {
    return {
      codes: {type: Array},
      description: {type: String},
      type: {type: String},
      route: {type: Object}
    };
  }
  constructor() {
    super();
    this.codes = [];
    this.description = '';
    this.type = '';

    this.route = {active: false};
    this.router = new Route('/','page:codes');
  }

  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        this._fetchCodes();
      }
    }

    super.updated(changed);
  }
  render() {
    return html`
      <style>
        h3 {
          text-align: center;
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
        .account, .header {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: 1fr var(--domain-selector-width) var(--currency-selector-width) 20px 80px;
        }
        .account {
          grid-template-areas:
            "name name name name name"
            ". domain currency archive action";
        }
        .header {
           grid-template-areas:
            "name name name name name"
            ". domain currency archive archive";
         
        }
        .name {
          grid-area: name;
        }
        .domain {
          grid-area: domain;
        }
        .currency {
          grid-area: currency;
        }
        .archive, .unarchive {
          grid-area: archive;
          margin-top: 1px;
          cursor: pointer;
          align-self:start;
          justify-self:center;
          box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.48);
          border-radius:2px;
        }
        .archive:active, .archive:hover, .unarchive:active, .unarchive:hover {
          box-shadow: none;
        }

        .archive {
          color:var(--unarchived-icon-color);
        }
        .header .archive {
          color: var(--table-text-color);
          justify-self: start;
          box-shadow: none;
          cursor: default;
        }
        .unarchive {
          color: var(--archived-icon-color);
        }
        .action {
          grid-area: action;
        }
        #newa >material-icon {
          color: var(--add-icon-color);
        }
        .dela >material-icon {
          color:var(--delete-icon-color);
        }
        .scrollable {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin: 0px calc(var(--scrollbar-width) + 5px) 10px 5px;
          display: flex;
          flex-direction: column;
          padding-right: var(--scrollbar-width);
        }
        #newaccount {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin-left: 5px;
        }
        #domainselector.error {
          background-color: var(--input-error-color);
        }
        @media (min-width: 500px) {
          .header {
            grid-template-areas: 
              "name domain currency archive archive"

          } 
          .account {
            grid-template-areas: 
              "name domain currency archive action"
          }
        }
      </style>
      <codetype-dialog></codetype-dialog>
      <section class="page">
        <h1>Accounting Codes Manager</h1>
        <h3>Codes List</h3>
        <div class="header">
          <div class="description">Description</div>
          <div class="type">Type</div>

          <div class="action"></div>          
        </div>
        <div id="newcode" class="code">
          <input 
            class="description" 
            id="newdescription" .value=${this.description} @input=${this._descriptionChanged} data-index="-1"/>
          <list-selector 
            id="typeselector"
            class="type"
            list=${'types'} 
            .key=${this.type} 
            .visual=${this.type} 
            @item-selected=${this._typeChanged}></list-selector>
          <button id="newc" class="action" @click=${this._addCode}><material-icon>post_add</material-icon><span>Add</span></button>
        </div>
        <section class="scrollable">
          ${this.codes.map((code,i) => html`
            <div class="code">
              <input 
                class="description" 
                .value=${code.description} data-index="${i}" @input=${this._codeDescriptionChanged} @blur=${this._codeDescriptionUpdate}/>
              <list-selector
                class="type"
                list=${'types'} 
                .key=${code.type} 
                .visual=${code.type} 
                data-index="${i}"
                @item-selected=${this._codeTypeChanged}></list-selector>
 
              <button 
                class="delc action"
                data-index="${i}" 
                @click=${this._deleteCode} 
                @delete-reply=${this._deleteConfirm}><material-icon>delete_forever</material-icon><span>Delete</span></button>
            </div>
                
        `)}
        </section>
      </section>
    `;
  }
  _addCode(e) {
    e.stopPropagation();
    if (this.description.length === 0) {
      const nameInput = this.shadowRoot.querySelector('#newdescription');
      nameInput.classList.add('error');
    } else {
      api('code_add', {description: this.description, type: this.type}).then(response => {
        if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
        this.description = ''; //Only reset description
        this.codes = response.codes;  
      });
    }
  }
  _codeDescriptionChanged(e) {
    const description = e.currentTarget.value;
    if (description.length > 0) {
      e.currentTarget.classList.remove('error');
    } else {
      e.currentTarget.classList.add('error');
    }
  }
  _codeDescriptionUpdate(e) {
    e.stopPropagation();
    if (!e.currentTarget.classList.has('error')) {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      api('code_description',{
        id: this.codess[index].id, 
        description: e.currentTarget.value,
        version: this.codes[index].version
      }).then(response => {
        if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
        this.codes = response.codes;
      });
    }
  }
  _codeTypeChanged(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const code = e.detail;
    api('code_type', {
      id: this.codes[index].id,
      type: code,
      version: this.codes[index].version
    }).then(response => {
      if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
      this.codes = response.codes;
    });

  }
  _deleteCode(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.dispatchEvent(new CustomEvent('delete-request', { 
      bubbles: true, 
      composed: true, 
      detail: `this account (${this.accounts[index].name})` 
    }));
  }
  _deleteConfirm(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    api('code_delete', {id: this.codes[index].id, version: this.codes[index].version}).then(response => {
      if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
      this.codes = response.codes;
    });
  }
  _descriptionChanged(e) {
    e.stopPropagation();
    this.description = e.currentTarget.value;
    if (this.description.length > 0) {
       e.currentTarget.classList.remove('error');
     } else {
      e.currentTarget.classList.add('error');
    }
  }
  async _fetchCodes() {
    const response = await api('codes',{});
    this.codes = response.codes;
  }
  _typeChanged(e) {
    e.stopPropagation();
    this.type = e.detail;
  }
}
customElements.define('admin-codes', AdminCodes);