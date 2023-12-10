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
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath } from 'node:url';
import Debug from 'debug';
import dbStartup from '@akc42/sqlite-db';
import chalk from 'chalk';
import {logger,Responder} from '@akc42/server-utils'; 
import bodyParser  from 'body-parser';
import  Router from 'router';
import jwt  from 'jwt-simple';
import http from 'node:http';
import PDFDocument from 'pdfkit';
import { v4 }  from 'uuid';
import serverDestroy from 'server-destroy';
import finalhandler from 'finalhandler';
import bcrypt from 'bcrypt';


import dotenv from 'dotenv';

const filePath = fileURLToPath(new URL('../money.env', import.meta.url))

dotenv.config({ path: filePath});

const debug = Debug('money:server');
const debugapi = Debug('money:api');
const debuguser = Debug('money:user');
const debugauth = Debug('money:auth');

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
      await logger('error', `Failed to load ${file} with error ${err}`);
    }
  }
  debugapi('load server reply', reply);
  return reply;
};

async function forbidden(req,res, message) {
  debug('In "forbidden"');
  await logger(req.headers['x-forwarded-for'],'auth', message, 'with request url of',req.originalUrl);
  res.statusCode = 403;
  res.end('---403---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail

}
async function errored(req,res,error) {
  debug('In "Errored"');
  const message = `Error${error.message ? ': ' + error.message: '' } ${error.stack? ': ' + error.stack: ''}`;
  await logger(req.headers['x-forwarded-for'] ,'error', message,'\nwith request url of ',req.originalUrl);
  res.statusCode = 500;
  res.end('---500---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail.

}

async function finalErr (err,req) {
  await logger('error', `Final Error at url ${req.originalUrl} with error ${err.stack || err.toString()}`);
}




try {


  const pjsonfile = fileURLToPath(new URL('../package.json', import.meta.url))
  const { mtime } = await fs.stat(pjsonfile); 
  const pcontents = await fs.readFile(pjsonfile)
  const pjson = JSON.parse(pcontents);
  const version = 'v'+ pjson.version;
  const year = new Date(mtime).getUTCFullYear();
  
  
  
  const db = dbStartup(fileURLToPath(new URL(process.env.DATABASE_DB ,import.meta.url)),fileURLToPath(new URL(process.env.DATABASE_INIT_FILE, import.meta.url)));
  let server;
  
  const serverConfig = {};
  /*
    start off a process to ensure the database is in the latest format

    Step 1: see if we have a settings table or not
  */
  const dbSettingsTable = db.prepare(`SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'settings'`).pluck().get();
  if (dbSettingsTable === 0) {
    debug('update version to have settings table');
    //we don't yet have a settings table
    const update = fs.readFileSync(path.resolve(__dirname, 'db-init', `update_to_settings.sql`), { encoding: 'utf8' });
    db.exec(update);        
  }
  //try and open the database, so that we can see if it is up to date
  const dversion = db.prepare(`SELECT value FROM settings WHERE name = 'version'`).pluck();
  const dbVersion = dversion.get();

  const moneyVersion = parseInt(process.env.DATABASE_DB_VERSION,10);
  debug('database is at version ', dbVersion, ' we require ', moneyVersion);
  if (dbVersion !== moneyVersion) {
    if (dbVersion > moneyVersion) throw new Error('Setting Version in Database too high');
    db.pragma('foreign_keys = OFF');
    const upgradeVersions = db.transaction(() => {
      
      for (let version = dbVersion; version < moneyVersion; version++) {
        if (fs.existsSync(path.resolve(__dirname, 'db-init', `pre-upgrade_${version}.sql`))) {
          //if there is a site specific update we need to do before running upgrade do it
          const update = fs.readFileSync(path.resolve(__dirname, 'db-init', `pre-upgrade_${version}.sql`), { encoding: 'utf8' });
          db.exec(update);
        }
        const update = fs.readFileSync(path.resolve(__dirname, 'db-init', `upgrade_${version}.sql`),{ encoding: 'utf8' });
        db.exec(update);
        if (fs.existsSync(path.resolve(__dirname, 'db-init', `post-upgrade_${version}.sql`))) {
          //if there is a site specific update we need to do after running upgrade do it
          const update = fs.readFileSync(path.resolve(__dirname, 'db-init', `post-upgrade_${version}.sql`), { encoding: 'utf8' });
          db.exec(update);
        }
      }
    });
    upgradeVersions.exclusive();
    db.exec('VACUUM');
    db.pragma('foreign_keys = ON');
    debug('Committed Updates, ready to go')
  }
  let amnestyDate;
  if (process.env.MONEY_TRACKING !== 'no' ) {
    const logcount = db.prepare('SELECT COUNT(*) FROM Login_Log').pluck().get();
    if (logcount === 0) {
      debug('log count was zero')
      //first run 
      const setMarker = db.prepare(`INSERT INTO Login_Log (track_uid, isSuccess) VALUES ('New Server',1)`)
      setMarker.run();
      //What we have done is give given user.js functions 24 hours to get their house in order before missing tokens from an
      //ip address we've seen before.  Essentially an amnesty on not having a tracking token on a previously seen ip.
      amnestyDate = new Date();
      amnestyDate.setDate(amnestyDate.getDate() + 1);
    } else {
      debug('log count was', logcount)
      const firstTime =db.prepare('SELECT Time FROM Login_log WHERE Lid = 1').pluck().get()
      amnestyDate = new Date(firstTime * 1000);
    }
    amnestyDate.setDate(amnestyDate.getDate() + 1);
    debug('amnesty date', amnestyDate);
  }




  /*
    Get the few important settings that we need in our server, but also take the opportunity to get back what we need for
    our config route
  */
  const clientConfig= {};
  const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
  const dc = db.prepare('SELECT name, description FROM currency WHERE priority = 0');
  db.transaction(() => {
    if (process.env.MONEY_TRACKING !== 'no') serverConfig.trackCookie = s.get('track_cookie');
    serverConfig.authCookie = s.get('auth_cookie');
    serverConfig.tokenKey = `AKCMoney${s.get('token_key').toString()}`;
    serverConfig.serverPort = s.get('server_port');
    serverConfig.tokenExpires = s.get('token_expires');
    clientConfig.authCookie = serverConfig.authCookie;
    const {name, description} = dc.get();
    clientConfig.defaultCurrency = name;
    clientConfig.defaultCurrencyDescription = description;
  })();

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
    db.transaction(() => {
      clientConfig.clientLog = s.get('client_log');
      clientConfig.clientUid = s.get('client_uid');
      clientConfig.minPassLength = s.get('min_pass_len');
      clientConfig.dwellTime = s.get('dwell_time');
      clientConfig.webmaster = s.get('webmaster');
      clientConfig.repeatDays = s.get('repeat_days');
      clientConfig.yearEnd = s.get('year_end');
      clientConfig.nullAccount = s.get('null_account');
      clientConfig.nullCode = s.get('null_code');
      clientConfig.debug = s.get('debug_config') ?? '';
    })();
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
          const checkip = db.prepare('SELECT COUNT(*) FROM Login_log WHERE ipAddress = ? OR track_ip = ?').pluck();
          const count = checkip.get(ip,ip);
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
    const user = db.prepare('SELECT * FROM user WHERE name = ?').get(req.body.username);
    let success = false;        
    if (user) {
      debugauth('We found a user');
      success = true;
      if (user.password) {
        debugauth('Check Password');
        success = await bcrypt.compare(req.body.pwd, user.password);
      }
    }
    if (process.env.MONEY_TRACKING !== 'no') {
      debugauth('login was ', success, 'Write log entry');
      const loginEntry = db.prepare(`INSERT INTO login_log (ipaddress,track_uid,track_ip,username,isSuccess) VALUES (?,?,?,?,?)`);
      if (process.env.MONEY_TRACKING !== 'no') {
        loginEntry.run(req.headers['x-forwarded-for'], req.track.uid, req.track.ip, req.body.name, success ? 1 : 0);
      }
    }
    if (success) {
      user.password = !!user.password; //turn password into a boolean as to whether it exists;
      user.remember = req.body.remember !== undefined && user.password;
      res.setHeader('Set-Cookie', generateCookie(user, serverConfig.authCookie, user.remember ? serverConfig.tokenExpires:false)); //refresh cookie to the new value 
      res.end(JSON.stringify(user));
    } else {
      res.end(JSON.stringify({}));
    }
    debugauth('login all done');
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
        await logger(req.headers['x-real-ip'], 'log', 'User', req.body.name,'Session Expired');
        res.setHeader('Set-Cookie', 'PASv5=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        responder.addSection('status', 'Expired');
      }
    } else {
      await logger(req.headers['x-real-ip'], 'log', 'User', req.body.name,'Session Token Missing');
      responder.addSection('status', 'Off');
    }
    responder.end();
  });
  /*
    Anything past here user MUST be validated
  */
  debug('Setting up to Check Auth Cookie');
  api.use((req, res, next) => {
    debugauth('Check Auth Cookie');
    const cookies = req.headers.cookie;
    const authTester = new RegExp(`^(.*; +)?${serverConfig.authCookie}=([^;]+)(.*)?$`);
    const matches = cookies.match(authTester);
    if (matches) {
      debugauth('Cookie found');
      const token = matches[2];
      try {
        const payload = jwt.decode(token, serverConfig.tokenKey);  //this will throw if the cookie is expired
        req.user = payload;
        res.setHeader('Set-Cookie', generateCookie(payload, serverConfig.authCookie, payload.remember ? serverConfig.tokenExpires: false)); //refresh cookie to the new value 
        debugauth('Cookie Check Complete')
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
          debugauth('invalid auth cookie');
          forbidden(req, res, 'Invalid Auth Token: Error: ' + error.toString());
        }
      }
    } else {
      debugauth('no cookie matching auth type');
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
        debugapi('error in pdf',e);
        if (doc !== undefined) {
          doc.fillColor('red').fontSize(14).font('Helvetica-Bold');
          doc.text('SERVER ERROR - CANNOT COMPLETE PDF', {width: 172, align: 'center'});
        }
      }
      if (doc !== undefined) doc.end();
    });
  }
  const csvs = await loadServers('csv');
  for (const c in csvs) {
    debugapi(`Setting up /api/csv/${c} route`);s
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
    //standard values (although status code might get changed and other headers added);
    res.satusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    const done = finalhandler(req,res,{onerror: finalErr});
    router(req,res,done);
    
  });
  server.listen(serverConfig.serverPort, '0.0.0.0');
  serverDestroy(server);        

  await logger('app', `Release ${version} of money Server Operational on Port:${serverConfig.serverPort} using node ${process.version}`); 
  if (process.send) process.send('ready'); //if started by (e.g.) PM2 then tell it you are ready

    

} catch(e) {
  logger('error', 'Initialisation Failed with error ' + e.message + '\n' + e.stack);
  close();
}
  
  

function close() {
// My process has received a SIGINT signal

    if (server) {
      logger('app', 'Starting money Server ShutDown Sequence');
      try {
        const tmp = server;
        server = null;
        //we might have to stop more stuff later, so leave as a possibility
        tmp.destroy(() => {
          logger('app', 'money  Server ShutDown Complete');
          db.close();
          if (!module.parent) {
            debug('process exit');
            process.exit(0);  //only exit if we were the starting script. It will close database automatically.
          }
          debug('test server closed');
        });
        
      } catch (err) {
        logger('error', `Trying to close caused error:${err}`);
      }
    } else {
      accept(true);
    }


  
}

  
