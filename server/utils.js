
/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

    This file is part of money.

    money is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    money is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with money.  If not, see <http://www.gnu.org/licenses/>.
*/

(function () {
  'use strict';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jly',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  

  module.exports = {
    nullIfZeroLength: (str) => {
      if (str === undefined) return null;
      return str.length > 0 ? str : null;
    },
    booleanToDbValue: (b) => {
      if (b === undefined) return 0;
      return b? 1:0;
    },
    nullOrNumber: (n) => {
      if (n === undefined) return null
      const x = parseFloat(n);
      if (isNaN(x)) return null;
      return x;
    },
    nullOrAmount: (a) => {
      if (a === undefined) return null
      const x = parseFloat(a);
      if (isNaN(x)) return null;
      return Math.round(x * 100);
    },
    dbDateToString: (d) => {
      const date = new Date();
      date.setTime(d * 1000);
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    },
    blankIfNull: (str) => {
      if (str === null) return '';
      return str;
    }
  }
})();