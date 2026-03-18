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
import {cache} from '../libs/cache.js';
import {classMap} from '../libs/class-map.js';
import {guard} from '../libs/guard.js';

import {domHost} from '../libs/app-utils.js';

import button from '../styles/button.js';

import './dialog-box.js';

const monthFormatter = Intl.DateTimeFormat('default', {
  month: 'short'
});
const weekdayFormatter = Intl.DateTimeFormat('default', {
  weekday: 'narrow'
})
//use 5 july 2020 3:0am local, sunday (near the beginning of the month, so 7 days later it is still the same month)
const weekdayMaker = new Date(2020,6,5,3,0,0);  //setting date like this uses local time.
const weekdays = [];
for(let i = 0; i < 7; i++) {
  weekdays.push(weekdayFormatter.format(weekdayMaker));
  weekdayMaker.setDate(weekdayMaker.getDate() + 1);
}
const hours = [];
const mins = [];
for (let i = 0; i < 12; i++) {
  hours.push({
    offset: i ,  //seconds offset into the 12 hour period covered
    hour: ((i + 11) % 12 + 1).toString()  // what to display
  })
  mins.push({
    offset: i , //seconds offset
    min: ('0' + (i * 5).toString()).slice(-2),
  })
}


/*
     <calendar-input>: this is the main calendar picking widget for the entire app.
              The only required property is "value".  This is the unix epoch value, which
              is assumed to represent time in the database.

              Optional properties are "name" which can be set and read back so that it appears like
              a form, and "withTime" (set as attribute withtime ?) which means include the time of day
              to nearest 5 minutes as part of the selection algorithmn.

              The calendar does have a "validate" method which will validate if a value is set, but will fail
              if the value is not set.

              It will fire a value changed event when the pop up dialog closes, not when the value is changing
              because of selection in the picker.


*/
class CalendarDialog extends LitElement {
  static styles = [button, css`
    :host {
      --icon-size:20px;
    }
    .container {
      padding: 5px;
      box-shadow: 2px 2px 6px 0px var(--shadow-color);
      border-radius: 4px;
      width: 160px;
    }
    .datepanel {
      display: grid;
      grid-gap: 1px;
      grid-template-columns: repeat(7, 1fr);
      --icon-size: 16px;
      text-align: right;
      margin: 2px 0;
    }
    .datepanel>.month {
      grid-column: 3 / 6;
      grid-row: 1 / 2;
      text-align: center;
      cursor: default !important;
    }
    .datepanel>* {
      background-color: var(--background-color);
      color: var(--color);
      box-sizing:border-box;
      height:20px;
    }
    .datepanel>* {
      cursor: pointer;
    }
    .datepanel>.wd {
      cursor: default !important;
    }
    .datepanel>.day {
      color: grey;
    }
    .day.inmonth {
      color: white;
    }
    .month, .prev, .next, .day.today {
      color: #cf0;
    }
    .day.selected, .day.inmonth.selected  {
      color: red;
      border:1px solid red;
    }
`];
  

  static properties = {
    value: {type: Number}, //seconds since 1970 - provided by the outside
    name: {type: String, reflect: true},  //can be used in forms.
    month: {type: Number},
    year:{type:Number},
    monthName: {type: String},
    dayGuard: {type: Number},
  };

