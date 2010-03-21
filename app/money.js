/*
 	Copyright (c) 2009,2010 Alan Chandler
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


Amount = new Class({
    initialize:function(el) {
        var aString;
        this.el = el;
        if (el.get('tag') != 'input') {
            aString = el.get('text');
        } else {
            aString = el.value;
        } 
		this.value = new Number(aString);
        return true;
    },
    add:function(amount) {
        this.value += amount.getValue();
        this.setText(this.value);
    },
    subtract: function(amount) {
        this.value -= amount.getValue();
        this.setText(this.value);
    },
    getValue: function() {
        return this.value; 
    },
    setIfValid: function(aString) {
        var n = new Number(aString);
        if (isNaN(n)) return false;
        this.value = n.round(2);
        this.setText(this.value);
        return true;
    },
    setText: function(aValue) {
        if(this.el.get('tag') != 'input') {
            this.el.set('text',aValue.toFixed(2));
        } else {
            this.el.value = aValue.toFixed(2);
        }
    }.protect()
});

Transaction = new Class({
    Implements: Options,
    options: {
        template:null,
        account:null,
        marker:null,
        create:null
    },
    initialize: function(options) {
        this.setOptions(options);
        var that = this;
        this.xaction = this.options.template.clone();
        var dateInput=this.xaction.xdate;
        this.xaction.removeClass('hidden');
        var accountData = this.xaction.getElement('.accounttype');
        if(this.options.create) { //a create transaction
            this.xaction.getElement('.arow').set('id','t'+this.options.create.tid);
            this.xaction.version.value = this.options.create.version;
            dateInput.value=this.options.create.date;
            accountData.name = (this.account.options.isSrc)?'src':'dst';
            accountData.value = this.account.options.accountName;
            this.xaction.inject(this.options.marker,'before');
            Utils.adjustDates(this.xaction,'dateawait','dateconvert'); 
        } else {
            this.xaction.getFirst().destroy();  //Done need the new stuff because this is editing an existing entry
            var prev = this.options.marker.getPrevious();
            this.xaction.inject(prev,'after');
            this.options.marker.inject(this.xaction,'top');
        }
        var tid = this.xaction.tid; //transaction id
        tid.value = this.xaction.getElement('.arow').get('id').substr(1).toInt();
        var calendar = new Calendar.Single(dateInput,{onHideStart:function () {dateInput.fireEvent('change')}}); //save so can use later
        this.xaction.cleared.checked=this.xaction.getElement('.arow').getElement('.date').hasClass('cleared');
        this.xaction.amount.value=this.xaction.xamount.value;
        Utils.selectValueSet(this.xaction,'currency',this.xaction.xcurrency.value);
        Utils.selectValueSet(this.xaction,'repeat',this.xaction.xrepeat.value);
        this.xaction.rno.value=this.xaction.getElement('.arow').getElement('.ref').get('text');
        this.xaction.description.value=this.xaction.getElement('.arow').getElement('.description').get('text');
      
//ensure multiple updates queue and we need to deal with version changes (meaning parallel update elsewhere)
        this.xaction.set('send',{link:'chain',onComplete:function(response) {
            if(response) {
                switch (response.status) {
                case 'deleted': // Someone deleted the transaction from under us
                    alert("Someone else deleted this transaction whilst we were working on it, it has been removed");
                    that.removeTransaction();
                    break;
                case 'updated': //Someone changed the values of this transaction whilst we were working on it - so we need to update ourselves
// Check that transaction is still in this account
                    if (that.options.account.accountName != response.xactiondata.src && that.options.account.accountName != response.xactiondata.dst) {
                        alert("Someone updated this transaction whilst we were working on it, and it is not longer in this account.  It will be removed");
                        that.removeTransaction();
                        break;
                    }
//If the accounts were switched over by the other party, then we need to adjust ourselves to take it onto account
                    if(accountData.name == 'src') {
                        if(accountData.value != response.xactiondata.src) {
                            that.switchAccount();
                        }
                    } else {
                        if(accountData.value != response.xactiondata.dst) {
                            that.switchAccount();
                        }
                    }
                    alert("Someone updated this transaction whilst we were working on it, new values have been set");
                    //fall through
                case 'completed': // We updated the transaction OK
    //TODO update from received data (response.xaction)
                    that.xaction.getElement('.version').value = response.xactiondata.version;
                    dateInput.value = response.xactiondate.date;
                    calendar.resetVal(); //Ensure the related parts get updated too
                    if(accountData.name == 'src') {
                        that.xaction.cleared=response.xactiondata.srcclear;
                        that.xaction.aamount.value=response.xactiondata.srcamount;
                    } else {
                        that.xaction.cleared=response.xactiondata.dstclear;
                        that.xaction.aamount.value=response.xactiondata.dstamount;
                    }
                    that.xaction.getElement('.arow').getElement('.aamount').set('text',that.xaction.aamount.value);
                    that.xaction.xamount.value=response.xactiondata.amount;
                    that.xaction.xcurrency.value=response.xactiondata.currency;
                    Utils.selectValueSet(that.xaction,'currency',that.xaction.xcurrency.value);
                    that.xaction.xrepeat.value=response.xactiondata.repeat;
                    Utils.selectValueSet(that.xaction,'repeat',that.xaction.xrepeat.value);
                    that.xaction.getElement('.arow').getElement('.ref').set('text',response.xactiondata.rno);
                    that.xaction.rno.value=response.xactiondata.rno;
                    that.xaction.getElement('.arow').getElement('.description').set('text',response.xactiondata.description);
                    that.xaction.description.value=response.xactiondata.description;
                    break;
                
                default:
                }
            }
        }}); 
//TODO: Add events for field changes
//TODO: Add events for buttons 
        var xpos = this.xaction.getCoordinates();
        window.scrollTo(0,xpos.top - 100);
    },
    removeXaction: function() {
        this.xaction.dispose();//remove from account
        this.xaction = this.xaction.destroy();// now lose the actual element
    },
    switchAccounts: function () {
        var accountData = this.xaction.getElement('.accounttype');
        var sellabel = this.xaction.getElement('.sellabel');
        if(accountData.name == 'src') {
            accountData.name = 'dst';
            sellabel.set('text','Src :');
//TODO Switch the Amounts over (srcamount, dstamount) when we have positioned them on the form
        } else {
            accountData.name == 'src';
            sellabel.set('text','Dst :');
        }
    }
        
        
});


Account = new Class({
    Implements:Options,
    options: {
        accountName:'',
        isSrc:true,
        clearbalance:null,
        maxmax:null,
        openbalance:null,
        bversion:null,
        currency: 'GBP',
        rate:1.0,
        newxat:null,
        xtemplate:null,
        rebal:null,
        nowMarker:null
    },
    initialize: function(options) {
        this.setOptions(options);
        var that = this;
//Deal with new transaction button
        var createXaction = new Request.JSON({
            url:'newxaction.php',
            link:'chain',
            onComplete: function(response) {
                if (response) {
//Its to handled by transaction
                    var thisxaction = new Transaction({
                        template:that.options.xtemplate,
                        account:that,
                        marker:that.options.nowMarker,
                        create: {
                            tid:response.tid,
                            date:response.date,
                            version:response.version
                        }
                    });
                    that.options.newxat.addEvent('click', newEvent); //Transaction is formed - if we want we can create another whilst still editing this
                }
            }
        });
        var newEvent = function(e) {
            e.stop();
            this.removeEvent('click',newEvent); // Can't do it again until the transaction has been formed
            createXaction.post({'key':Utils.sessionKey,'account':that.options.accountName,'issrc':that.options.isSrc});
        };
        this.options.newxat.addEvent('click', newEvent);
//"Rebalance from Cleared" button
        this.options.rebal.addEvent('click', function(e) {
            e.stop();
            if(confirm("Are you sure you wish to Rebalance?  It will delete all cleared transactions")) {
//TODO A rebalance
            }
        });
        
// This is the function for the clear transaction on date
        this.toggleClear = new Request.JSON({
            url:'toggleclear.php',
            link:'chain',
            onComplete:function(response) {
                if (response) {
                    if(!response.newversion) {
                        var xaction = $('t'+response.tid);
                        xaction.getElement('.version').value = response.version;
                        var xactdate = xaction.getElement('.date');
                        var xactamt = new Amount(xaction.getElement('.amount'));
                        xactdate.removeClass('cleared'); //remove it if its there
                        if (response.clear) {
                            xactdate.removeClass('passed');
                            xactdate.addClass('cleared');
                            that.options.clearbalance.add(xactamt);
                        } else {
                            var d = new Date();
                            if((xactdate.getElement('input').value*1000) < d.getTime()) xactdate.addClass('passed');
                            that.options.clearbalance.subtract(xactamt);
                        }
                    } else {
                        that.refresh();
                    }
                }    
            }
        });



// Now loop round all transactions and add events to them

        var transactionList = $('transactions').getElements('.xaction');
        transactionList.each(function(xaction) {
            var tid = xaction.get('id').substr(1).toInt();
            var dateEl = xaction.getElement('.date');
            if (!dateEl.hasClass('repeat')) { //we can't clear repeating transactions
                xaction.getElement('.date').addEvent('click', function(e) {
                    e.stop();
                    that.toggleClear.post({
                        'key':Utils.sessionKey,
                        'tid':tid,
                        'clear':(!this.hasClass('cleared')), //if it has the class then we are NOT clearing it
                        'issrc':(xaction.getElement('.accounttype').name == 'src'),
                        'version': xaction.getElement('.version').value
                    });
                });
            }
            xaction.getElement('.description').addEvent('click', function(e) {
                e.stop();
                new Transaction ({
                    template:that.options.xtemplate,
                    account:that,
                    marker:this.getParent()              
                });
            });
            var el=xaction.getElement('.amount'); //this should get the first one
            if(el.hasClass('clickable')) { //but only do it if this is not a foreign currency (to the account)
                el.addEvent('click',function(e) {
                    e.stop();
//TODO
                });
            }
        });                
    },
    refresh: function() {
        //if we get this, it means that someone else updated our transaction and we need to reset the data
        alert('Someone else updated this transaction whilst you have been viewing it. ' +
            'We are going to refresh this page to ensure you have the most up to date version.');
        window.location = 'index.php?account='+this.options.accountName;
    }.protect()
});

