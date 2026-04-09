
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

export function  nullIfZeroLength (str) {
  if (str === undefined) return null;
  return str.length > 0 ? str : null;
}
export function  booleanToDbValue(b) {
  if (b === undefined) return 0;
  return b? 1:0;
}
export function  nullOrNumber(n) {
    if (n === undefined) return null
    const x = parseFloat(n);
    if (isNaN(x)) return null;
    return x;
}
export function nullOrAmount(a) {
  if (a === undefined) return null
  const x = parseFloat(a);
  if (isNaN(x)) return null;
  return Math.round(x * 100);
}
export function  dbDateToString(d) {
    const date = new Date();
    date.setTime(d * 1000);
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
export function blankIfNull(str) {
  if (str === null) return '';
  return str;
}
export function insertRepeats(repeatCount,repeats, insertRepeat, updateRepeat) {
  while (true) {
    const {count} = repeatCount.get()??{count:0};
    if (count === 0) break;
    const newTransactions = [];
    for (const xaction of repeats.iterate()) {
      let nextDate;
      const xactionDate = new Date();
      xactionDate.setTime(xaction.date * 1000);
      switch (xaction.repeat) {
        case 1:
          //weekly repeat
          nextDate = xaction.date + 604800;  //add on a week
          break;
        case 2:
          // fortnight repeat;
          nextDate = xaction.date + 1209600; //add on a fortnight
          break;
        case 3:
          // monthly repeat - relative to start of month
          const nextMonth = new Date(xactionDate);
          nextMonth.setMonth(xactionDate.getMonth() + 1);
          //In an additional Month (relative to start of month)
          nextDate = Math.round(nextMonth.getTime() / 1000);
          break;
        case 4:
          //monthly repeat - relative to end of month;
          const startOfNextMonth = new Date(xactionDate);
          startOfNextMonth.setMonth(xactionDate.getMonth() + 1)
          startOfNextMonth.setDate(1);
          const distanceToEnd = Math.round(startOfNextMonth.getTime() / 1000) - xaction.date;
          const secondMonth = new Date(startOfNextMonth);
          secondMonth.setMonth(secondMonth.getMonth() + 1);
          nextDate = Math.round(secondMonth.getTime() / 1000) - distanceToEnd;
          break;
        case 5:
          //in a quarter
          const nextQuarter = new Date(xactionDate);
          nextQuarter.setMonth(xactionDate.getMonth() + 3);
          nextDate = Math.round(nextQuarter.getTime() / 1000);
          break;
        case 6:
          //in a year
          const nextYear = new Date(xactionDate);
          nextYear.setFullYear(xactionDate.getFullYear() + 1);
          nextDate = Math.round(nextYear.getTime() / 1000);
          break;
        case 7:
          nextDate = xaction.date + 2419200; //add on 4 weeks
          break;
        default:
          throw new Error('Invalid repeat period on database')
      }
      //save the need to update 
      newTransactions.push({ ...xaction, date: nextDate });
      //make a new transaction at the repeat distance

    }
    for (const xaction of newTransactions) {
      insertRepeat.run(
        xaction.date,
        xaction.src,
        xaction.dst,
        xaction.srcamount,
        xaction.dstamount,
        xaction.srccode,
        xaction.dstcode,
        xaction.rno,
        xaction.repeat,
        xaction.currency,
        xaction.amount,
        xaction.description);
      updateRepeat.run(xaction.id); //remove repeat from current transaction

    }
    //repeat until there are no more repeats within range (the recent insertions may have created some more)
  }
    
}
