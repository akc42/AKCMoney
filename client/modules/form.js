/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Money.

    Money is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Money is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Money.  If not, see <http://www.gnu.org/licenses/>.
*/

import { WaitRequest } from '../elements/waiting-indicator.js';
import { api } from '../libs/utils.js';

class FormResponse extends Event {
  /*
     The following are the fields provided by this event

     response: The response from the api call.
  */
  constructor(response) {
    super('form-response', { composed: true, bubbles: true });
    this.response = response;
  }
};

//handle the on submit event from a form

export function submit(e) {
  e.stopPropagation();
  e.preventDefault();
  const target = e.currentTarget;
  const params = {};
  let isAllValid = true;
  target.querySelectorAll('input, select').forEach(field => {
    if (field.type === 'radio' || field.type === 'checkbox') return;
    if (!(isAllValid && field.checkValidity())) {
      isAllValid = false;
      return;
    }
    if (field.name !== undefined && field.value !== undefined) params[field.name] = field.value;
  });
  if (isAllValid) {
    target.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked').forEach(field => {
      if (!(isAllValid && field.checkValidity())) {
        isAllValid = false;
        return;
      }
      if (field.name !== undefined && field.value !== undefined) params[field.name] = field.value;
    });
    if (isAllValid && !(target.validator !== undefined && typeof target.validator === 'function' && !target.validator(target))) {
      target.dispatchEvent(new WaitRequest(true));
      api(new URL(target.action).pathname, params).then(response => {
        target.dispatchEvent(new WaitRequest(false));
        target.dispatchEvent(new FormResponse(response))
      });
      return;
    }
  }
  target.dispatchEvent(new FormResponse(null));
}

