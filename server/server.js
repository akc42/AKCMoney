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

(function() {
  'use strict';
  const debug = require('debug')('money:server');
  const debugapi = require('debug')('money:api');
  const debuguser = require('debug')('money:user');
  const debugauth = require('debug')('money:auth');

  const path = require('path');
  require('dotenv').config({path: path.resolve(__dirname,'../','money.env')});
  const db = require('@akc42/sqlite-db'); //this has to come after environment is set up

  const {logger, Responder, version:versionPromise} = require('@akc42/server-utils'); //this has to come after environment is set up
  const CSVResponder = require('./csvresponder');

  const fs = require('fs');
  const url = require('url');
  const requireAll = require('require-all');
  const bodyParser = require('body-parser');
  const Router = require('router');
  const jwt = require('jwt-simple');
  const http = require('http');
  const { v4: uuidV4 } = require('uuid');
  const chalk = require('chalk');
  const PDFDocument = require('pdfkit');

  const serverDestroy = require('server-destroy');
  const finalhandler = require('finalhandler');

  const bcrypt = require('bcrypt');


  const serverConfig = {};
  
  let server;

  function loadServers(rootdir, relPath) {
    return requireAll({
      dirname: path.resolve(rootdir, relPath),
      filter: /(.+)\.js$/
    }) || {};
  }
  function forbidden(req,res, message) {
    debug('In "forbidden"');
    logger(req.headers['x-forwarded-for'],'auth', message, 'with request url of',req.originalUrl);
    res.statusCode = 403;
    res.end('---403---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail

  }
  function errored(req,res,error) {
    debug('In "Errored"');
    const message = `Error${error.message ? ': ' + error.message: '' } ${error.stack? ': ' + error.stack: ''}`;
    logger(req.headers['x-forwarded-for'] ,'error', message,'\nwith request url of ',req.originalUrl);
    res.statusCode = 500;
    res.end('---500---'); //definitely not json, so should cause api to throw even if attempt to send status code is to no avail.

  }

  function finalErr (err,req) {
    logger('error', `Final Error at url ${req.originalUrl} with error ${err.stack || err.toString()}`);
  }

  function generateCookie(payload, key, expires) {
    const date = new Date();
    
    if (expires) {
      date.setTime(date.getTime() + (expires * 60 * 60 * 1000));
      payload.exp = Math.round(date.getTime() / 1000);
    }
    debugauth('generated cookie', key, ' expires ', expires ? date.toGMTString() : 0);
    return `${key}=${jwt.encode(payload, serverConfig.tokenKey)}; expires=${expires ? date.toGMTString() : 0}; Path=/`;
  }


  function startUp () {
    try {
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
      //try and open the database, so that we can see if it us upto date
      const version = db.prepare(`SELECT value FROM settings WHERE name = 'version'`).pluck();
      const dbVersion = version.get();

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
      /*
        Get the few important settings that we need in our server, but also take the opportunity to get back what we need for
        our config route
      */
      const clientConfig= {};
      const s = db.prepare('SELECT value FROM settings WHERE name = ?').pluck();
      const dc = db.prepare('SELECT name, description FROM currency WHERE priority = 0');
      db.transaction(() => {
        serverConfig.trackCookie = s.get('track_cookie');
        serverConfig.authCookie = s.get('auth_cookie');
        serverConfig.tokenKey = `AKCMoney${s.get('token_key').toString()}`;
        serverConfig.serverPort = s.get('server_port');
        serverConfig.tokenExpires = s.get('token_expires');
        clientConfig.authCookie = serverConfig.authCookie;
        const {name, description} = dc.get();
        clientConfig.defaultCurrency = name;
        clientConfig.defaultCurrencyDescription = description;
      })();

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
        versionPromise.then(info => {
          //we might have already done this but it doesn't matter
          clientConfig.version = info.version; 
          clientConfig.copyrightYear = info.year;
          res.end(JSON.stringify(clientConfig));
          debugapi('returned version', info.version,'and year', info.year);
        });
      })
      /*
        the next is a special route used to identify users to keep track of failed password attempts
      */
      debug('setting up user.js response')
      api.get('/user.js', (req,res) => {
        debuguser('got /api/user.js request')
        const token = req.headers['if-none-match'];
        const modify = req.headers['if-modified-since'];
        const ip = req.headers['x-forwarded-for'];  //note this is ip Address Now, it might be different later. Is a useful indication for misuse.
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
        if (token !== undefined && token.length > 0) {
          //we have previously set this up as an e-tag and now the browser is asking us whether it has changed
          debuguser('tracking token found as ', token);
          try {
            if (process.env.MONEY_TRACKING === 'yes') {
              //we want to decode this to check it hasn't been tampered wth
              const payload = jwt.decode(token, serverConfig.tokenKey);
              debuguser('Decoded tracking token as payload', payload);
            }
            res.statusCode = 304;
          } catch(e) {
            // someone has been messing with things so we make a new one, but mark it as corrupt, so when its used we know
            makeResponse(res, 'Corrupt');
          }
        } else if (modify !== undefined && modify.length > 0) {
          debuguser('tracking modify has a date so 304 it');
          res.StatusCode = 304;
        } else {
          //not set this up before, so lets create a uid and set it up
          makeResponse(res, uuidV4()); //unique id from uuid.v4
        }
        res.end();
        debuguser('/api/user.js response complete');
      });

      if (process.env.MONEY_TRACKING === 'yes') {
        /*
            From this point on, all calls expect the user to have a trackCookie cookie.
        */
        debug('Setting up to Check Cookies from further in');
        api.use((req, res, next) => {
          debuguser('checking tracking cookie');
          const cookies = req.headers.cookie;
          if (!cookies) {
            debuguser('did not find any cookies')
            forbidden(req, res, 'No Cookie');
            return;
          }
          const userTester = new RegExp(`^(.*; +)?${serverConfig.trackCookie}=([^;]+)(.*)?$`);
          const matches = cookies.match(userTester);
          if (matches) {
            debuguser('Cookie found')
            const token = matches[2];
            try {
              const payload = jwt.decode(token, serverConfig.tokenKey);  //this will throw if the token is corrupt
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
        });
      }
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
        debugauth('login was ', success, 'Write log entry');
        const loginEntry = db.prepare(`INSERT INTO login_log (ipaddress,track_uid,track_ip,username,isSuccess) VALUES (?,?,?,?,?)`);
        if (process.env.MONEY_TRACKING === 'yes') {
            loginEntry.run(req.headers['x-forwarded-for'], req.track.uid, req.track.ip, req.body.name, success ? 1 : 0);
        } else {
          loginEntry.run(req.headers['x-forwarded-for'], null, null, req.body.name, success ? 1 : 0);
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

      const apis = loadServers(__dirname, 'api');
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
      const pdfs = loadServers(__dirname, 'pdf');
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
      const csvs = loadServers(__dirname, 'csv');
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
      versionPromise.then(info => {
        logger('app', `Release ${info.version} of money Server Operational on Port:${serverConfig.serverPort} using node ${process.version}`); 
        if (process.send) process.send('ready'); //if started by (e.g.) PM2 then tell it you are ready
      });
        

    } catch(e) {
      logger('error', 'Initialisation Failed with error ' + e.message + '\n' + e.stack);
      close();
    }
      
    
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

  if (!module.parent) {
    try {
      //running as a script, so call startUp
      debug('Startup as main script');
      startUp();
      process.on('SIGINT', close);
    } catch(err) {
      close();
    }    
  }
  module.exports = {
    startUp: startUp,
    close: close
  };
})();
