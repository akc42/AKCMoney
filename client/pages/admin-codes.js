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
      types: {type: Array},
      description: {type: String},
      type: {type: String},
      typeDescription: {type: String},
      route: {type: Object}
    };
  }
  constructor() {
    super();
    this.codes = [];
    this.types = [];
    this.description = '';
    this.type = '';
    this.typeDescription = '';

    this.route = {active: false};
    this.router = new Route('/','page:codes');
  }
  update(changed) {
    if (changed.has('type') && this.type.length > 0) {
      const type = this.types.find(t => t.type === this.type);
      if (type !== undefined) {
        this.typeDescription = type.description;
      }
    }
    super.update(changed);
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
        .code, .header {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: 1fr var(--codetype-selector-width) 80px;
          grid-template-areas:
            "description description description" 
            ". type action";
        }
        .description {
          grid-area: description;
        }
        .type {
          grid-area: type;
        }
        .action {
          grid-area: action;
        }
        #newc >material-icon {
          color: var(--add-icon-color);
        }
        .delc >material-icon {
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
        #newcode {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin-left: 5px;
        }
        #typeselector.error {
          background-color: var(--input-error-color);
        }
        @media (min-width: 500px) {
          .code, .header {
            grid-template-areas:
              "description type action";

          }
        }

      </style>
      <codetype-dialog .types=${this.types}></codetype-dialog>
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
            .visual=${this.typeDescription} 
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
                .visual=${this.types.find(t => t.type ===code.type).description} 
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
    } else if (this.type.length === 0) {
      const typeSelector = this.shadowRoot.querySelector('#typeselector');
      typeSelector.classList.add('error');
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
    if (!e.currentTarget.classList.contains('error')) {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      api('code_description',{
        id: this.codes[index].id, 
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
    const code = e.detail.type;
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
      detail: `this code (${this.codes[index].description})` 
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
    this.types = response.types;
  }
  _typeChanged(e) {
    e.stopPropagation();
    this.type = e.detail.type;
    this.typeDescription = e.detail.description;
    if (this.type.length > 0 ) {
      e.currentTarget.classList.remove('error');
    } else {
      e.currentTarget.classList.add('error');
    }
  }
}
customElements.define('admin-codes', AdminCodes);