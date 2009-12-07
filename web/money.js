/*
 	Copyright (c) 2009 Alan Chandler
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
    along with AKCMoney (file COPYING.txt).  If not, see <http://www.gnu.org/licenses/>.

*/
Account = new Class({
    Implements:Options,
    options: {
        name:'',
        balances: {
            opening:0,
            cleared:0,
            max:0,
            min:0
        },
        currency: {
            name:'GBP',
            rate:1.0
        },
    },
    Initialize: function(options) {
        this.setOptions();
    },
    formatAmount:function(amount) {
        var dollar = Math.floor(amount/100);
        var cent = amount%100;
        if (cent < 10) cent = '0'+cent;
        return dollar+'.'+cent;
    },
    getMinBalance: function() {
        return this.formatAmount(this.options.balances.min);
    },
    getMaxBalance: function() {
        return this.formatAmount(this.options.balances.max);
    },
    getOpeningBalance: function() {
        return this.formatAmount(this.options.balances.opening);
    },
    getClearedBalance: function() {
        return this.formatAmount(this.options.balances.cleared);
    }
});

Money = new Class({
    Implements:Options,
    options: {
        account:null,
        accountList:null,
        currencyList:null
    },
    Initialize: function(options) {
        this.setOptions();
    }
});

