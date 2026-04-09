/**
@licence
    Copyright (c) 2021 Alan Chandler, all rights reserved

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
import contentDisposition from 'content-disposition';


export default class CSVResponder {
  constructor(response) {
    this.response = response;
    this._setName = false;
    this.headerLength = 0;
    this.ended = false;
    this.awaitingDrain = false;
  }
  _quotify(value) {
    return '"' + value.toString().replace('"', '""') + '"';
  }
  defineFields(fields) {
    this.fields = fields.split(':');
  }
  makeHeader(hstring) {
    if (this.headerLength === 0) {
      const headers = hstring.split(':');
      this.headerLength = headers.length;
      let line = '';
      headers.forEach((header,index) => {
        if (index !== 0) line += ',';
        line += this._quotify(header);
      });
      line += '\r\n';
      this.response.write(line);
    }
  }
  setName(name) {
    if (!this._setName) {
      this._setName = true;
      this.response.setHeader(
        'Content-Disposition', 
        contentDisposition(`${ name.replace(' ', '_') }.csv`)
      )
      
    }
  }
  write(row) {
    if (!this.ended) {
      if (!this._setName || this.fields === undefined || this.headersLength === 0) {
        throw new Error('Cannot write rows when responder not set up');
      }
      let line = '';
      this.fields.forEach((field,index) => {
        if (index !== 0) line += ',';
        const value = row[field] ?? '';
        line += this._quotify(value.toString());
      });
      line += '\r\n';
      const reply = this.response.write(line);
      if (reply) {
        return Promise.resolve();
      }
      if (!this.awaitingDrain) {
        this.awaitingDrain = true;
        const self = this;
        this.drainPromise = new Promise(resolve => {
          this.response.once('drain', () => {
            this.awaitingDrain = false;
            resolve();
          });
        });
      }
      return this.drainPromise;
    }
    return Promise.reject(); //mark as blocked      }
  }
  end() {
    if (!this.ended) {
      this.response.end();
      this.ended = true;
   
    }
  }
}

