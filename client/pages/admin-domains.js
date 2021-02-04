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

import Route from '../libs/route.js';
import { api } from '../libs/utils.js';
import page from '../styles/page.js';
import button from '../styles/button.js';
import input from '../styles/error.js';
/*
     <admin-domains>: Manages Domains
*/
class AdminDomains extends LitElement {
  static get styles() {
    return [page, button, input, css``];
  }
  static get properties() {
    return {
      domains: {type: Array},
      name: {type: String},
      description: {type: String},
      route: {type: Object}
    };
  }
  constructor() {
    super();
    this.domains = [];
    this.name = '';
    this.description = '';
    this.route = { active: false };
    this.router = new Route('/', 'page:domains');
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  update(changed) {
    super.update(changed);
  }
  firstUpdated() {
  }
  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        this._fetchDomainsData();
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
        .domain, .header {     
          padding: 2px;
          display: grid;
          grid-gap: 1px;
          color: var(--table-text-color);
          grid-template-columns: var(--domain-selector-width) 1fr 80px;
          grid-template-areas: "name description action";
        }
        .name {
          grid-area: name;
        }
        .description {
          grid-area: description
        }
        .action {
          grid-area: action
        }
        #newd >material-icon {
          color: var(--add-icon-color);
        }
        .deld >material-icon {
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
        #newdomain {
          background-color: var(--table-odd-color);
          color: var(--table-text-color);
          margin-left: 5px;
        }
      </style>
       <section class="page">
        <h1>Domain Manager</h1>
        <h3>Domain List</h3>
        <div class="header">
          <div class="name">Name</div>
          <div class="description">Description</div>
          <div class="action"></div>
        </div>
        <div id="newdomain" class="domain">
          <input
            class="name"
            id="newname" .value=${this.name} @input=${this._nameChanged} @blur=${this._nameCheck} data-index="-1"/>
          <input
            class="description"
            id="newdescription" .value=${this.description} @input=${this._descriptionChanged} />
          <button id="newd" class="action" @click=${this._addDomain}><material-icon>post_add</material-icon><span>Add</span></button>
        </div>
        <section class="scrollable">
          ${this.domains.map((domain, i) => html`
            <div class="domain">
              <input class="name" .value=${domain.name} @input=${this._nameCheck} @blur=${this._domainNameChanged} data-index="${i}" />
              <input class="description" .value=${domain.description} @blur=${this._domainDescriptionChanged} data-index="${i}" />       
              <button 
                class="deld action"
                data-index="${i}" 
                @click=${this._deleteDomain} 
                @delete-reply=${this._deleteConfirm}><material-icon>delete_forever</material-icon><span>Delete</span></button>
            </div>
          `)}
        </section>
      </section>
    `;
  }
  _addDomain(e) {
    e.stopPropagation();
    const nameInput = this.shadowRoot.querySelector('#newname');
    if (this.name.length === 0) {
      nameInput.classList.add('error');
    } else if (!nameInput.classList.contains('error')) {
      api('domain_add', { name: this.name, description: this.description}).then(response => {
        if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
        this.name = ''; 
        this.description = '';
        this.domains = response.domains;
      });
    }
  }
  _domainDescriptionChanged(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (this.domains[index].description !== e.currentTarget.value) {
      api('domain_description',{
        name: this.domains[index].name,
        description: e.currentTarget.value,
        version: this.domains[index].version
      }).then(response => {
        if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
        this.domains = response.domains;      
      });
    }
  }
  _domainNameChanged(e) {
    e.stopPropagation();
    if (!e.currentTarget.classList.contains('error')) {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      if (this.domains[index].name !== e.currentTarget.value) {
        api('domain_name', {
          old: this.domains[index].name, 
          new: e.currentTarget.value, 
          version: this.domains[index].version 
        }).then(response => {
          if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
          this.domains = response.domains;
        });
      }
    }
  }
  _deleteDomain(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.dispatchEvent(new CustomEvent('delete-request', {
      bubbles: true,
      composed: true,
      detail: `this domain (${this.domains[index].name})`
    }));
  }
  _deleteConfirm(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    api('domain_delete', { name: this.domains[index].name, version: this.domains[index].version }).then(response => {
      if (response.status !== 'OK') throw new Error(`api status: ${response.status}`);
      this.domains = response.domains;
    });
  }
  _descriptionChanged(e) {
    this.description = e.currentTarget.value;
  }
  async _fetchDomainsData() {
    const response = await api('domains', {});
    this.domains = response.domains;
  }
  _nameChanged(e) {
    e.stopPropagation();
    this.name = e.currentTarget.value;
    e.currentTarget.classList.remove('error');
  }
  _nameCheck(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const name = e.currentTarget.value;
    if (name.length === 0) {
      if (index >= 0) {
        e.currentTarget.classList.add('error'); //must not set name length to nothing on existing account so show error
      }
      return;
    }
    let found = false;
    //check name is unique
    for (let i = 0; i < this.domains.length; i++) {
      if (i !== index) {
        if (this.domains[i].name.toLowerCase() === name.toLowerCase()) {
          found = true; //name not unique
          break;
        }
      }
    }
    if (found) {
      e.currentTarget.classList.add('error');
    } else {
      e.currentTarget.classList.remove('error');
    }
  }
}
customElements.define('admin-domains', AdminDomains);