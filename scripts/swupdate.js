/**
@licence
    Copyright (c) 2025 Alan Chandler, all rights reserved

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
import fs from 'node:fs/promises';
import {fileURLToPath } from 'node:url';

async function update(fn, s, t) {
  const filename = fn;
  const str = s;
  const token = t;
  const result = await fs.readFile(filename, 'utf8');
  let madeChange = false;
  let lines;
  if (result) {
    lines = result.toString().split("\n");
    while (lines[lines.length - 1] === '') {
      lines.pop(); //get rid of dummy lines at the end
    }
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].substring(0, str.length) === str) {
        if (lines[i] !== `${str} '${token.toString()}'`) {
          lines[i] = `${str} '${token.toString()}'`; //replace with our new token
          madeChange = true;
        }
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push(`${str} '${token.toString()}'`); //not found so append
      lines.push(''); //just add this so file ends just after the last entry
      madeChange = true;
    }
  } else {
    lines = [];
    lines.push(`${str} '${token.toString()}'`);
    lines.push(''); //just add this so file ends just after the last entry
    madeChange = true;
  }
  if (madeChange) await fs.writeFile(filename, lines.join("\n"))
}
  


const pjsonfile = fileURLToPath(new URL('../package.json', import.meta.url))
const pcontents = await fs.readFile(pjsonfile)
const pjson = JSON.parse(pcontents);
const version = 'v'+ pjson.version;
await update(fileURLToPath(new URL('../client/service-worker.js', import.meta.url)), 'version = ',version);
await fs.writeFile(fileURLToPath(new URL('../appinfo/version', import.meta.url)), version);

