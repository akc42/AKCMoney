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
        isSrc: true,
        cleared:0,
        maxmax:0,
        currency: {
            account:'GBP',
            def:'GBP',
            rate:1.0
        },
        elements:{
            xaction:null,
            accounts: null,
            currencies :null,
            repeat: null
        }
    },
    initialize: function(options) {
        var accountList
        this.setOptions(options);
//Clone the account list and adjust for use as secondary account selection when editing a transaction
        if (this.options.elements.accounts) {
            var accountList = this.options.elements.accounts.clone();
            var currentSelected = accountList.getElement('option[selected]');
            currentSelected.destroy();
            var blankOption = new Element('option');
            blankOption.inject(accountList,'top');
// Insert this new list into the new transaction section
            if (this.options.elements.xaction) {
                var listPoint = this.options.elements.xaction.getElement('.accountsel')
                accountList.inject(listPoint);
            }
            this.options.elements.accounts = accountList;   
        }
// Need to add events to the key dynamic parts

// Firstly the account list
        $('account').addEvent('change', function() {
            //submit the form
            $('accountsel').submit();
        });

    },
    
});

