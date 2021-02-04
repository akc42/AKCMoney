/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file provided as part of Meeting

    Meeting is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Meeting is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Meeting.  If not, see <http://www.gnu.org/licenses/>.
*/


import { html,css } from '../libs/lit-element.js';
import {cache} from '../libs/cache.js';
import {connectUrl, disconnectUrl} from '../libs/location.js';

import RouteManager from '../elements/route-manager.js';
import '../elements/delete-dialog.js';


export class PageManager extends RouteManager {
  static get styles() {
    return css`
      :host {
        height:100%;
      }
    `;
  }
  static get properties() {
    return {
      codes: {type: Array}, //list of codes
      repeats: {type: Array}, //list of repeats
      accounts: {type: Array}, //list of accounts
      domains: {type: Array} //list of domains

    };
  }
  constructor() {
    super();
    this.codes = [];
    this.repeats = [];
    this.accounts = [];
  }

  connectedCallback() {
    super.connectedCallback();
    connectUrl(route => this.route = route);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    disconnectUrl();
  }
  update(changed) {
    if (changed.has('page') && this.page !== null && this.page.length > 0) {
      this.dispatchEvent(new CustomEvent('page-changed',{bubbles: true, composed: true, detail:this.page}));
    }
    super.update(changed);
  }
  render() {
    return html`
      <delete-dialog></delete-dialog>
      ${cache({
        home: html`<home-page managed-page></home-page>`,
        account: html`<account-page 
                        managed-page
                        .accounts=${this.accounts} 
                        .codes=${this.codes} 
                        .repeats=${this.repeats} 
                        .route=${this.subRoute}></account-page>`,
        domain: html`<domain-page 
                        managed-page 
                        .route=${this.subRoute} 
                        .repeats=${this.repeats}
                        .codes=${this.codes}></domain-page>`,
        offsheet: html`<offsheet-page 
                        managed-page 
                        .route=${this.subRoute}
                        .repeats=${this.repeats}
                        .codes=${this.codes}></offsheet-page>`,
        profile: html`<profile-page managed-page .route=${this.subRoute}></profile-page>`,
        sorter: html`<sorter-page managed-page  .route=${this.subRoute}></sorter-page>`,
        admin: html`<admin-page 
                        managed-page 
                        .domains=${this.domains}
                        .route=${this.subRoute}></admin-page>`
      }[this.page])}
    `;
  }
  loadPage(page) {
    switch (page) {  
      case 'admin':
        const user = JSON.parse(sessionStorage.getItem('user'))
        if (user.isAdmin !== 1) return false;
      case 'account':
      case 'domain':
      case 'offsheet':
      case 'profile':
      case 'sorter':
      case 'home':
        break;
      default:
        return false;
    }
    this.dispatchEvent(new CustomEvent('wait-request',{bubbles: true, composed: true, detail:true}));
    import(`./${page}-page.js`).then(() => this.dispatchEvent(new CustomEvent('wait-request',{
      bubbles: true, 
      composed: true, 
      detail:false
    })));
    
    return true;
  }
}
customElements.define('page-manager',PageManager);
