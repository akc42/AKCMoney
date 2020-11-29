
/**
@licence
    Copyright (c) 2020 Alan Chandler, all rights reserved

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


import { css } from '../libs/lit-element.js';

export default css`

     [role="alert"] {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        color: var(--error-color);

      }
      [role="alert"] material-icon {
        --icon-size: 10pt;
        margin: 0 10px;
      }
`;