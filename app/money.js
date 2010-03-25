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
    Implements: [Class.Occlude],
    property: 'amount',
    initialize: function(element){ 
        var aString;
        if(element) {
            this.element = $(element);
            if (this.occlude()) return this.occluded;
            if (this.element.get('tag') != 'input') {
                aString = this.element.get('text');
            } else {
                aString = this.element.value;
            }
        } else {
            aString = "0.00";
        } 
		this.value = new Number(aString);
    },
    add:function(amount) {
        this.value += amount.getValue();
        this.setText();
    },
    subtract: function(amount) {
        this.value -= amount.getValue();
        this.setText();
    },
    getValue: function() {
        return this.value; 
    },
    setValue: function(amount) {
        this.value = amount.getValue();
        this.setText();
    },
    setIfValid: function(aString) {
        if(/^\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/.test(aString)) {
//1[##][,###]+[.##]
//1###+[.##]
//0.##
//.##
            var n = new Number(aString);
            if (isNaN(n)) return false;
            this.value = n.round(2);
            this.setText(this.value);
            return true;
        } else {
            return false;
        }
    },
    setText: function() {
        if (this.element) {
            if(this.element.get('tag') != 'input') {
                this.element.set('text',this.value.toFixed(2));
            } else {
                this.element.value = this.value.toFixed(2);
            }
        }
    }.protect()
});

Transaction = new Class({
    Implements: [Class.Occlude],
    property: 'transaction',
    initialize: function(element, account){
        this.element = $(element);
        if (this.occlude()) return this.occluded;
        this.account = account;
        this.amount = new Amount(this.element.getElement('.aamount'));
        this.cumulative = new Amount (this.element.getElement('.cumulative'));
        
        if(this.element.get('tag') == 'form') {
/*  if we are creating a NEW transaction here, with the form tag, then it really is a
    brand new transaction, and has not even been created on disk yet. This is indicated by
    this.tid = 0.  This first update event will have to create the transaction and load up the tid, whereas
    subsequent transactions will update the database but will then need to check the version is correct when the transaction
    comes back.  But we will not try to even create the transaction, or update it until it is really essential something changes */
            this.tid=0;
            this.cleared = false;
            this.manageForm();

//TODO prepare for the input element - we need lots of events adding
        } else {
//TODO this transaction is just the simple kind, where we can edit in place
            this.tid = this.element.get('id').substr(1).toInt();
            var dateEl = this.element.getElement('.date');
            this.cleared = dateEl.hasClass('cleared');
            if( !dateEl.hasClass('repeat')) { //we can't clear repeating transactions
                dateEl.addEvent('click', function(e) {
                    e.stop();
                    this.account.request.callRequest(
                        'toggleclear.php',
                        {
                            'key':Utils.sessionKey,
                            'tid':this.tid,
                            'version': this.element.getElement('input[name=version]').value,
                            'issrc':this.account.isSrc,
                            'clear':(!dateEl.hasClass('cleared')) //if it has the class then we are NOT clearing it
                        },
                        this,
                        function(response) {
                            if(!response.newversion && response.tid == this.tid) {
                                this.element.getElement('input[name=version]').value = response.version;
                                var xactdate = this.element.getElement('.date');
                                var xactamt = new Amount(this.element.getElement('.amount'));
                                xactdate.removeClass('cleared'); //remove it if its there
                                if (response.clear) {
                                    xactdate.removeClass('passed');
                                    xactdate.addClass('cleared');
                                    this.account.clearAdd(this.amount);
                                    this.cleared = true;
                                } else {
                                    var d = new Date();
                                    if((xactdate.getElement('input').value*1000) < d.getTime()) xactdate.addClass('passed');
                                    this.account.clearSubtract(this.amount);
                                    this.cleared = false;
                                }
                            } else {
                                this.account.refresh();
                            }
                        }
                    );
                }.bind(this));
            }
//If the transaction has the same currency as its account, then we are allowed to edit the amount in place.
            var amountEl = this.element.getElement('.aamount');
            if(amountEl.hasClass('clickable')) {
                var amountClick = function(e) {
                    e.stop();
                    amountEl.removeEvent('click',amountClick);
                    var original = amountEl.get('text');
                    var input = new Element('input',{'type':'text','name':'amount','class':'amount','value':original});
                    amountEl.set('text','');
                    input.inject(amountEl);
                    input.addEvent('blur',function(){
                        if(this.amount.setIfValid(input.value)) {
                            input.dispose();
                            this.account.request.callRequest(
                                'updateamount.php',
                                {
                                    'key':Utils.sessionKey,
                                    'tid':this.tid,
                                    'version': this.element.getElement('input[name=version]').value,
                                    'issrc':this.account.isSrc,
                                    'amount':input.value
                                },
                                this,
                                function (response) {
                                    if(!response.newversion && response.tid == this.tid) {
                                        this.element.getElement('input[name=version]').value = response.version;
                                        amountEl.addEvent('click',amountClick);
                                        this.account.recalculate();
                                    } else {
                                        this.account.refresh();
                                    }        
                                }
                            );    
                        } else {
                            if(!confirm('Invalid format, click OK to re-edit, click Cancel to revert')) {
                                input.value = original;
                            }
                            input.focus();
                        }
                    }.bind(this));
                    input.focus();
                }.bind(this);
                amountEl.addEvent('click', amountClick);
            }
        }
        
    },
    manageForm: function () {
// Create a calender and set the date to now
        this.element.xdate.value = new Date().getTime()/1000;
        this.calendar = new Calendar.Single(this.element.xdate,{
            onHideStart:function () {
                this.element.xdate.fireEvent('change')
            }.bind(this)
        });
        this.element.xdate.addEvent('change', function(e) {
            var i=0;
//TODO - if the date is changed, should we perhaps move the transaction and then scroll to it
            this.formSender();
        }.bind(this));
//Make it visible and scroll to it.
        this.element.removeClass('hidden');
        var xpos = this.element.getCoordinates();
        window.scrollTo(0,xpos.top - 100);
    },
    formSender: function () {
        this.account.request.callRequest(
            'updatexaction.php',
            {
                data:this.element
            },
            this,
            function(response) {
                if(!response.newversion) {
//                    this.version.value = response.version;  
                    if (this.tid == 0) {
//                        this.element.tid.value = response.tid;
//                        this.element.getElement('.arow').set('id','t'+response.tid);
                    }
                } else {
                    this.account.refresh();
                }
            }
        );   
    },
    getAmount: function () {
        return this.amount;
    },
    getCumulative: function() {
        return this.cumulative;
    },
    setCumulative: function(amount) {
        this.cumulative.setValue(amount);
    },
    isCleared:function() {
        return this.cleared;
    }
});








