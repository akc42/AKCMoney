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
import {api} from '../libs/utils.js';

import global from '../modules/globals.js';

import {connectUrl, disconnectUrl} from '../libs/location.js';

import RouteManager from '../elements/route-manager.js';


import '../elements/delete-dialog.js';


import {WaitRequest} from '../elements/waiting-indicator.js';

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
      hoster: {type: String},
      isAdmin:{type: Boolean}
    };
  }
  constructor() {
    super();
    this.hoster = '';
    this.isAdmin = false;
  }

  connectedCallback() {
    super.connectedCallback();
    const configPromise = new Promise(resolve => {
      global.config.then(() => {
        const hostTester = new RegExp(`^(.*; +)?${localStorage.getItem('meetingHost')}=([^;]+)(.*)?$`);
        const matches = document.cookie.match(hostTester);
        if (matches) {
          //we do have a hoster cookie, so lets validate it
          api('user/check_hoster').then(response => {
            if (response.hoster !== undefined) {
              this.hoster = response.hoster.name;
              this.isAdmin = response.hoster.admin;
              sessionStorage.setItem('myName', this.hoster);
            } else {
              this.hoster = '';
              this.isAdmin = false;
              document.cookie = localStorage.getItem('meetingHost') + '=; path=/; expires = Thu, 01 Jan 1970 00:00:01 GMT';  //clear cookie
            }
            resolve();
          });
        } else {
          this.hoster = '';
          resolve();
        }
      });
    });

    connectUrl(route => {
      configPromise.then(() => { //make sure we have the config before proceeding further
        this.route = route;
      });
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    disconnectUrl();
  }

  render() {
    return html`

      <delete-dialog ></delete-dialog>
      ${cache({
        admin: html`<admin-page managed-page 
          .route=${this.subRoute} 
          .hoster=${this.hoster}></admin-page>`,
        forgotten: html`<forgotten-page managed-page></forgotten-page>`,
        home:html`<home-page managed-page .hoster=${this.hoster}></home-page>`,
        host: html`<host-page 
                      managed-page 
                      .route=${this.subRoute} 
                      .hoster=${this.hoster} 
                      ?admin=${this.isAdmin} 
                      @auth-changed=${this._authChanged}></host-page>`,
        login: html`<login-page managed-page @auth-changed=${this._authChanged}></login-page>`,
        pin: html`<pin-page managed-page .hoster=${this.hoster} .route=${this.subRoute}></pin-page>`,
        room: html`<room-page managed-page .hoster=${this.hoster} .route=${this.subRoute}></room-page>`
      }[this.page])}

    `;
  }
  loadPage(page) {
    switch (page) {  
      case 'admin':
        if(!this.isAdmin) return false;
      case 'host':
        if(this.hoster.length === 0) return false;
      case 'forgotten':
      case 'login':
      case 'pin':
      case 'room':
        const name = sessionStorage.getItem('myName');
        if (!name) return false;  //must have collected a name to proceed
      case 'home':
        break;
      default:
        return false;
    }
    this.dispatchEvent(new WaitRequest(true));
    import(`./${page}-page.js`).then(() => this.dispatchEvent(new WaitRequest(false)));
    return true;
  }
  _authChanged(e) {
    e.stopPropagation();
    if (e.changed.name.length > 0) {
      this.hoster = e.changed.name;
      this.isAdmin = e.changed.admin;
    } else {
      this.hoster = '';
      this.isAdmin = false;
      document.cookie = localStorage.getItem('meetingHost') + '=; path=/; expires = Thu, 01 Jan 1970 00:00:01 GMT';  //clear cookie
    }
  }
}
customElements.define('page-manager',PageManager);
