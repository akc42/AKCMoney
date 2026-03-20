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
import mdb, {manager} from '@akc42/sqlite-db';
import path from 'node:path';
import fs from 'node:fs/promises';
import { setTimeout} from 'node:timers/promises';
import { existsSync,readFileSync } from 'node:fs';
import {fileURLToPath } from 'node:url';
import {Logger,Debug, Responder, logWriter, close as debugClose,  getDebugLog} from '@akc42/server-utils';
import chalk from 'chalk';
import bodyParser  from 'body-parser';
import  Router from 'router';
import jwt  from 'jwt-simple';
import http from 'node:http';
import PDFDocument from 'pdfkit';
import { v4 }  from 'uuid';
import serverDestroy from 'server-destroy';
import finalhandler from 'finalhandler';
import bcrypt from 'bcrypt';
import url from 'node:url';
import CSVResponder from './csvresponder.js';



const debug = Debug('server');
const debugapi = Debug('api');
const debuguser = Debug('user');
const debugauth = Debug('auth');

const logdb = Logger('server', 'db');
const logauth = Logger('Server', 'auth')
const logerr = Logger('Server', 'error');
const logger = Logger('server', 'app');


async function loadServers(relPath) {
  const dir = fileURLToPath(new URL (relPath, import.meta.url));
  debugapi('loading servers at path', dir, `(from ${relPath})`);
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = dirents.filter(dirent => !dirent.isDirectory()).filter(dirent => dirent.name.toLowerCase().slice(-3) === '.js')
    .map(dirent => dirent.name);
  const reply = {};
  for (const file of files) {
    try {
      const exp = await import(`./${relPath}/${file}`);
      reply[file.slice(0,-3)] = exp.default;
    } catch(err) {
      logger('error', `Failed to load ${file} with error ${err}`);
    }
  }
  debugapi('load server reply', JSON.stringify(Object.keys(reply)));
  return reply;
};

