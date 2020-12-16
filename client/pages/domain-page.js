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

import page from '../styles/page.js';

/*
     <domain-page>: Displays a yealy accounts for the domain
*/
class DomainPage extends LitElement {
  static get styles() {
    return [page, css``];
  }
  static get properties() {
    return {
      route: {type: Object}
    };
  }
  constructor() {
    super();
    this.route = {active: false};
    this.router = new Route('/','page:domain');
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
        
      }

    }
    super.updated(changed);
  }
  render() {
    return html`
      <style>
      </style>
      <p>Domain Page Not Implemented Yet</p>
    `;
  }
}
customElements.define('domain-page', DomainPage);