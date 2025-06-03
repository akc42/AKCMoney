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
    'node_modules/@akc42/app-utils/config.js',
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
  dir: 'client/libs',
  format: 'esm',
  sourcemap: true
};
//rollup libraries client needs
const bundle = await rollup(inputOptions);
await bundle.write(outputOptions);
