#!/usr/bin/env node
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

import {rollup} from 'rollup';
import {nodeResolve}  from '@rollup/plugin-node-resolve';




const inputOptions = {
  input: [
    'node_modules/lit-element/lit-element.js',
    'node_modules/lit/html.js',
    'node_modules/lit/async-directive.js',
    'node_modules/lit/directive.js',
    'node_modules/lit/directives/if-defined.js',
    'node_modules/lit/directives/cache.js',
    'node_modules/lit/directives/class-map.js',
    'node_modules/lit/directives/guard.js',
    'node_modules/lit/directives/live.js',
    'node_modules/lit/directives/repeat.js',
    'node_modules/lit/directives/style-map.js',
    'node_modules/lit/directives/template-content.js',
    'node_modules/lit/directives/unsafe-html.js',
    'node_modules/lit/directives/until.js',
    'node_modules/@akc42/app-utils/route.js',
    'node_modules/@akc42/app-utils/location.js',
    'node_modules/@akc42/app-utils/app-keys.js',
    'node_modules/@akc42/app-utils/csv.js',
    'node_modules/@akc42/app-utils/debug.js',
    'node_modules/@akc42/app-utils/dom-host.js',
    'node_modules/@akc42/app-utils/post-api.js',
    'node_modules/@akc42/app-utils/submit-function.js',
    'node_modules/@akc42/app-utils/switch-path.js'
  ],
  plugins: [nodeResolve()]
};
const outputOptions = {
  dir: 'libs',
  format: 'esm',
  sourcemap: true
};
//rollup libraries client needs
const bundle = await rollup(inputOptions);
await bundle.write(outputOptions);
