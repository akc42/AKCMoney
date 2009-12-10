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
            this.account=currentSelected.get('text');
            currentSelected.destroy();
            var blankOption = new Element('option');
            blankOption.set('selected','selected');
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
        $('account').addEvent('change', function(e) {
            e.stop();
            //submit the form
            $('accountsel').submit();
        });
// Now the "New Transaction" button
// First lets make the request that creates the transactions
        this.createXaction = new Request.JSON({
            url:'newxaction.php',
            link:'cancel',
            onComplete: function(response) {
                if (response) {
                    var nowRow = $('now');
                    var rows = this.options.elements.xaction.getElements('tr');
                    var newRows = [];
                    rows.each(function(row,i) {
                        newRows[i] = row.clone();
                        newRows[i].inject(nowRow,'before');
                    });
                    row[0].set('id','t'+response.tid);
                    var el = newRows[0].getElement('input[name=date]');
                    el.value = response.date;
                    this.calendar = new Calendar.Single(el,{onHideStart:function () {el.fireEvent('change')}});
                    var inputs = row[0].getElements('input');
                    inputs.extend(row[1].getElements('input');
//TODO: what about selects?
                    var myAccount = this;
                    inputs.addEvent('change', function(e) {
                        myAccount.updateXaction.post({'account':myAccount.account, 'tid': response.tid, 'field':this.get('name'), 'value':this.value});
                    });
//TODO: Add events for buttons 
                    nowRow.scrollTo(0,100);
                }
            }.bind(this);
        });        
        var newButton = $('new')
        var newEvent = function(e) {
            e.stop();
            newButton.removeEvent('click',newEvent); // Can't do it again until this transaction is either closed or deleted
            $('tid').value = 0; //indicate this will be a new transaction which has not yet been created
            this.createXaction.post({'account':this.account});
                       
        }.bind(this);
        newButton.addEvent('click', newEvent);
        this.updateXaction = new Request.JSON({
            url:'updatexaction.php',
            link:'chain',
            onComplete: function(response) {
            }
        });
    },
    
});