async function forbidden(req,res, message) {
  logauth(req.headers['x-forwarded-for'], message, 'with request url of',req.originalUrl);
  res.statusCode = 403;
  res.end('---403---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail

}
async function errored(req,res,error) {
  const message = `Error${error.message ? ': ' + error.message: '' } ${error.stack? ': ' + error.stack: ''}`;
  logerr(req.headers['x-forwarded-for'] , message,'\nwith request url of ',req.originalUrl);
  res.statusCode = 500;
  res.end('---500---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail.

}
process.on('unhandledRejection', (err) => {
  logerr('crash', `Unhandled Rejection with error ${err.stack || err.toString()}`);
}); 
process.on('uncaughtException', (err) => {
  logerr('crash', `Uncaught Exception with error ${err.stack || err.toString()}`);

});

if (!mdb.isOpen) {
  logdb('crash', 'Database failed to open');
} else {
  const {count} = mdb.get`SELECT COUNT(*) AS tables FROM pragma_table_list() WHERE schema = 'main' AND name NOT LIKE 'sqlite_%'`
  if (count  === 0) {
    debug('initialise database needed')
    // We are not yet initialised so time to run the initisation script
    const initialiseScriptP =  path.resolve(process.env.MONEY_DB_INIT_DIR, `database.sql`);
    const initialiseScript = readFileSync(initialiseScriptP,{ encoding: 'utf8' });
    mdb.transaction((db) => {
      db.exec(initialiseScript);
    });
  }
  const {value: dbVersion} = mdb.get`SELECT value FROM Settings WHERE name = 'version'`;
  if (dbVersion < Number(process.env.MONEY_DB_VERSION)) {
    debug('version updrage needed')
    const upgradeP =  path.resolve(process.env.MONEY_DB_INITDIR, `upgrade.sql`);
    if (existsSync(upgradeP)) {
      const upgrade = readFileSync(upgradeP,{ encoding: 'utf8' });
      mdb.transaction((db) => {
        db.exec(upgrade);
      });
    } else {
      logdb('crash', 'Database Upgrade Incomplete');
    }
  }

}



async function finalErr (err,req) {
  logerr( `Final Error at url ${req.originalUrl} with error ${err.stack || err.toString()}`);
}

let server;

try {
  const version = await fs.readFile(fileURLToPath(new URL(process.env.MONEY_VERSION_FILE ,import.meta.url)), 'utf-8')
  const { mtime } = await fs.stat(fileURLToPath(new URL(process.env.MONEY_VERSION_FILE ,import.meta.url))); 
  const year = new Date(mtime).getUTCFullYear();


  let amnestyDate;
  if (process.env.MONEY_TRACKING !== 'no' ) {
    mdb.transaction(db => {
      const {count} = db.get`SELECT COUNT(*) AS count FRON Login_Log`??{count:0};
      if (count === 0) {
        db.run`INSERT INTO Login_Log (track_uid, isSuccess) VALUES ('New Server',1)`;
        amnestyDate = new Date();
        amnestyDate.setDate(amnestyDate.getDate() + 1);
      } else {
        const {time} = db.get`SELECT time FROM Login_Log WHERE lid = ${1}`??{time: 0};
        if (time > 0) {
          amnestyDate = new Date(time * 1000);
        } else {
          amnestyDate = new Date();
          amnestyDate.setDate(amnestyDate.getDate() + 1);
        }
      }
    });
  }
  /*
    Get the few important settings that we need in our server, but also take the opportunity to get back what we need for
    our config route
  */
  const serverConfig = {};
  const clientConfig= {};
  mdb.transaction(db => {
    const settings = ['auth_cookie', 'token_key', 'server_port', 'token_expires'];
    if (process.env.MONEY_TRACKING !== 'no') settings.push('track_cookie');
    for (const name of settings) {
      const {value} = db.get`SELECT value FROM Settings WHERE name = ${name}`??{value: ''};
      const confname = name.split('_').map((segment,i) => i === 0? segment: segment[0].toUpperCase() + segment.slice(1)).join('');
      serverConfig[confname] = value
    }
    serverConfig.tokenKey = `AKCMoney${serverConfig.tokenKey}`;
    clientConfig.authCookie = serverConfig.authCookie;
    
  });

  function generateCookie(payload, key, expires) {
    const date = new Date();
    if (expires) {
      date.setTime(date.getTime() + (expires * 60 * 60 * 1000));
      payload.exp = Math.round(date.getTime() / 1000);
    }
  
    debugauth('generated cookie', key, ' expires ', expires ? date.toGMTString() : 0);
    return `${key}=${jwt.encode(payload, serverConfig.tokenKey)}; expires=${expires ? date.toGMTString() : 0}; Path=/`;
  }
  

  debug('read config variables');

  const routerOpts = {mergeParams: true};
  const router = Router(routerOpts);  //create a router
  const api = Router(routerOpts);  
  const pdf = Router(routerOpts);
  const csv = Router(routerOpts);
  
  debug('tell router to use api router for /api/ routes');
  router.use('/api/', api);

  /*
    Our first route is very simple, we just need to return user config parameters - we set up earlier

  */
  api.get('/config', (req,res) => {
    debugapi('config request');
    //do this every client start up because then we can change them without restarting server
    mdb.transaction(db => {
      const settings = ['client_log', 'client_uid', 'min_pass_len', 'dwell_time','webmaster', 'repeat_days', 'year_end', 'null_account', 'null_code'];
      for(const name of settings) {
      const {value} = db.get`SELECT value FROM Settings WHERE name = ${name}`??{value: ''};     
        const confname = name.split('_').map((segment,i) => i === 0? segment: segment[0].toUpperCase() + segment.slice(1)).join('');
        clientConfig[confname] = value
      }
      const {name, description} = db.get`SELECT name, description FROM Currency WHERE priority = 0`??{name:'',description:''};
      clientConfig.defaultCurrency = name;
      clientConfig.defaultCurrencyDescription = description;
      
    });
//        const payload = { uid: 1, name: 'alan', password: false, isAdmin: 1, account: 'Bank - Current', domain: 'Personal' }; //TEMP
//        res.setHeader('Set-Cookie', generateCookie(payload, serverConfig.authCookie, serverConfig.tokenExpires)); //TEMP

      //we might have already done this but it doesn't matter
    clientConfig.version = version; 
    clientConfig.copyrightYear = year;
    res.end(JSON.stringify(clientConfig));
    debugapi('returned version', version,'and year', year);
  
  })
  /*
    the next is a special route used to identify users to keep track of failed password attempts
  */
  debug('setting up user.js response')
  api.get('/user.js', (req,res) => {
    
    const token = req.headers['if-none-match'];
    const modify = req.headers['if-modified-since'];
    const ip = req.headers['x-forwarded-for'];  //note this is ip Address Now, it might be different later. Is a useful indication for misuse.
    debuguser('got /api/user.js request from ip',ip, 'token', token,'modify', modify )
    /*
      Special function to make a response to this request
    */
    function makeResponse(res,uuid) {
      
      const payload = {
        uid: uuid,
        ip: ip
      };
      debuguser('making response of uuid', uuid, 'ip', ip);
      const token = jwt.encode(payload, serverConfig.tokenKey);
      debuguser('tracking token = ', token);
      res.writeHead(200, {
        'ETag': token,
        'Last-Modified': new Date(0).toUTCString(),
        'Cache-Control': 'private, max-age=31536000, s-max-age=31536000, must-revalidate',
        'Content-Type': 'application/javascript'
      })
      res.write(`      
document.cookie = '${serverConfig.trackCookie}=${token}; expires=0; Path=/'; 
      `);
    }
    // main checking
    debuguser('tracking is set to',process.env.MONEY_TRACKING )
    if (process.env.MONEY_TRACKING !== 'no') {
      if (token !== undefined && token.length > 0) {
        //we have previously set this up as an e-tag and now the browser is asking us whether it has changed
        debuguser('tracking token found as ', token);
        try {
          //we want to decode this to check it hasn't been tampered wth
          const payload = jwt.decode(token, serverConfig.tokenKey);
          debuguser('Decoded tracking token as payload', payload);
          res.statusCode = 304;
        } catch(e) {
          // someone has been messing with things so we make a new one, but mark it as corrupt, so when its used we know
          makeResponse(res, 'Corrupt');
        }
      } else {
        //user should have had a token if its after the amnesty date and his ip has been used before
        if (new Date() > amnestyDate) {
          debuguser('after amnesty date of', amnestyDate)
          const {count} = mdb.get`SELECT COUNT(*) AS count FROM Login_log WHERE upaddress = ${ip} OR track_ip = ${ip}`??{count: 0};
          debuguser('count of', count, 'previous logins from', ip);
          if (count > 0) {
            forbidden(req,res,'Missing token');
            return;
          }

        } 
        //not set this up before, so lets create a uid and set it up
        makeResponse(res, v4()); //unique id from uuid.v4
      }
    } else {
      res.writeHead(200, {
        'Cache-Control': 'private, max-age=31536000, s-max-age=31536000, must-revalidate',
        'Content-Type': 'application/javascript'
      })
    }
    res.end();
    debuguser('/api/user.js response complete');
  });

    /*
        From this point on, all calls expect the user to have a trackCookie cookie.
    */
    debug('Setting up to Check Cookies from further in');
    api.use((req, res, next) => {
      if (process.env.MONEY_TRACKING !== 'no') {
        debuguser('checking tracking cookie');
        const cookies = req.headers.cookie;
        if (cookies) {
          const userTester = new RegExp(`^(.*; +)?${serverConfig.trackCookie}=([^;]+)(.*)?$`);
          const matches = cookies.match(userTester);
          if (matches) {
            debuguser('Cookie found')
            const token = matches[2];
            try {
              const payload = jwt.decode(token, serverConfig.authCookie);  //this will throw if the token is corrupt
              if (payload.uid === 'Corrupt') throw new Error('Corrupted Tracker Reused');
              req.track = payload;
              debuguser('completed checking cookie')
              next();
            } catch (error) {
              debuguser('invalid tracking cookie')
              forbidden(req, res, 'Invalid Track Token: Error: ' + error.toString());
            }
          } else {
            debuguser('did not find tracking cookie')
            forbidden(req, res, 'Invalid Cookie');
          }
        } else {
          debuguser('did not find tracking cookie')
          forbidden(req, res, 'Invalid Cookie');
        }
      } else {
        next(); //not tracking so immediately on to next
      } 
    })
  
  /*
    We now only support posts request with json encoded bodies so we parse the body
  */

  api.use(bodyParser.json());
  /*
    Client Debug Support
  */
  debug('setting up debug api');
  api.post('/debuglog/:immediate', async (req,res) =>{
    //all the rest of the parameters apart from ip address will be encoded in the body.  They should be the exact parameters to be passed to
    //logWriter 
    let immediate = Number(req.params.immediate);
    const ip = req.headers['x-forwarded-for'];
    let output;
    let crsh;
    if(Number.isNaN(immediate)) {
      const topic = req.params.immediate;
      const message = req.body.message ?? '';
      const gap = req.body.gap ?? null; //seemlessly leave out gap if it isn't provided  
      immediate = 1;
      crsh = 0;
      output = logWriter(0,0,1,ip,topic,message,null,gap);
    } else {
      const {logtime, crash, shortdate, topic, message, colourspec,gap} = req.body; 
      output = logWriter(logtime, crash??0, shortdate??0,ip,topic??'unknown', message??'message not provided', colourspec??null, gap??null);
      crsh = crash;
    }
    if (immediate === 1 || crsh === 1) {
      console.log(output.message);
      if (crsh === 1) {
        let lt;
        getDebugLog((logid,message) => {
          if (lt === undefined) lt=message.substring(0,24);
          console.log(chalk.whiteBright(logid), message)
        },output.logid,Number(process.env.PAS_DEBUG_CACHE_SIZE), output.ip).then(() => {
          console.log(chalk.whiteBright(lt),chalk.white.bgBlue('Above are all the debug calls (most recent first) which lead up to the error above'));
        });
      }
    }       
    
    res.end();
  });
  /*
    A simple log api
  */
  debug('set up logging api')
  api.post('/log/:topic/:message', (req,res) => {
    const ip = req.headers['x-forwarded-for'];
    const message = `${chalk.black.bgCyan(req.params.topic)} ${req.params.message}`;
    logger(ip,'log',message );
    res.end();
  });

  /*
    User Login
  */
  debug('Setting up User Login')
  api.post('/login', async (req,res) => {
    debugauth('Trying to Login',req.body.username);
    const user = mdb.get`SELECT * FROM user WHERE name = ${req.body.username}`;
    let success = false;        
    if (user) {
      success = true;
      if (user.password) {
        success = await bcrypt.compare(req.body.pwd, user.password);
      }
    }
    if (process.env.MONEY_TRACKING !== 'no') {
      mdb.run`INSERT INTO login_log (ipaddress,track_uid,track_ip,username,isSuccess) VALUES 
        (${req.headers['x-forwarded-for']},${req.track.uid},${req.track.ip},${req.body.name},${success? 1:0})`;
      
    }
    if (success) {
      debug('login success so set cookie and return user')
      user.password = !!user.password; //turn password into a boolean as to whether it exists;
      user.remember = req.body.remember !== undefined && user.password;
      res.setHeader('Set-Cookie', generateCookie(user, serverConfig.authCookie, user.remember ? serverConfig.tokenExpires:false)); //refresh cookie to the new value 
      res.end(JSON.stringify(user));
    } else {
      debugauth('incorrect password')
      res.end(JSON.stringify({}));
    }
  });
  /*
    validate user
  */
  debug('setting up validate user api');
  api.post('/validate_user', async (req,res) => {
    debugauth('validate_user')
    const cookies = req.headers.cookie;
    const responder = new Responder(res)
    const authTester = new RegExp(`^(.*; +)?${serverConfig.authCookie}=([^;]+)(.*)?$`);
    const matches = cookies.match(authTester);
   
    if (cookies && matches) {

      try {
        const user = jwt.decode(matches[2], serverConfig.tokenKey);  //this will throw if the cookie is expired or otherwise invalid
        debuguser('user info from cookie', user);
        const newCookie = generateCookie(user, serverConfig.authCookie,user.remember ? serverConfig.tokenExpires:false); //refresh cookie to the new value 
        res.setHeader('Set-Cookie',newCookie ); 
        responder.addSection('status', 'OK');
        responder.addSection('user', user);
        debugauth('User', user.displayName, 'Validated', 'ip address',req.headers['x-real-ip']);
      } catch (error) {
        logger(req.headers['x-real-ip'], 'log', 'User', req.body.name,'Session Expired');
        res.setHeader('Set-Cookie', 'PASv5=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        responder.addSection('status', 'Expired');
      }
    } else {
      logger(req.headers['x-real-ip'], 'log', 'User', req.body.name,'Session Token Missing');
      responder.addSection('status', 'Off');
    }
    responder.end();
  });
  /*
    Anything past here user MUST be validated
  */
  debug('Setting up to Check Auth Cookie');
  api.use((req, res, next) => {
    const cookies = req.headers.cookie;
    const authTester = new RegExp(`^(.*; +)?${serverConfig.authCookie}=([^;]+)(.*)?$`);
    const matches = cookies.match(authTester);
    if (matches) {
      const token = matches[2];
      try {
        const payload = jwt.decode(token, serverConfig.tokenKey);  //this will throw if the cookie is expired
        req.user = payload;
        res.setHeader('Set-Cookie', generateCookie(payload, serverConfig.authCookie, payload.remember ? serverConfig.tokenExpires: false)); //refresh cookie to the new value 
        next();
      } catch (error) {
        if (error.constructor.name === 'Token expired') {
          /*
            there might be a  small windows of a few milliseconds were the token is expired and so has the cookie, but we 
            still see the cookie - not sure.  This just allows for that possibility.  Validate_user should pick this up and
            get the user to login again.
          */
          res.end();
        } else {
          forbidden(req, res, 'Invalid Auth Token: Error: ' + error.toString());
        }
      }
    } else {
      forbidden(req, res, 'Invalid Cookie');
    }
  });

  debug('tell router to use pdf router for /api/pdf/ routes');
  api.use('/pdf/', pdf);
  debug('tell router to use csv router for /api/csv/ routes');
  api.use('/csv/', csv);

  
  debug('Setting Up Main API');

  const apis = await loadServers('api');
  for (const a in apis) {
    debugapi(`Setting up /api/${a} route`);
    api.post(`/${a}`, async (req, res) => {
      debugapi(`Received /api/${a}`);
      try {
        const responder = new Responder(res);
        await apis[a](
          req.user, 
          req.body, 
          responder, 
          user => res.setHeader('Set-Cookie', 
            generateCookie(user, serverConfig.authCookie, user.remember ? serverConfig.tokenExpires : false)
          ) //refresh cookie to the new value 
        );
        responder.end();
      } catch (e) {
        errored(req, res, e);
      }
    });
  }
  const pdfs = await loadServers('pdf');
  for (const p in pdfs) {
    debugapi(`Setting up /api/pdf/${p} route`);
    pdf.post(`/${p}`, async (req, res) => {
      debugapi(`Received /api/pdf/${p}`);
      let doc;
      try {

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Link',
          'rel="shortcut icon" sizes="32x32" href="/images/money-logo=32x32.png"'
        );
        res.statusCode = 200;
        doc = new PDFDocument({
          size: 'A4',
          layout: 'portrait',
          info: {
            Author: 'Alan Chandler',
            Subject: 'AKCMoney Report',
            Title: `${p}`
          },
          margins: { top: 36, bottom: 36, left: 72, right: 72 }
        });
        doc.pipe(res);
        doc.font('Helvetica', 11); //default initial font
        await pdfs[p](
          req.user,
          req.body,
          doc
        );

      } catch (e) {
        if (doc !== undefined) {
          doc.fillColor('red').fontSize(14).font('Helvetica-Bold');
          doc.text('SERVER ERROR - CANNOT COMPLETE PDF', {width: 172, align: 'center'});
        }
        logerr(req.headers['x-forwarded-for'],'PDF function ', p , 'failed with error', e.stack);
      }
      if (doc !== undefined) doc.end();
    });
  }
  const csvs = await loadServers('csv');
  for (const c in csvs) {
    debugapi(`Setting up /api/csv/${c} route`);
    csv.get(`/${c}`, async (req, res) => {
      debugapi(`Received /api/csv/${c}`);
      const urlObj = url.parse(req.url, true);
      const responder = new CSVResponder(res);
      try {

        res.setHeader('Content-Type', 'text/csv');

        await csvs[c](req.user, urlObj.query, responder);
        responder.end();
        
      } catch (e) {
        errored(req, res, e);
      }
    });
  }
  debug('Creating Web Server');
  server = http.createServer((req,res) => {
    if (typeof req.headers['x-forwarded-for'] === 'undefined') {
      req.headers['x-forwarded-for'] = '127.0.0.1';  //direct call from a local process so mark it such
    } else if (req.headers['x-forwarded-for'].includes(',')) {
      req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'].substring(0,req.headers['x-forwarded-for'].indexOf(','));
    }
    //standard values (although status code might get changed and other headers added);
    res.satusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    const done = finalhandler(req,res,{onerror: finalErr});
    router(req,res,done);
    
  });
  server.listen(serverConfig.serverPort, '0.0.0.0');
  serverDestroy(server);        
  logger(`Release ${version} of money Server Operational on Port:${serverConfig.serverPort} using node ${
    process.version}, Database Schema Version ${Number(process.env.MONEY_DB_VERSION)}`); 
  
} catch(e) {
  logger('error', 'Initialisation Failed with error ' + e.message + '\n' + e.stack);
  await close();
}

async function close() {
// My process has received a SIGINT signal
  if (server) {
    logger('app', 'Starting money Server ShutDown Sequence');
    let badExit = false;
    try {
      const tmp = server;
      server = null;
      //we might have to stop more stuff later, so leave as a possibility
      await new Promise((accept) => {
        tmp.destroy(accept);
      })
      if(mdb.isOpen) { 
        mdb.close(true); //only of we managed to open it
        await setTimeout(10)       
      }
      const {maxConnections, maxTagStoreSize} = manager('stats');
      logger('Money  API Server ShutDown Complete; Max Database Connections:', maxConnections, 'Max Cached Queries:', maxTagStoreSize);
    } catch (err) {
      logger('crash', 'Trying to close caused error', err);
      badExit = true;
    } finally {
      debugClose();
    }
    if (badExit) process.exit(1); else process.exit(0);
  }
}
process.on('SIGTERM', close)
