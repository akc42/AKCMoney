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
        }
    },
    initialize: function(options) {
        var accountList
        this.setOptions(options);
//Clone the account list and adjust for use as secondary account selection when editing a transaction
        if (this.options.elements.accounts) {
            var accountList = this.options.elements.accounts.clone();
            accountList.name = (this.options.isSrc)?'dst':'src';  //name is dependent on account type
            var currentSelected = accountList.getElement('option[selected]');
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
            link:'chain',
            onComplete: function(response) {
                if (response) {
                    var nowRow = $('now');
                    var thisxaction = this.options.elements.xaction.clone();
                    thisxaction.removeClass('hidden');
                    thisxaction.inject(nowRow,'before');
                    thisxaction.set('send',{link:'chain'}); //ensure multiple updates queue
                    var tid = thisxaction.getElement('input[name=tid]'); //transaction id
                    tid.value=response.tid;
                    var el = thisxaction.getElement('input[name=date]'); //date (almost now but not quite
                    el.value = response.date;
                    thisxaction.store('calendar',new Calendar.Single(el,{onHideStart:function () {el.fireEvent('change')}})); //save so can destroy later
                    var ver = thisxaction.getElement('input[name=version]');
                    ver.value = response.version;
                    var simpleEvents = [el,thisxaction.getElement('input[name=rno]'),thisxaction.getElement('input[name=desc]'),thisxaction.getElement('select[name=repeat]')];
                    simpleEvents.addEvent('change', function(e) {
                        thisxaction.send();
                    });
//TODO: Complex events
//TODO: Add events for buttons 
                    var xpos = thisxaction.getCoordinates();
                    window.scrollTo(0,xpos.top - 100);
                    $('new').addEvent('click',this.newEvent);
                }
            }.bind(this)
        });
        var newButton = $('new')
        this.newEvent = function(e) {
            e.stop();
            newButton.removeEvent('click',this.newEvent); // Can't do it again until this transaction is either closed or deleted
            this.createXaction.post({'account':this.options.name,'issrc':this.options.isSrc});
                       
        }.bind(this);
        newButton.addEvent('click', this.newEvent);
//"Rebalance from Cleared" button
                
        this.updateXaction = new Request.JSON({
            url:'updatexaction.php',
            link:'chain',
            onComplete: function(response) {
            }
        });
    },
    processXaction: function (id, ver, injectbefore) {
    }
});

