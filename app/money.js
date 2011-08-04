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

EDIT_KEY = 'AKCmEDIT';  //coordinate this with same define in index.php

Amount = new Class({
    Implements: [Events, Class.Occlude],
    property: 'amount',
    initialize: function(element){ 
        var aString;
        if(element) {
            this.element = document.id(element);
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
        return this;
    },
    subtract: function(amount) {
        this.value -= amount.getValue();
        this.setText();
        return this;
    },
    multiply: function(number) {
        this.value = (this.value*number);
        this.setText();
        return this;
    },
    negate: function() {
        this.value = -this.value;
        this.setText();
        return this;
    },
    getValue: function() {
        return this.value; 
    },
    setValue: function(amount) {
        if(typeOf(amount) == 'object') {
            this.value = amount.getValue();
        } else {
            this.value = amount.toFloat();
        }
        this.setText();
        return this;
    },
    setIfValid: function(aString) {
        if(/^\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/.test(aString)) {
//1[##][,###]+[.##]
//1###+[.##]
//0.##
//.##
            var n = new Number(aString);
            if (isNaN(n)) return false;
            this.value = n;
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
        return this;
    }
});

var AKCMoney = function () {
//    Key variables holding info about the account that the transactions might need to refer to 
    var accountName;
	var startDateCalendar;
    var currency;
    var minBalance;
    var clearedBalance;
	var reconciledBalance;
    var sorting;
    var request = new Utils.Queue('index.php');
// Key class for transaction
    var Transaction = new Class({
        Implements: [Class.Occlude],
        property: 'transaction',
        initialize: function(element){
            this.element = document.id(element);
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
			this.reconciled = dateEl.hasClass('reconciled');
            if( !dateEl.hasClass('repeat')) { //we can't adjust repeating transactions
                dateEl.addEvent('click', function(e) {
                    e.stop();
                    if(this.editMode) return;  //Ignore requests whilst editing transaction
					if(this.reconciled) {
					    if (confirm("Do you mean to stop this transaction from being reconciled?  NOTE: If you do it will not change the reconciled balance which you must adjust manually")) {
					        request.callRequest(
					            'clearreconciled.php',
					            {
					                'key':Utils.sessionKey,
					                'tid':this.tid,
					                'account':accountName,
					                'version':this.version
					            },
					            this,
                                function (holder) {
                                    var d = new Date();
                                    dateEl.removeClass('reconciled');
                                    this.reconciled = false;
                                    if((dateEl.getElement('input').value*1000) < d.getTime()) dateEl.addClass('passed');
                                    this.setVersion(holder.getElement('xaction').get('version'));
                                    recalculate();
					           }
					        );
                        };
                    } else {
                        if (this.cleared) {
                            var d = new Date();
					        if((dateEl.getElement('input').value*1000) < d.getTime()) dateEl.addClass('passed');
						    dateEl.removeClass('cleared');
						    this.cleared = false;
						    clearedBalance.subtract(this.amount);
					    } else {
						    dateEl.addClass('cleared');
					        dateEl.removeClass('passed');
						    this.cleared = true;
						    clearedBalance.add(this.amount);
					    }
					}
                }.bind(this));
            }
            var amountEl = this.element.getElement('.aamount');
            if(amountEl.hasClass('clickable')) {
                amountEl.addEvent('click', function(e) {
                    e.stop();
                    if(this.editMode) return;  //already editing this transaction
                    this.editMode = true;  //say WE are editing it.
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
                                    'amount':amount.getValue(),
                                    'account':accountName
                                },
                                this,
                                function (holder) {
                                    if(holder.getElement('xaction').get('tid') == this.tid) {
                                        this.setVersion(holder.getElement('xaction').get('version'));
                                        this.editMode = false;
                                        sorting.addItems(this.element);
                                        recalculate();
                                    }        
                                }
                            );
                        } else {
                            this.editMode = false;
                            sorting.addItems(this.element);
                        }
                        this.amount.setValue(amount);    
                        input.dispose();    
                    }.bind(this));
                    input.focus();
                }.bind(this));
            };
        },
        edit: function () {
            this.editMode = true;
            var codediv = this.element.getElement('.codetype')
            var codeimg = codediv.getElement('div').clone();
            this.editForm = document.id('xactiontemplate').clone().inject(this.element,'bottom');
            var codeformdiv = this.editForm.getElement('.codetype');
            codeimg.inject(codeformdiv); //inject image into form just after select
            Utils.selectValueSet(this.editForm,'code',codediv.getElement('.codeid').get('text')); //and set selection to this correct value
            this.editForm.getElement('select[name=code]').addEvent('change', function(e) {
                e.stop();
                codeformdiv.getElement('div').destroy();
                var newimg = new Element('div');
                newimg.addClass('code_'+this.getChildren()[this.selectedIndex].get('codetype'));
                newimg.set('html','&nbsp;');
                newimg.inject(codeformdiv);
            });
            this.element.getFirst().addClass('hidden');
            this.editForm.getElement('input[name=tid]').value = this.tid;
            this.editForm.getElement('input[name=rno]').value = this.element.getElement('.ref').get('text');
            this.editForm.getElement('input[name=desc]').value = this.element.getElement('.description').get('text');
            var xdate = this.editForm.getElement('input[name=xdate]')
            xdate.value = this.element.getElement('input[name=xxdate]').value;
            this.cumcopy = new Amount(this.editForm.getElement('.cumcopy'));
            this.cumcopy.setValue(this.cumulative);
            window.scrollTo(0,this.element.getCoordinates().top - 100);
            this.element.addClass('spinner');
            sorting.removeItems(this.element);
            request.callRequest(
                'starteditxaction.php',
                {
                    'key':Utils.sessionKey,
                    'tid':this.tid,
                    'version':this.version,
                    'account':accountName
                },
                this,
                function(holder) {
                    this.element.removeClass('spinner');
                    this.editForm.removeClass('hidden');
			// Create a calender and set the date to now
				    this.calendar = new Calendar.Single(xdate);
                    var rno = this.editForm.getElement('input[name=rno]');
                    rno.value = this.element.getElement('.ref').get('text');
                    var desc = this.editForm.getElement('input[name=desc]');
                    desc.value = this.element.getElement('.description').get('text');
                    desc.focus();
                    var xaction = holder.getElement('xaction');
                    this.setVersion(xaction.get('version'));
                    var accountType = this.editForm.getElement('input[name=accounttype]');
                    accountType.value = xaction.get('accounttype');
                    var originalAmount = this.amount.getValue();
                    this.editForm.getElement('.sellabel').set('text',(accountType.value == 'src')?'Dst :':'Src :');
                    this.editForm.getElement('.switchsrcdst').addEvent('click',function(e) {
                        accountType.value = (accountType.value == 'src')?'dst':'src';
                        this.amount.negate();
                        var newtype = (accountType.value == 'src')?'Dst':'Src' ;
                        this.editForm.getElement('.sellabel').set('text',newtype+' :');
                        var mover = this.editForm.getElement('.moveaccount');
                        mover.set('title','Move to '+newtype+' account');
                        mover.getElement('span').set('html','<img src="move.png" />Move to '+newtype);
                        recalculate();
                    }.bind(this));
                    
                    var a = xaction.getElement('amount');
                    var trate = a.get('rate').toFloat();
                    var isZero = (a.get('zero') == "true");
                    var account = xaction.getElement('account');
                    var arate = account.getElement('amount').get('rate').toFloat();
                    var crate = this.editForm.getElement('.crate');
                    crate.set('text',trate/arate);   
                    var amount = new Amount(this.editForm.getElement('input[name=amount]'));
                    var oldValue = a.get('text').toFloat();
                    amount.setValue(a.get('text'));
                    amount.addEvent('change',function(occurred) {
                        if(occurred) {
                            if(this.editForm.getElement('input[name=acchange]').value == 0) {
                                if(isZero) {
                                    aamount.setValue(amount).multiply(arate/trate);
                                    isZero = false;
                                } else {
                                    aamount.multiply(amount.getValue()/oldValue);
                                }
                                this.amount.setValue(aamount);
                                if (accountType.value == "src") this.amount.negate();
                                recalculate();
                            }
                            oldValue = amount.getValue();                                
                        }
                    }.bind(this));
                    var aamount = new Amount(this.editForm.getElement('input[name=aamount]'));
                    aamount.setValue(account.getElement('amount').get('text'));
                    aamount.addEvent('change', function(occurred) {
                        if(occurred) {
                        
                            var acchange = this.editForm.getElement('input[name=acchange]');
                            if(acchange.value == 0) {
                                acchange.value = 1;
                            }
                            this.amount.setValue(aamount);
                            if (accountType.value == "src") this.amount.negate();
                            recalculate();
                        }
                    }.bind(this));
                    Utils.selectValueSet(this.editForm,'currency',a.get('currency'));
                    var currency = this.editForm.getElement('select[name=currency]')
                    var accountCurrency = account.getElement('amount').get('currency');
                    if(accountCurrency == currency.value) {
                        aamount.element.readOnly = true;
                    }
                    currency.addEvent('change',function() {
                        currency.getElements('option').every(function(option) {
                            if(option.get('text') == currency.value) {
                                var newrate = option.get('rate').toFloat();
                                if(accountCurrency == currency.value) {
                                    aamount.element.readOnly = true;
                                    aamount.setValue(amount);
                                    this.amount.setValue(aamount);
                                    if (accountType.value == "src") this.amount.negate();
                                    recalculate();
                                } else {
                                    aamount.element.readOnly = false;
                                    if(!isZero && this.editForm.getElement('input[name=acchange]').value == 0) {
                                        aamount.multiply(trate/newrate);
                                        this.amount.setValue(aamount);
                                        if (accountType.value == "src") this.amount.negate();
                                      recalculate();
                                    }
                                }
                                trate = newrate;
                                crate.set('text',trate/arate);
                                return false;
                            }
                            return true;
                        }.bind(this));
                    }.bind(this));
                    
                    var other = account.getNext();
                    Utils.selectValueSet(this.editForm,'account',(other)?other.get('name'):'');
                    var cleared = this.editForm.getElement('input[name=cleared]');
                    cleared.checked = (account.get('cleared') != 0);
                    var repeat = this.editForm.getElement('select[name=repeat]');
                    Utils.selectValueSet(this.editForm,'repeat',xaction.get('repeat'));
                    repeat.addEvent('change', function () {
                        if(repeat.value != 0) {
                            if(cleared.checked) {
                                //If we continue we will end up clearing the reconciled state of this transaction which is probably not what we meant - so we ask
                                if (confirm("This will clear reconciled state, but will NOT adjust reconciled balance.  Are you sure you with to proceed")) {
                                    cleared.checked = false;
                                    recalculate();
                                } else {
                                    repeat.value = 0;  //Force a no repeat
                                }
                            }
                        }
                    }); 
                    cleared.addEvent('change',function () {
                        if(repeat.value != 0) {
                            cleared.checked = false; //Don't allow it to change
                        } else {
                            if(confirm("Changing the state will NOT adjust the reconciled balance. Are you sure you wish to proceed?")) {  
                                recalculate();
                            } else {
                                cleared.checked = cleared.checked? false:true; //set it back if didn't agree to go forward
                            }
                        } 
                    });
                    this.editForm.getElement('.setcurrency').addEvent('click',function(e) {
                        this.editForm.getElement('input[name=acchange]').value=2;
                        this.editForm.getElement('.crate').addClass('setrate');
                    }.bind(this));
                    this.editForm.getElement('.revertxaction').addEvent('click',function(e) {
                        this.amount.setValue(originalAmount);
                        this.element.getElement('.wrapper').removeClass('hidden');
                    	this.calendar.picker.destroy();
                    	delete this.calendar;
                        this.editForm.destroy();
                        delete this.editForm;
                        sorting.addItems(this.element);
                        this.editMode = false;
                        recalculate();
                    }.bind(this));
                    this.editForm.getElement('.deletexaction').addEvent('click',function(e) {
                        if(confirm('Are you sure you wish to delete this transaction?')) {
                            request.callRequest('deletexaction.php',{'key':Utils.sessionKey,'tid':this.tid,'version':this.version},this,
                                function(holder) {
                                	this.calendar.picker.destroy();
                                	delete this.calendar;
                                    this.element.destroy();
                                    recalculate();
                                }
                            );
                        }
                    }.bind(this));
                    this.editForm.getElement('.moveaccount').addEvent('click',function(e) {
                        e.stop();
                        var account = this.editForm.getElement('select[name=account]');
                        if(account.selectedIndex != 0) {
                            //Only do this if we have selected a new account from the list
                            this.editForm.getElement('input[name=move]').value=1; //indicates to update transaction to deal with this specially
                            request.callRequest('updatexaction.php',this.editForm,this,function(holder) {
                            	this.calendar.picker.destroy();
                            	delete this.calendar;
                               	window.location='index.php?'+Object.toQueryString({'account':account.options[account.selectedIndex].value,'tid':this.tid,'edit':EDIT_KEY});
                            });
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
                                var marker = document.id('now');
                                var xdate = xaction.get('date');
                                var dateEl = this.element.getElement('input[name=xxdate]')
                                var odate = dateEl.value 
                                dateEl.value= xdate;
                                var del= this.element.getElement('.date');
                                if(xaction.get('repeat') == 0) {
                                    del.removeClass('repeat');
                                    this.cleared = (xaction.get('clear') != 'f');
                                    if(this.cleared) {
                                        del.addClass('cleared');
                                        del.removeClass('passed');
                                    } else {
                                        del.removeClass('cleared');
                                    }
                                    
                                    if(xdate < new Date().getTime()/1000) {
                                        if(!this.cleared) del.addClass('passed');
                                    } else {
                                        del.removeClass('passed');
                                    }
                                } else {
                                    del.removeClass('cleared').removeClass('passed').addClass('repeat');
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
                                                if (xdate > previous.getElement('input[name=xxdate]').value) {
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
                                                if (xdate < next.getElement('input[name=xxdate]').value) {
                                                    found=true;
                                                    this.element.inject(next,'before');
                                                }
                                            } else {
                                                found= true;
                                                this.element.inject(this.element.getParent(),'bottom');
                                            }
                                        }
                                    }
                                   recalculate();
                                    window.scrollTo(0,this.element.getCoordinates().top - 100);
                                }
                                this.element.getElement('.ref').set('text', rno.value);
                                this.element.getElement('.description').set('text', desc.value);
                                if( xaction.getElement('amount').get('dual') == "true" ) {
                                    this.element.getElement('.description').addClass('dual');
                                    this.element.getElement('.aamount').addClass('dual');
                                    this.element.getElement('.cumulative').addClass('dual');
                                } else {
                                    this.element.getElement('.description').removeClass('dual');
                                    this.element.getElement('.aamount').removeClass('dual');
                                    this.element.getElement('.cumulative').removeClass('dual');
                                }
                                codediv.getElement('div').destroy();
                                codeimg = new Element('div',{'class':'code_'+xaction.getElement('code').get('codetype'),'html':'&nbsp;'});
                                codeimg.inject(codediv,'top');
                                codediv.getElement('.codeid').set('text',xaction.getElement('code').get('codeid'));
                                codediv.getElement('.codedesc').set('text',xaction.getElement('code').get('text'));
                                this.element.getElement('.wrapper').removeClass('hidden');
                                this.amount.setValue(holder.getElement('amount').get('text'));
                                this.calendar.picker.destroy();
                                delete this.calendar;
                                this.editForm.destroy();
                                delete this.editForm;
                                sorting.addItems(this.element);
                                this.editMode = false;
                            }
                        );
                         this.editForm.addClass('spinner');
                    }.bind(this));
               }
            );
        },
        setVersion: function(v) {
            this.version = v
            this.element.getElement('input[name=version]').value = v;
            if(this.editForm) {
                this.editForm.getElement('input[name=version]').value = v;
            }
        },
        getAmount: function () {
            return this.amount;
        },
        setCumulative: function(amount) {
            this.cumulative.setValue(amount);
            if(this.editMode) {
                this.cumcopy.setValue(amount);
            }
        },
        isCleared:function() {
            return (this.editForm && this.editMode)? false :this.cleared; //we force any transactions being edited to not be cleared
        },
        isReconciled:function() {
            return (this.editForm && this.editMode)?this.editForm.getElement('input[name=cleared]').checked :this.reconciled
        },
        getXactionDate: function() {
            return this.element.getElement('input[name=xxdate]').value.toInt();
        },
        setXactionDate: function(d) {
            var el = this.element.getElement('input[name=xxdate]')
            el.value = d;
            el.removeClass('dateconvert').addClass('dateawait');
            el = el.getParent();
            if(d > new Date().getTime()/1000) {
                el.removeClass('passed');
            } else {
                if(!(el.hasClass('cleared') || el.hasClass('repeat'))) el.addClass('passed');
            }
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
        runningTotal.setValue(reconciledBalance);
        minBalance.setValue(reconciledBalance);
        clearedBalance.setValue(reconciledBalance);
        sorting.serialize().each(function(id) {
            if( id == "now") return;
            var el = document.id(id);
            r++;
            el.removeClass('even');
            if (r%2 == 0) el.addClass('even');
            var xaction = el.retrieve('transaction');
            if (xaction.isReconciled()) {
                xaction.setCumulative(new Amount());  //Setting cumulative to 0 since not valid for reconciled transactions
            } else {
                runningTotal.add(xaction.getAmount());
                xaction.setCumulative(runningTotal);
                if(runningTotal.getValue() < minBalance.getValue()) minBalance.setValue(runningTotal);
                if (xaction.isCleared()) {
                    clearedBalance.add(xaction.getAmount());
                }
            }         
        },this);
    };
    return {
        Account: function(aN, c,tid,ekey) {
            currency = c;
            accountName = aN;
			/* Add a calendar to select when the start date for the display of transactions from this account */
			startDateCalendar = new Calendar.Single(document.id('startdate'),{'onHideComplete':function () {
                request.callRequest('changescope.php',{
                    'key':Utils.sessionKey,
                    'account':accountName,
                    'dversion':document.id('dversion').value,
                    'scope':'D',
                    'sdate':document.id('startdate').value
                },this,function(holder) {
                    window.location.replace('index.php');  //redisplays this page with new values
                });
                    
			}});
            document.id('scopeselection').getElements('input[name=scope]').addEvent('click',function(e){
                e.stop();
                request.callRequest('changescope.php',{
                    'key':Utils.sessionKey,
                    'account':accountName,
                    'dversion':document.id('dversion').value,
                    'scope':this.value,
                    'sdate':document.id('startdate').value
                },this,function(holder) {
                    window.location.replace('index.php');  //redisplays this page with new values
                });
                    
            });    
            document.id('transactions').getElements('.xaction').each(function(transaction) {
                var t = new Transaction(transaction); //Class attaches to the transaction as it is occluded
                if (t.tid == tid) {
                    var myFx = new Fx.Scroll(window);
                    var delayed = function() {
                        myFx.toElement(transaction, 'y');
                        if (ekey == 1) t.edit.delay(600,t); //allow scroll to complete
                    }
                    delayed.delay(20,t) //Allow all other transaction setups to complete and then scroll to this one
                }
            });
            sorting = new Sortables(document.id('transactions'),{
                clone:false,
                opacity:0.5, 
                revert: { duration: 500, transition: 'elastic:out' },
                onComplete: function(transaction) {
                    var m = document.id('now'); //we need to skip this if we come across it
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
            sorting.removeItems(document.id('now')); //We need to remove the now marker from sortables.
// Add Event Button
            document.id('new').addEvent('click', function(e) {
		var a;
                request.callRequest(
                    'newxaction.php',
                    this.getParent(),
                    document.id('now'),
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
            document.id('rebalance').addEvent('click',function(e) {
                var params = this.getParent().clone(); //This will be the basis of the request, but we now need to get all transactions that are cleared as well
                document.id('transactions').getElements('.xaction').each(function(xaction) {
                    if (xaction.getElement('.date').hasClass('cleared')) {
                        //We now make an input element that will hold one array entry consisting of the transaction id and version separated by 
                        var i = new Element('input',{'name':'transactions[]','value':xaction.get('id').substr(1) + ':' + xaction.getElement('input[name=version]').value});
                        i.inject(params);
                    }
                });
                request.callRequest(
                    'rebalance.php',
                    params,
                    reconciledBalance,
                    function(holder){
                        reconciledBalance.setValue(holder.getElement('balance').get('text'));
                    	document.id('recbaldate').removeClass('dateconvert').addClass('dateawait').value = new Date().getTime()/1000;
                    	Utils.dateAdjust(document.id('recbaldate').getParent(),'dateawait','dateconvert');
                        var xactions = holder.getElement('xactions').getElements('xaction');
                        xactions.each(function(xaction) {
                            var el = document.id('t'+xaction.get('tid'));
                            var dEl = el.getElement('.date');
                            dEl.addClass('reconciled');
                            dEl.removeClass('cleared');
                            var t = new Transaction(el); //should return the old transaction
                            t.reconciled = true;
                            t.cleared = false;
                            t.setVersion(xaction.get('version'));                            
                        });
                        document.id('bversion').value = holder.getElement('balance').get('version');
                        recalculate();
                    }
                );
            });
            reconciledBalance = new Amount(document.id('recbalance'));
            reconciledBalance.addEvent('change',function(occurred) {
                if(occurred) {
                    request.callRequest('updatebalance.php',{
                        'key':Utils.sessionKey,
                        'account':accountName,
                        'bversion':document.id('bversion').value,
                        'balance':openingBalance.getValue()
                    },this,function(holder) {
                    	document.id('openbaldate').removeClass('dateconvert').addClass('dateawait').value = new Date().getTime()/1000;
                    	Utils.dateAdjust(document.id('openbaldate').getParent(),'dateawait','dateconvert');
                        document.id('bversion').value = holder.getElement('balance').get('version');
                        recalculate();                
                    });
                }
            });
            //Go and recalculate various balances
            minBalance = new Amount(document.id('minbalance'));
            clearedBalance = new Amount(document.id('clearbalance'));
            recalculate();  //need to do this to ensure min and cleared balance get set correctly
        }
    }
}();