  constructor() {
    super();
    const d = new Date();
    this.value = Math.floor(d.getTime()/1000);
    this.originalValue = this.value;
    this.savedValue = this.value;
    this.setZero = false;
    this.hourGuard = -2;
    this.dayGuard = -2;
    this.minuteGuard = -2;
    this.name = '';
    this.month = d.getMonth();
    this.year = d.getFullYear();
    this.monthName = monthFormatter.format(d);
    this.pm = false;
    this.weeks = [];
    this._gotRequest = this._gotRequest.bind(this);
    this.eventLocked = true;
    this.noUnset = false;

  }
  connectedCallback() {
    super.connectedCallback();
    this.domHost = domHost(this);
    this.domHost.addEventListener('calendar-request', this._gotRequest);

  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.domHost.removeEventListener('calendar-request', this._gotRequest);
  }
  update(changed) {
    if (changed.has('month') || changed.has('year')) {
      const td = new Date();
      const dayMaker = new Date(this.year, this.month, 1, 0, 0, 0); //0 on 1st day of month
      this.monthName = monthFormatter.format(dayMaker);
      const day = dayMaker.getDay();
      dayMaker.setDate(1 - day);  //we are now at the first sunday
      this.weeks = [];
      
      for (let j = 0; j < 6; j++) { //we are always doing 6 weeks (otherwise calendar grows and shrinks annoyingly)
        const week = [];
        for (let i = 0; i < 7; i++) {

          week.push({
            date: (((dayMaker.getFullYear() * 100) + dayMaker.getMonth()) * 100) + dayMaker.getDate(),
            today: dayMaker.getFullYear() === td.getFullYear() && dayMaker.getMonth() === td.getMonth() &&
                    dayMaker.getDate() === td.getDate(),
            day: dayMaker.getDate(),
            inMonth: dayMaker.getFullYear() === this.year &&  dayMaker.getMonth() === this.month
          });
          dayMaker.setDate(dayMaker.getDate() + 1);
        }
        this.weeks.push(week);
      }

    }
    super.update(changed);
  }
  firstUpdated() {
    this.overlay = this.shadowRoot.querySelector('#picker');
    this.eventLocked = false;
  }
  updated(changed) {
    if (changed.has('value')) {
      if (this.value !== this.originalValue) {
        this.originalValue = this.value;
        this.overlay.positionTarget.dispatchEvent(new CustomEvent('calendar-reply',{bubbles: true, composed: true, detail: this.value}));
      }
      if (this.value !== 0) {
        const d = new Date();
        d.setTime(this.value * 1000);
        this.monthName = monthFormatter.format(d);
        this.year = d.getFullYear();
        this.month = d.getMonth();
        this.hourGuard = d.getHours();
        this.minuteGuard =  Math.floor(d.getMinutes()/5);
        this.dayGuard = (((this.year * 100) + this.month) * 100) + d.getDate();
        this.pm = d.getHours() >= 12;
      } else {
        this.dayGuard = -1;
        this.hourGuard = -1;
        this.minuteGuard = -1;
        this.pm = false;
      }
    }
    super.updated(changed);
  }
  render() {
    return html`
    <style>
    </style>
    <dialog-box id="picker" @overlay-closed=${this._closing} closeOnClick>
      <div class="container">
        <div class="datepanel">
          <material-icon class="prev" @click=${this._previousMonth}>chevron_left</material-icon>
          <material-icon class="prev" @click=${this._previousYear}>arrow_left</material-icon>
          <div class="month"><span>${this.monthName}</span>  <span>${this.year}</span></div>
          <material-icon class="next" @click=${this._nextYear}>arrow_right</material-icon>
          <material-icon class="next" @click=${this._nextMonth}>chevron_right</material-icon>
            ${guard([weekdays],() => weekdays.map(day => html`<div class="wd">${day}</div>`))}
            ${guard([this.dayGuard, this.month],() => this.weeks.map(week => week.map(day => html`
              <div class="day ${classMap({
                  inmonth: day.inMonth, 
                  selected:  day.date === this.dayGuard,
                  today: day.today
                })}" data-date="${day.date}" @click=${this._selectDay}>${day.day}</div> 
            `)))}      
        </div>
      </div>
      
    </dialog-box>
    `;
  }


  _closing(e) {
    e.stopPropagation();
    this.overlay.positionTarget.dispatchEvent(new CustomEvent('value-changed',{ bubbles: true, composed: true, detail:this.value})); //tell the outside world we have a value
    this.eventLocked = false;
  }
  _gotRequest(e) {
    e.stopPropagation();
    if (this.eventLocked) return;
    this.eventLocked = true;
    this.overlay.positionTarget = e.composedPath()[0];
    this.original = e.detail.date;
    this.value = e.detail.date;
    if(this.noUnset) this.savedValue = this.value;
    this.withTime = e.detail.time;
    this.overlay.show();
  }
  _nextMonth(e) {
    e.stopPropagation();
    this.month++;
    if (this.month >= 12) {
      this.year++;
      this.month = 0;
    }
  }
  _nextYear(e) {
    e.stopPropagation()
    this.year++;
  }
  _previousMonth(e) {
    e.stopPropagation();
    this.month--;
    if (this.month < 0) {
      this.year--;
      this.month = 11;
    }
  }
  _previousYear(e) {
    e.stopPropagation();
    this.year--;
  }
  
  _selectDay(e) {
    e.stopPropagation();
    const d = new Date();
    d.setTime(this.value * 1000);
    let nd = parseInt(e.currentTarget.dataset.date,10);
    d.setDate(nd % 100);
    nd = Math.floor(nd/100);
    d.setMonth(nd % 100);
    nd = Math.floor(nd/100);
    d.setFullYear(nd);
    this.value = Math.floor(d.getTime() / 1000);
  }

  _show() {
    this.overlay.show();
  }
}
customElements.define('calendar-dialog', CalendarDialog);