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
import {live} from '../libs/live.js';

import '../elements/material-icon.js';


import page from '../styles/page.js';
import button from '../styles/button.js';
import error from '../styles/error.js';
import api from '../libs/post-api.js';
import Route from '../libs/route.js';


/*
     <admin-users>: Edits the list of users
*/
class AdminUsers extends LitElement {
  static get styles() {
    return [page, button, error, css`
      .header {
        margin: 0px -5px 2px 5px;
        background-color: var(--table-heading-background);
        font-weight: bold;
      }
      .header > * {
        border: 1px solid white;
        text-align: center;
      }
      .user {    
        margin: 10px 5px; 
        padding: 2px;
        display: grid;
        grid-gap: 1px;
        color: var(--table-text-color);
        background-color: var(--form-background-color);
        grid-template-columns: var(--name-input-length) 1fr 100px;
        grid-template-areas:
          "namelabel domains uid" 
          "name domains password"
          "admin domains password"
          ". domains action"
          ". domains .";
      }
      .uid {
        grid-area: uid;
        text-align: right;
        font-weight: bold;
      }
      #new {
        margin: 0 5px;
      }
      .name {
        grid-area:name;
      }
      .me {
        margin-left: 5px;
        padding: 2px;
        border: 1px solid var(--input-border-color);
        border-radius: 2px;
      }
      
      .namelabel {
        grid-area: namelabel;
      }
      .adminlabel {
        grid-area: admin;
      }
      .dpw {
        grid-area: password;
      }
      .delu, .addu {
        grid-area: action;
      }

      label {
        font-weight: bold;
      }
      fieldset {
        display: flex;
        flex-direction: column;
        background-color: var(--fieldset-background-color);
        border: 1px solid var(--panel-border-color);
        border-radius: 2px;
        grid-area: domains;
        max-width: 200px;
      }
      .drow {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
      }
      fieldset.error {
        background-color: var(--input-error-color);
      }
      legend {
        border: 1px solid var(--panel-border-color);
        border-radius: 2px;
        background-color: var(--table-panel-background);
        font-weight: bold;
      }  
      
      .addu >material-icon {
        color: var(--add-icon-color);
      }
      .delu >material-icon {
        color:var(--delete-icon-color);
      }
      .dpw > material-icon {
        color: var(--reset-icon-color);
      }
      material-icon.admin {
        color: var(--users-icon-color);
      }
    `];
  }
  static get properties() {
    return {
      users: {type: Array},  //List of existing users
      domains: {type: Array}, //List of All Domains
      route: {type: Object}, //Our route
      me: {type: Number}, //My uid
      name: {type:String},
      isAdmin: {type: Boolean},
      newDomains: {type: Array}
    };
  }
  constructor() {
    super();
    this.users = [];
    this.domains = [];

    this.route = {active: false};
    this.me = 0;
    this.name = ''
    this.isAdmin = false;
    this.newDomains =[];
    this.router = new Route('/', 'page:users');
    
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
    this.nameInput = this.shadowRoot.querySelector('#newname');
  }
  updated(changed) {
    if (changed.has('route') && this.route.active) {
      const route = this.router.routeChange(this.route);
      if (route.active) {
        const user = JSON.parse(sessionStorage.getItem('user'));
        this.me = user.uid;
        this._fetchUserData();
      }
    }
    if ((changed.has('isAdmin') && changed.get('isAdmin') !==undefined)  || (changed.has('newDomains') && changed.get('newDomains') !== undefined)) {
      const newFieldset = this.shadowRoot.querySelector('#newdomains');
      if (this.isAdmin || this.newDomains.length > 0) {
        if (!this.isAdmin) newFieldset.classList.remove('error');
      } else {
        newFieldset.classList.add('error');
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
      <section class="page">
        <h1>User Management</h1>
        <h3>User List</h3>
        <div id="new" class="user">  
          <label class="namelabel" for="newname">Name</label>
          <input class="name" id="newname" .value=${this.name} @input=${this._nameNewChanged} />
          <label class="adminlabel" for="newadmin">
            <input class="admin" id="newadmin" type="checkbox" .checked=${this.isAdmin} @click=${this._toggleNewAdmin} />
            Is Admin
          </label>
          <button class="addu action" @click=${this._addUser}>
            <material-icon>post_add</material-icon><span>Add</span>
          </button>
          ${this.isAdmin ? '' : html`
          <fieldset id="newdomains">
            <legend>Domains</legend>
            ${this.domains.map((domain, i) => html`
              <div class="drow">
                <input
                  id="newd${i}" 
                  type="checkbox" 
                  .checked=${live(this.newDomains.includes(domain))} 
                  @click=${this._toggleNewDomain} 
                  data-index=${i} />
                <label for="newd${i}">${domain}</label>
              </div>
            `)}
          </fieldset>
          `}
          </div>

        </div>
        <section class="scrollable">
          ${this.users.map((user,i) => html`
            <div class="user">
              <div class="uid">${user.uid}</div>
              <label class="namelabel" for="u${user.uid}">Name</label>
              ${user.uid === this.me ? html`
                <div class="name me" id="u${user.uid}">${user.name}</div>
              `:html`
                <input class="name" id="u${user.uid}" .value=${user.name} data-index=${i} @input=${this._nameChanged} @blur=${this._nameUpdated} />
              `}
              <label class="adminlabel" for="a${user.uid}">
                ${user.uid === this.me ? html`
                  <material-icon class="admin" id="a${user.uid}">verified_user</material-icon>
                `: html`
                  <input class="admin" id="a${user.uid}" type="checkbox" .checked=${user.isAdmin} data-index=${i} @click=${this._toggleAdmin} />    
                `}
                Is Admin
              </label>
              <button class="dpw action" data-index=${i} @click=${this._deletePassword} @delete-reply=${this._passwordConfirm}>
                <material-icon>delete</material-icon><span>Delete Password</span></button>
              ${user.uid === this.me ? '': html`             
                <button class="delu action" data-index="${i}" @click=${this._deleteUser} @delete-reply=${this._deleteConfirm}>
                <material-icon>delete_forever</material-icon><span>Delete</span></button>
              `}
              ${user.isAdmin ? '': html`  
                <fieldset id="f${i}">
                    <legend>Domains</legend>
                    ${this.domains.map((domain,j) => html`
                      <div class="drow">
                        <input
                          id="d${i}d${j}" 
                          type="checkbox" 
                          .checked=${live(user.domains.includes(domain))} 
                          data-index=${i} 
                          data-dindex=${j}
                          @click=${this._toggleDomain} />
                        <label for="d${i}d${j}">${domain}</label>
                      </div>
                    `)}
                </fieldset>
              `}
            </div>
          `)}
        </section>
      </section>

    `;
  }
  _addUser(e) {
    const newFieldset = this.shadowRoot.querySelector('#newdomains');
    if (this.name.length === 0) {
      this.nameInput.classList.add('error');
    } else if (!(this.nameInput.classList.contains('error') || newFieldset.classList.contains('error'))) {
      if (this.isAdmin || this.newDomains.length > 0) {
        api('user_add',{name: this.name, isAdmin: this.isAdmin? 1:0, domains: this.newDomains}).then(response => {
          this.name = '';
          this.isAdmin = false;
          this.newDomains = [];
          this._processResponse(response.users);
        });
      } else {
        newFieldset.classList.add('error');
      }
    }
  }
  _deleteConfirm(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    api('user_delete', { uid: this.users[index].uid, version: this.users[index].version }).then(response => {
      if (response.status !== 'OK') throw new Error(response.status);
      this._processResponse(response.users);
    });

  }
  _deletePassword(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.dispatchEvent(new CustomEvent('delete-request', {
      bubbles: true,
      composed: true,
      detail: `Password for User ${this.users[index].name} (uid:${this.users[index].uid})`
    }));

  }
  _deleteUser(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.dispatchEvent(new CustomEvent('delete-request', {
      bubbles: true,
      composed: true,
      detail: `User ${this.users[index].name} (uid:${this.users[index].uid})`
    }));

  }
  async _fetchUserData() {
    const response = await api('users',{});
    this._processResponse(response.users);
  }
  _nameChanged(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (e.currentTarget.value.length > 0) {
      e.currentTarget.classList.remove('error');
    } else {
      e.currentTarget.classList.add('error');
    }  
  }
  _nameNewChanged(e) {
    e.stopPropagation();
    const name = e.currentTarget.value;
    if (name.length > 0) {
      e.currentTarget.classList.remove('error');
      this.name = name;
    } else {
      e.currentTarget.classList.add('error');
    }
  }
  _nameUpdated(e) {
    e.stopPropagation();
    const name = e.currentTarget.value;
    if (name.length === 0) {
      e.currentTarget.classList.add('error');
    } else if (!e.currentTarget.classList.contains('error')) {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      if (this.users[index].name !== name) { 
        api('user_name', { uid: this.users[index].uid, version: this.users[index].version, name: name }).then(response => {
          if (response.status !== 'OK') throw new Error(response.status);
          this._processResponse(response.users);
        });
      }
    }
  }
  _passwordConfirm(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    api('user_password', { uid: this.users[index].uid, version: this.users[index].version }).then(response => {
      if (response.status !== 'OK') throw new Error(response.status);
    });

  }
  _processResponse(users) {
    let lastUid = 0;
    let user;
    this.users = [];
    for (const u of users) {
      if (u.uid !== lastUid) {
        if (lastUid !== 0) this.users.push(user);
        lastUid = u.uid;
        user = { uid: u.uid, version: u.version, name: u.name, isAdmin: u.isAdmin != 0, domains: [] };
      }
      user.domains.push(u.domain);
    }
    this.users.push(user);
  }
  _toggleAdmin(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.users[index].isAdmin = !this.users[index].isAdmin;
    api('user_admin', { uid: this.users[index].uid, version: this.users[index].version, isAdmin: this.users[index].isAdmin ? 1:0}).then(response =>{
      if (response.status !== 'OK') throw new Error(response.status);
      this._processResponse(response.users);
    });
  }
  _toggleDomain(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const dindex = parseInt(e.currentTarget.dataset.dindex, 10);
    const newState = !this.users[index].domains.includes(this.domains[dindex]);
    let changeFailed = false;
    const fieldset = this.shadowRoot.querySelector(`#f${index}`);
    if (newState) {
      this.users[index].domains.push(this.domains[dindex]);      
    } else {
      const i = this.users[index].domains.findIndex(d => this.domains[dindex] === d);
      if (i >= 0) this.users[index].domains.splice(i, 1);
      if (this.users[index].domains.length === 0) {
        const fieldset = this.shadowRoot.querySelector(`#f${index}`);
        changeFailed = true;
        this.users[index].domains.push(this.domains[dindex]); //put back the one we just took off as we must not have zero
      }
    }
    if (!changeFailed) {
      api('user_capability', { 
        uid: this.users[index].uid, 
        domain: this.domains[dindex], 
        state: newState,
        version: this.users[index].version
      }).then(response => {
        if (response.status !== 'OK') throw new Error(response.status);
        this._processResponse(response.users);      
      });
    } else {
      this.requestUpdate();
    }
    
  }
  _toggleNewAdmin(e) {
    e.stopPropagation();
    this.isAdmin = !this.isAdmin;
  }
  _toggleNewDomain(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const domain = this.domains[index];
    if (this.newDomains.includes(domain)) {
      //we have the domain, so now remove it
      const index = this.newDomains.findIndex(d => domain === d);
      if (index >=0) this.newDomains.splice(index,1);
    } else {
      //add the domain in
      this.newDomains.push(domain);
    }
    this.requestUpdate('newDomains');

  }
}
customElements.define('admin-users', AdminUsers);