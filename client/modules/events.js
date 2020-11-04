/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of Meeting.

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

/*
  The purpose of this file is to hold all the definitions of custom events used in pas.  We define
  event here as a sublassing of window event and then don't need to use customEvent.

 
  export class MyEvent extends Event {
    

    // a place to document event fields
    myData;

    constructor(myData) {
      super(MyEvent.eventType);
      this.myData = myData;
    }
  }
  -----------
  this.dispatchEvent(new MyEvent(42));

  el.addEventListener(MyEvent.eventType, e => console.log(e.myData));

*/



export class AuthChanged extends Event {
  

  /*
     The following are the fields provided by this event

     changed: 

  */

  constructor(changed) {
    super('auth-changed',{composed: true, bubbles: true});
    this.changed = changed;
  }
};

export class DeleteRequest extends Event {
  

  /*
     The following are the fields provided by this event

     item: The name of the item being requested to delete.

  */

  constructor(item) {
    super('delete-request',{composed: true, bubbles: true});
    this.item = item;
  }
};



export class OverwriteWarning extends Event {
   /*
     The following are the fields provided by this event

     None

  */
  constructor() {
    super('overwrite-warning',{composed: true, bubbles: true});
  }
};



export class ValueChanged extends Event {
  

  /*
     The following are the fields provided by this event

     changed: the new value

  */

  constructor(value) {
    super('value-changed',{composed: true, bubbles: true});
    this.changed = value;
  }
};


