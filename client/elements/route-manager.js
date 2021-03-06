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


import { LitElement } from '../libs/lit-element.js';

import domHost from '../libs/dom-host.js';
import Route from '../libs/route.js';


export default class RouteManager extends  LitElement {
  static get properties() {
    return {
      route: {type: Object},
      subRoute: {type: Object},
      page: {type: String},
    };
  }
  constructor() {
    super();
    this._closeRequest = this._closeRequest.bind(this);
    this._closeResponse = this._closeResponse.bind(this);
    this.router = new Route('/:page');
    this.route = {active: false};
    this.subRoute = {active: false};
    this.page = '';
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('page-close', this._closeRequest);
    this.addEventListener('page-closed', this._closeResponse);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('page-close', this._closeRequest);
    this.removeEventListener('page-closed', this._closeResponse);
    this.route = {active: false};
  }
  updated(changed) {
    if (changed.has('route')) {
      if (this.route.active) {
        this.subRoute = this.router.routeChange(this.route);
        if (this.subRoute.active) {
          const page = (this.subRoute.active && this.subRoute.params.page.length > 0 ) ?
            this.subRoute.params.page : this.homePage();
          if (page !== this.page) {
            //clear before changing to another route
            this.dispatchEvent(new CustomEvent('page-data',{bubbles: true, composed: true, detail:''}));
            // load page import on demand.            
            if(this.loadPage(page)) {
              this.page = page;
              performance.mark('start_page_' + page);
              if (this.constructor.titles !== undefined) {
                const title = this.constructor.titles[page];
                if (title !== undefined) this.dispatchEvent(new CustomEvent('page-title',{bubbles: true, composed: true, detail:title}));
              }
            } else {
              this.dispatchEvent(new CustomEvent('page-close', {bubbles: true, composed: true}))
            }
          }
        } else {
          const page = this.homePage();
          //if this is the first time through we may not have our home page yet
          if (!this.loadPage(page)) { 
            this.dispatchEvent(new CustomEvent('page-close', {bubbles: true, composed: true}));
          } else {
            this.page = page;
          }
        }
      } else {
        this.page = null;
      }
    }
    super.updated(changed);
  }
  _closeRequest(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('page-data',{bubbles: true, composed: true, detail:''}));
    if (e.composedPath()[0] === this) { //we don't need to cater for event retargetting
    //this event was meant for us, so lets see if we are at the home page or not
      if (this.page !==null && this.page.length > 0 && this.page !== this.homePage()) {
        /* not at home page, so we should tell our subordinate (who
          is currently selected) that there has been a close request.

          With this new system there is actually only one element to choose from.
        */
        const element = this.shadowRoot.querySelector('[managed-page]');
        if (element) {
          element.dispatchEvent(new CustomEvent('page-close', {bubbles: true, composed: true}));
        } else {
          /*
            this should not have happened - route back to our home page and throw an error
          */
          window.dispatchEvent(new CustomEvent('route-changed',{bubbles: true, composed: true, detail:{
              segment: this.route.segment,
              path: '/'
          }}));
          
          throw new Error('didn\'t find the element with "managed-page" attribute when closing page ' + this.page);
        }
      } else if (this.page === null) {
        /*
          We tries to go to a route that wasn;t allowed before establishing any route. so establish home page.
        */
        window.dispatchEvent(new CustomEvent('route-changed',{bubbles: true, composed: true, detail:{
          segment: this.route.segment,
          path: '/'
        }}));
        
      } else {
        /* we are at home page 
          either tell our host that we have therefore closed
          or if we are trying to do an explicit reroute then do if via abstract */
        const host = domHost(this);
        if (!this.closeReroute() && host) {
          host.dispatchEvent(new CustomEvent('page-closed', {bubbles: true, composed: true}));
        }
      }
    } else {
      /*
        we have informed our child of the close request but he hasn't responded, because we
        are seeing the event that he should have stopped bubble back up to us.
        We just switch to the home page (at our level)

        In order to do that, we take advantage of the fact that we  know that the
        url for our home page doesn't contain the value of the correct "page" in
        the url, and therefore we can emulate what route does without the complexity
        that it uses
      */
      window.dispatchEvent(new CustomEvent('route-changed',{bubbles: true, composed: true, detail:{
        segment: this.route.segment,
        path: '/'
      }}));
    }
  }
  _closeResponse(e) {
    /*
      we have been told that our child was already at home, so is
      closed, we need to switch to the home page (at our level)
    */
    e.stopPropagation();
    //see comment above to see why this works
    window.dispatchEvent(new CustomEvent('route-changed',{bubbles: true, composed: true, detail:{
      segment: this.route.segment,
      path: '/'      
    }}));
  }
  // abstract (or not if we are happy with what they do)
  homePage() {return 'home';}
  closeReroute() {return false;}
  loadPage() {return true;} //return false if you want to say do not switch to this route.
}
customElements.define('route-manager', RouteManager);


