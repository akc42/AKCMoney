/**
    @licence
    Copyright (c) 2023 Alan Chandler, all rights reserved

    This file is part of PASv5, an implementation of the Patient Administration
    System used to support Accuvision's Laser Eye Clinics.

    PASv5 is licenced to Accuvision (and its successors in interest) free of royality payments
    and in perpetuity in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
    implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. Accuvision
    may modify, or employ an outside party to modify, any of the software provided that
    this modified software is only used as part of Accuvision's internal business processes.

    The software may be run on either Accuvision's own computers or on external computing
    facilities provided by a third party, provided that the software remains soley for use
    by Accuvision (or by potential or existing customers in interacting with Accuvision).
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
//const { mtime } = await stat(pjsonfile); Not needed for service worker update
const vcontents = {
    version: version
}
await update(fileURLToPath(new URL('../client/service-worker.js', import.meta.url)), 'version = ',version);