/*
        
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



        var that = this;
        this.xaction = this.options.template.clone();
        var dateInput=this.xaction.xdate;
        this.xaction.removeClass('hidden');
        var accountData = this.xaction.getElement('.accounttype');
        if(this.options.create) { //a create transaction
            this.xaction.getElement('.arow').set('id','t'+this.options.create.tid);
            this.xaction.version.value = this.options.create.version;
            dateInput.value=this.options.create.xdate;
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

*/


Account = new Class({
    initialize: function(options) {
        this.accountName = options.accountName;
        this.isSrc = options.isSrc;
        this.currency = options.currency;
        this.rate = options.rate;
        this.minmaxAmount = new Amount(options.minmaxAmount);
        this.balanceAmount = new Amount (options.balanceAmount);
        this.clearAmount = new Amount (options.clearAmount);
        this.transactions = options.transactions;
        this.newXactionButton = options.newXactionButton;
        this.rebalanceButton = options.rebalanceButton;
        this.nowMarker = options.nowMarker;
        this.template = options.template;
        this.request = new Utils.Queue();
// Now loop round all transactions and create a transaction to represent it
        this.transactions.each(function(xaction) {
            var transaction = new Transaction(xaction,this);
        },this);
//new Transaction Button
        this.newXactionButton.addEvent('click',function(e) {
            e.stop();
            var xaction = this.template.clone();
            xaction.inject(this.nowMarker,'before');
            new Transaction(xaction,this);
        }.bind(this));
        this.rebalanceButton.addEvent('click',function(e) {
            this.request.callRequest('rebalance.php',{'key':Utils.sessionKey,'account':this.accountName},this,function(response){
            var i=0;
//TODO
            });

        }.bind(this));
       
    },
    clearAdd:function(amount) {
        this.clearAmount.add(amount);
    },
    clearSubtract:function(amount) {
        this.clearAmount.subtract(amount);
    },
    recalculate:function() {
        var runningTotal = new Amount();
        var r=0;
        runningTotal.setValue(this.balanceAmount);
        this.minmaxAmount.setValue(this.balanceAmount);
        this.clearAmount.setValue(this.balanceAmount);
        this.transactions.each(function(el) {
            r++;
            el.removeClass('even');
            if (r%2 == 0) el.addClass('even');
            var xaction = el.retrieve('transaction');
            runningTotal.add(xaction.getAmount());
            xaction.setCumulative(runningTotal);
            if(this.isSrc) {
                if(runningTotal.getValue() < this.minmaxAmount.getValue()) this.minmaxAmount.setValue(runningTotal);
            } else {
                if(runningTotal.getValue() > this.minmaxAmount.getValue()) this.minmaxAmount.setValue(runningTotal);
            }
            if (xaction.isCleared()) {
                this.clearAmount.add(xaction.getAmount());
            }           
        },this);
    },
    refresh: function() {
        //if we get this, it means that someone else updated our transaction and we need to reset the data
        alert('Someone else updated this transaction whilst you have been viewing it. ' +
            'We are going to refresh this page to ensure you have the most up to date version.');
//TODO        window.location = 'index.php?account='+this.accountName;
    }   
});                
        
        
        
        
        
        




/*





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
                            xdate:response.xdate,
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



    },
*/
