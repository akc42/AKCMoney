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
        hr.sep {
          width:100%;
          border-top: 1px -solid var(--menu-separator);
        }
        .listcontainer {
          display: flex;
          flex-direction: column;
          margin: 2px;
          max-height: 70vh;
          overflow-y:auto;
          overflow-x: hidden;          
          scroll-snap-type: y mandatory;
        }
        .listcontainer.reverse {
          flex-direction: column-reverse
        }
        @media (min-width: 500px) {
          .listcontainer.reverse {
            flex-direction: column;
          }
        }

        button[role="menuitem"] {
          --icon-size: 32px;
          min-height: 38px;
          display:flex;
          background-color: transparent;
          border: none;
          flex-direction:row;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
        }
        button[role="menuitem"]:hover {
          background-color: var(--menu-hover-color);
        }
        button[role="menuitem"]:focus {
          outline: none;
        }
        button[role="menuitem"]:active {
          box-shadow: none;
        }
        button[role="menuitem"] span:nth-of-type(1) {
          max-width: 70vw;
          text-align: left;
          flex:1
        }
        button[role="menuitem"] span:nth-of-type(2) {
          margin-left:auto;
        }
        button[role="menuitem"]>material-icon {
          margin-right: 4px;
        }
`;