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
    Implements: [Events, Class.Occlude],
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
                this.element.addEvent('blur',function(e) {
                    var value = this.value;
                    if(this.setIfValid(this.element.value)) {
                        this.fireEvent('change',this.value != value); //fire event on any blur, but send whether a change occurred
                    } else {
                        if(!confirm('Invalid format, click OK to re-edit, click Cancel to revert')) {
                            this.setText();
                        }
                        this.element.focus();
                    }   
                }.bind(this));
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
    negate: function() {
        this.value = -this.value;
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
    }
});

var AKCMoney = function () {
//    Key variables holding info about the account that the transactions might need to refer to 
    var accountName;
    var currency;
    var isSrc;
    var openingBalance;
    var minMaxBalance;
    var clearedBalance;
    var sorting;
    var request = new Utils.Queue('index.php');
// Key class for transaction
    var Transaction = new Class({
        Implements: [Class.Occlude],
        property: 'transaction',
        initialize: function(element){
            this.element = $(element);
            if (this.occlude()) return this.occluded;
            this.amount = new Amount(this.element.getElement('.aamount'));
            this.cumulative = new Amount (this.element.getElement('.cumulative'));
            this.tid = this.element.get('id').substr(1).toInt();
            this.setVersion(this.element.getElement('input[name=version]').value);
            this.accountAmountAltered = false;
            this.editMode = false;
            this.element.addEvent('dblclick', function(e) {
                e.stop();
                if (!this.editMode) this.edit();
            }.bind(this));
            var dateEl = this.element.getElement('.date');
            this.cleared = dateEl.hasClass('cleared');
            if( !dateEl.hasClass('repeat')) { //we can't clear repeating transactions
                dateEl.addEvent('click', function(e) {
                    e.stop();
                    request.callRequest(
                        'toggleclear.php',
                        {
                            'key':Utils.sessionKey,
                            'tid':this.tid,
                            'version': this.element.getElement('input[name=version]').value,
                            'issrc':isSrc,
                            'clear':(!dateEl.hasClass('cleared')) //if it has the class then we are NOT clearing it
                        },
                        this,
                        function(holder) {
                            if(holder.getElement('xaction').get('tid') == this.tid) {
                                this.element.getElement('input[name=version]').value = response.version;
                                var xactdate = this.element.getElement('.date');
                                var xactamt = new Amount(this.element.getElement('.amount'));
                                xactdate.removeClass('cleared'); //remove it if its there
                                if (holder.getElement('xaction').get('clear') == 'true' ) {
                                    xactdate.removeClass('passed');
                                    xactdate.addClass('cleared');
                                    clearedbalance.add(this.amount);
                                    this.cleared = true;
                                } else {
                                    var d = new Date();
                                    if((xactdate.getElement('input').value*1000) < d.getTime()) xactdate.addClass('passed');
                                    clearedbalance.subtract(this.amount);
                                    this.cleared = false;
                                }
                            }
                        }
                    );
                }.bind(this));
            }
            var amountEl = this.element.getElement('.aamount');
            if(amountEl.hasClass('clickable')) {
                this.amountClick = function(e) {
                    e.stop();
                    amountEl.removeEvent('click',this.amountClick);
                    sorting.removeItems(this.element);
                    var input = new Element('input',{'type':'text','name':'amount','class':'amount','value':amountEl.get('text')});
                    var amount = new Amount(input);
                    amountEl.set('text','');
                    input.inject(amountEl);
                    amount.addEvent('change',function(occurred){
                        if(occurred) { //actual change so tell the database
                            request.callRequest(
                                'updateamount.php',
                                {
                                    'key':Utils.sessionKey,
                                    'tid':this.tid,
                                    'version': this.version,
                                    'issrc':isSrc,
                                    'amount':amount.getValue()
                                },
                                this,
                                function (holder) {
                                    if(holder.getElement('xaction').get('tid') == this.tid) {
                                        this.setVersion(holder.getElement('xaction').get('version'));
                                        amountEl.addEvent('click',this.amountClick);
                                        sorting.addItems(this.element);
                                        recalculate();
                                    }        
                                }
                            );
                        } else {
                            amountEl.addEvent('click',this.amountClick);
                            sorting.addItems(this.element);
                        }
                        this.amount.setValue(amount);    
                        input.dispose();    
                    }.bind(this));
                    input.focus();
                }.bind(this);
                amountEl.addEvent('click', this.amountClick);
            };
        },
        edit: function () {
            this.editForm = $('xactiontemplate').clone().removeClass('hidden').inject(this.element,'bottom');
            this.element.getFirst().addClass('hidden');
            this.editForm.getElement('input[name=tid]').value = this.tid;
            this.editForm.getElement('input[name=rno]').value = this.element.getElement('.ref').get('text');
            this.editForm.getElement('input[name=desc]').value = this.element.getElement('.description').get('text');
            var xdate = this.editForm.getElement('[input[name=xdate]')
            xdate.value = this.element.getElement('input[name=xxdate]').value;
    // Create a calender and set the date to now
            this.calendar = new Calendar.Single(xdate);
            this.editMode = true;
            window.scrollTo(0,this.element.getCoordinates().top - 100);
            this.element.addClass('spinner');
            sorting.removeItems(this.element);
            request.callRequest(
                'starteditxaction.php',
                {
                    'key':Utils.sessionKey,
                    'tid':this.tid,
                    'version':this.version,
                    'issrc':isSrc
                },
                this,
                function(holder) {
                    this.element.removeClass('spinner');
                    var rno = this.editForm.getElement('input[name=rno]');
                    rno.value = this.element.getElement('.ref').get('text');
                    rno.addEvent('change',function(e) {
                        e.stop()
                        this.element.getElement('.ref').set('text', rno.value);
                    }.bind(this));
                    var desc = this.editForm.getElement('input[name=desc]');
                    desc.value = this.element.getElement('.description').get('text');
                    desc.addEvent('change', function(e) {
                        e.stop()
                        this.element.getElement('.description').set('text', desc.value);
                    }.bind(this));
                    var xaction = holder.getElement('xaction');
                    this.setVersion(xaction.get('version'));
                    var a = xaction.getElement('amount');
                    var amount = new Amount(this.editForm.getElement('input[name=amount]'));
                    amount.setIfValid(a.get('text'));
                    var account = xaction.getElement('account');
                    var aamount = new Amount(this.editForm.getElement('input[name=aamount]'));
                    aamount.setIfValid(account.getElement('amount').get('text'));
                    aamount.addEvent('change', function(e) {
                        e.stop();
                        var acchange = this.editForm.getElement('input[name=acchange]');
                        if(acchange.value == 0) {
                            acchange.value = 1;
                        }
                        this.amount.setValue(aamount);
                        recalculate();
                    }.bind(this));
                    var crate = this.editForm.getElement('.crate');
                    crate.set('text',account.getElement('amount').get('rate')/a.get('rate'));   
                    Utils.selectValueSet(this.editForm,'currency',a.get('currency'));
                    var currency = this.editForm.getElement('select[name=currency]')
                    currency.addEvent('change',function(e) {
                        e.stop();
                        currency.getElements('option').every(function(option) {
                            if(option.get('text') == currency.value) {
                                crate.set('text',account.getElement('amount').get('rate')/option.get('rate'));
                                return false;
                            }
                            return true;
                        });
                    });
                    var other = account.getNext();
                    Utils.selectValueSet(this.editForm,'account',(other)?other.get('name'):'');
                    var cleared = this.editForm.getElement('input[name=cleared]');
                    cleared.checked = (account.get('cleared') == "t");
                    var repeat = this.editForm.getElement('select[name=repeat]');
                    Utils.selectValueSet(this.editForm,'repeat',xaction.get('repeat'));
                    repeat.addEvent('change', function (e) {
                        e.stop();
                        cleared.checked = false;
                        cleared.fireEvent('change');
                    }); 
                    cleared.addEvent('change',function (e) {
                        if(repeat.value == 0) {
                            var el = this.element.getElement('.date');
                            if (cleared.checked) {                        
                                el.removeClass('passed');
                                el.addClass('cleared');
                            } else {
                                el.removeClass('cleared');
                                if(xdate.value < new Date().getTime()/1000) el.addClass('passed');
                            }
                            recalculate();
                        }
                    });
                    this.editForm.getElement('.setcurrency').addEvent('click',function(e) {
                        this.editForm.getElement('input[name=acchange]').value=2;
                    }.bind(this));
                    this.editForm.getElement('.switchsrcdst').addEvent('click',function(e) {
                        isSrc = !isSrc;
                        this.editForm.getElement('input[name=accounttype]').value = (isSrc)?'src':'dst';
                        aamount.negate();
                        this.amount.setValue(aamount);
                        this.editForm.getElement('.sellabel').set('text',(isSrc)?'Dst :':'Src :');
                        recalculate();
                    }.bind(this));
                    this.editForm.getElement('.revertxaction').addEvent('click',function(e) {
                        this.editForm.destroy();
                        this.edit();
                    }.bind(this));
                    this.editForm.getElement('.deletexaction').addEvent('click',function(e) {
                        if(confirm('Are you sure you wish to delete this transaction?')) {
                            request.callRequest('deletexaction.php',{'key':Utils.sessionKey,'tid':this.tid,'version':this.version},this,
                                function(holder) {
                                    this.element.destroy();
                                }
                            );
                        }
                    }.bind(this));
                    this.editForm.getElement('.closeeditform').addEvent('click',function(e) {
                        e.stop();
                        request.callRequest('updatexaction.php',this.editForm,this,
                            function(holder) {
                                var xaction = holder.getElement('xaction');
                                this.setVersion(xaction.get('version'));
                                //We may have changed the date, so we need to move the transaction into position if that is the case
                                var found = false;
                                var marker = $('now');
                                var xdate = xaction.get('date');
                                var dateEL = this.element.getElement('input[name=xxdate]')
                                var odate = dateEl.value 
                                dateEl.value= xdate;
                                if(xaction.get('repeat') == 0) {
                                    var del= this.element.getElement('.date');
                                    if(xdate < new Date().getTime()/1000) {
                                        if(!del.hasClass('cleared')) del.addClass('passed');
                                    } else {
                                        del.removeClass('passed');
                                    }
                                }
                                if (xdate != odate) {
                                    dateEl.removeClass('dateconvert').addClass('dateawait');
                                    Utils.dateAdjust(this.element,'dateawait','dateconvert');
                                    if (xdate < odate) {
                            //we have adjusted the date to earlier than before.  Need to look at Previous Elements to find out where to move it to
                                        var previous = this.element;
                                        while(!found) {
                                            previous = previous.getPrevious()
                                            if (previous == marker) previous = previous.getPrevious();
                                            if(previous) {                            
                                                if (xdate.value > previous.getElement('input[name=xxdate]').value) {
                                                    found = true;
                                                    this.element.inject(previous,'after');
                                                }
                                            } else {
                                                found = true;
                                                this.element.inject(this.element.getParent(),'top');   
                                            }
                                        }
                                    } else {
                                        var next = this.element;
                                        while(!found) {
                                            next = next.getNext();
                                            if(next == marker) next=next.getNext();
                                            if(next) {
                                                if (xdate.value < next.getElement('input[name=xxdate]').value) {
                                                    found=true;
                                                    this.element.inject(next,'before');
                                                }
                                            } else {
                                                found= true;
                                                this.element.inject(this.element.getParent(),'bottom');
                                            }
                                        }
                                    }
                                    window.scrollTo(0,this.element.getCoordinates().top - 100);
                                }
                                this.element.getElement('.wrapper').removeClass('hidden');
                                this.amount.setIfValid(holder.getElement('amount').get('text'));
                                this.editForm.destroy();
                                sorting.addItems(this.element);
                                this.editMode = false;
                            }
                        );
                        this.editForm.empty();
                        this.editForm.addClass('spinner');
                    }.bind(this));
               }
            );
        },
        setVersion: function(v) {
            this.version = v
            this.element.getElement('input[name=version]').value = v;
            if(this.editMode) {
                this.editForm.getElement('input[name=version]').value = v;
            }
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
        },
        getXactionDate: function() {
            return this.element.getElement('input[name=xxdate]').value.toInt();
        },
        setXactionDate: function(d) {
            var el = this.element.getElement('input[name=xxdate]')
            el.value = d;
            el.removeClass('dateconvert').addClass('dateawait');
            Utils.dateAdjust(this.element,'dateawait','dateconvert');
            request.callRequest(
                'updatedate.php',
                {
                    'key':Utils.sessionKey,
                    'tid':this.tid,
                    'version':this.version,
                    'date':d
                },
                this,
                function(holder) {
                    this.setVersion(holder.getElement('xaction').get('version'));
                }
            );
            recalculate();
        }
    }); //End Transaction
    var recalculate = function() {
        var runningTotal = new Amount();
        var r=0;
        runningTotal.setValue(openingBalance);
        minMaxBalance.setValue(openingBalance);
        clearedBalance.setValue(openingBalance);
        sorting.serialize().each(function(id) {
            if( id == "now") return;
            var el = $(id);
            r++;
            el.removeClass('even');
            if (r%2 == 0) el.addClass('even');
            var xaction = el.retrieve('transaction');
            runningTotal.add(xaction.getAmount());
            xaction.setCumulative(runningTotal);
            if(isSrc) {
                if(runningTotal.getValue() < minMaxBalance.getValue()) minMaxBalance.setValue(runningTotal);
            } else {
                if(runningTotal.getValue() > minMaxBalance.getValue()) minMaxBalance.setValue(runningTotal);
            }
            if (xaction.isCleared()) {
                clearedBalance.add(xaction.getAmount());
            }           
        },this);
    };
    return {
        Account: function(aN, c, isS) {
            currency = c;
            isSrc = isS;
            accountName = aN;
            $('transactions').getElements('.xaction').each(function(transaction) {
                new Transaction(transaction); //Class attaches to the transaction as it is occluded
            });
            sorting = new Sortables($('transactions'),{
                clone:true,
                opacity:0.5, 
                revert: { duration: 500, transition: 'elastic:out' },
                onComplete: function(transaction) {
                    var m = $('now'); //we need to skip this if we come across it
                    if(transaction == m) return
                    var t = transaction.retrieve('transaction');
                    var d = t.getXactionDate();
                    var p = transaction.getPrevious();
                    if(p == m) p = p.getPrevious(); //skip now marker
                    var n,pd,nd;
                    if(p) {
                        p = p.retrieve('transaction');
                        pd = p.getXactionDate();
                        if(pd > d) {
                           //we must have moved down (to a later date) for this to be so
                            n = transaction.getNext();
                            if (n == m) n = n.getNext(); //skip now marker
                            if (n) {
                                n = n.retrieve('transaction');
                                nd = n.getXactionDate();
                                if (nd < pd+1) { //if next as at the same date as previous
                                    t.setXactionDate(p.getXactionDate());
                                } else {
                                   t.setXactionDate(p.getXactionDate()+1);  //make it one second later
                                }
                            } else {
                                t.setXactionDate(p.getXactionDate()+1);  //make it one second later
                            }
                        } else {
                            n = transaction.getNext();
                            if (n == m) n = n.getNext(); //skip now marker
                            if (n) {
                                n = n.retrieve('transaction');
                                nd = n.getXactionDate();
                                if ( nd < d) {
                                    //we must have moved up (to a earlier date) for this to be so
                                    if (pd > nd-1) { //if previous at same date
                                        t.setXactionDate(n.getXactionDate()); //make it one second earlier
                                    } else {
                                        t.setXactionDate(n.getXactionDate()-1); //make it one second earlier
                                    }
                                } //else nothing to be done we haven't moved
                            } // else nothing to be done, we haven't moved
                        }
                    } else {
                        n = transaction.getNext();
                        if (n == m) n= n.getNext(); //skip now marker
                        if (n) {
                            n = n.retrieve('transaction');
                            if (n.getXactionDate()  < d) {
                                //we must have moved up to a later date for this to be so
                                t.setXactionDate(n.getXactionDate()-1); //make it one second earlier
                            } //else nothing to be done we haven't moved
                        } // else nothing to be done, we haven't moved
                    }
                }
            });
            sorting.removeItems($('now')); //We need to remove the now marker from sortables.
// Add Event Button
            $('new').addEvent('click', function(e) {
                request.callRequest(
                    'newxaction.php',
                    this.getParent(),
                    $('now'),
                    function(holder) {
                        this.set('html',holder.getElement('transaction').get('html'));
                        var xaction = this.getFirst();
                        xaction.inject(this,'before');
                        Utils.dateAdjust(xaction,'dateawait','dateconvert');
                        var t = new Transaction(xaction);
                        t.edit();
                    }
                );
            });
            $('rebalance').addEvent('click',function(e) {
                request.callRequest(
                    'rebalance.php',
                    {data: this.getParent()},
                    openingBalance,
                    function(holder){
                        var a = new Amount();
                        a.setIfValid(holder.getElement('balance').get('text'));
                        openingBalance.setValue(a);
                        var xactions = holder.getElement('xactions').getElements('xaction');
                        xactions.each(function(xaction) {
                            var el = $('t'+xaction.get('tid'));
                            sorting.removeItems(el);
                            el.destroy();
                        });
                        recalculate();
                    }
                );
            });
            openingBalance = new Amount($('openbalance'));
            minMaxBalance = new Amount($('minmaxbalance'));
            clearedBalance = new Amount($('clrbalance'));
            recalculate();
        }
    }
}();


