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
import {html, css } from '../libs/lit-element.js';
import { cache } from '../libs/cache.js';
import RouteManager from '../elements/route-manager.js';


/*
     <admin-page>: Controls the admin functions
*/
class AdminPage extends RouteManager {
  static get properties() {
    return {
      domains: {type: Array} //array of domains
    };
  }
  constructor() {
    super();
    this.domains = [];
  }
  render() {
    return html`
      <style>
      :host {
        height: 100%
      }
      </style>
      ${cache({
        home: html`<admin-home managed-page></admin-home>`,
        accounts: html`<admin-accounts managed-page .route=${this.subRoute}></admin-accounts>`,
        codes: html`<admin-codes managed-page .route=${this.subRoute}></admin-codes>`,
        currencies: html`<admin-currencies managed-page .route=${this.subRoute}></admin-currencies>`,
        domains: html`<admin-domains managed-page .route=${this.subRoute}></admin-domains>`,
        users: html`<admin-users managed-page .route=${this.subRoute} .domains=${this.domains}></admin-users>`
      }[this.page])}
    `;
  }
  loadPage(page) {
    switch (page) {
      case 'accounts':
      case 'codes':
      case 'currencies':
      case 'domains':
      case 'users':
      case 'home':
        break;
      default:
        return false;
    }
    document.body.dispatchEvent(new CustomEvent('wait-request',{ detail:true}));
    import(`./admin-${page}.js`).then(() => document.body.dispatchEvent(new CustomEvent('wait-request',{detail:false})));
    return true;
  }
}
customElements.define('admin-page', AdminPage);