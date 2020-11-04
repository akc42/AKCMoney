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

/*
    `<form-manager>` Provides a form simulated by ajax
      It looks for children with a validate function to validate the components
      it looks for children with a name and value attribute to pick to send to the url provided.

*/

import { LitElement, html , css} from '../libs/lit-element.js';

import {walk, api} from '../libs/utils.js';

export class FormResponse extends Event {
  /*
     The following are the fields provided by this event

     response: The response from the api call.
  */
  constructor(response) {
    super('form-response', { composed: true, bubbles: true });
    this.response = response;
  }
};

class FormManager extends LitElement  {
  static get styles () {
    return css`
      :host {
        height: 100%;
      }
    `;
  }
  static get properties() {
    return {
      action: { type: String }
    };
  }
  constructor() {
    super();
    this.action = '';
    this.inProgress = false;
  }

  render() {
    return html`
      <slot id="mychildren"></slot>        
    `;
  }
  get params() {
    return this._params;
  }
  validate() {
    let result = true;
    const slot = this.shadowRoot.querySelector('#mychildren');
    walk(slot, node => {
      if (typeof node.validate === 'function') {
        const v = node.validate();
        if (!v) result = false;
      }
      return false;
    });
    return result;
  }
  submit() {
    const result = this.validate();
    if (result) {

      if (!this.inProgress) {
        this._params = {};
        const slot = this.shadowRoot.querySelector('#mychildren');
        walk(slot, node => {
          if (node.value !== undefined && node.name !== undefined) {
            this._params[node.name] = node.value;
            return true;
          }
          return false;
        });
        this.inProgress = true
        api(this.action, this.params).then(response => {
          this.inProgress = false;
          this.dispatchEvent(new FormResponse(response))
        }).catch((e) => { 
          this.inProgress = false;
          throw new Error(e);
        });
        
      } else {
        return false;
      }
    }
    return result;
  }
  _change(e){
    e.stopPropagaton();
    e.target.validate();

  }
  _submit(e) {
    e.preventDefault();
    this.submit();

  }
}
customElements.define('form-manager', FormManager);
