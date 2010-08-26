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
var AKCMoney = function () {
    var request = new Utils.Queue('accounts.php');
    var changestart = function (that) {
        var form = that.getParent('form');
        request.callRequest('updatedefaccs.php',form,that.form.version,function(holder) {
            this.value = holder.getElement('configuration').get('version');
        });
    };
    var updateAccount = function(xaccount){
        var form = xaccount.getElement('form');
        request.callRequest('updateaccount.php',form,form, function(holder) {
            this.dversion.value = holder.getElement('account').get('version');
            this.original.value = this.account.value; //store the updated name as the new original name
        });
    };
    var nameUnique = function(accountName,xaccount) {
        return $('accounts').getChildren().every(function(account) {
            if( account != xaccount) {
                if (accountName == account.getElement('form').account.value) return false;
            }
            return true;
        });
    };
    //adds the events related to an account to it
    var addAccountEvents = function (xaccount) {
        var form = xaccount.getElement('form');
        form.account.addEvent('blur',function(e) {
            e.stop();
            if(this.value != form.original.value) {//Only worry if the value is different from the original value
                if(this.value != '') {
                    if(nameUnique(this.value,xaccount)) {
                        var originalName = form.original.value;
                        var newName = this.value;
                        updateAccount(xaccount);
                        moveAccount(xaccount);
                        //We need to change default account selectors with the new name
                        selectionRemove(sextn,originalName);
                        selectionInsert(sextn,newName);
                        selectionRemove(shome,originalName);
                        selectionInsert(shome,newName);
                    } else {
                        alert("Account name is not unique, please alter until it is");
                        resetFocus.delay(10,this);
                    }
                } else {
                    alert("You cannot change the account name to blank, it will be set back to the original value")
                    this.value = form.original.value;
                    resetFocus.delay(10,this);
                }
            }
        });
        form.domain.addEvent('change', function() {
            updateAccount(xaccount);
        });
        form.currency.addEvent('change', function() {
            updateAccount(xaccount);
        });
        xaccount.getElement('a.button').addEvent('click', function(e) {
            e.stop();
            if (form.original.value == shome.value || form.original.value == sextn.value) {
                alert("You cannot delete one of the default starting accounts.  Change the default starting account first");
            } else {
                if(confirm('Are you sure you wish to delete this ('+form.original.value+') account?')) {
                    request.callRequest('deleteaccount.php',form,xaccount,function(holder) {
                        //need to remove the option for this account from the starting values
                        selectionRemove(shome,form.original.value);
                        selectionRemove(sextn,form.original.value);
                        xaccount.destroy();
                        redoOddEven();
                    });
                }
            }
        }).addEvent('keydown', function(e) {
            if(e.key == "enter"){
                this.fireEvent('click',e);
            }
        });
    };
    var redoOddEven = function() {
        $('accounts').getChildren().each(function(account,i) {
            if(i%2!=0) {
                account.addClass('even');
            } else {
                account.removeClass('even');
            }
        });
    };
    var moveAccount = function(xaccount) {
        var accountName = xaccount.getElement('form').account.value.toLowerCase();
        if ($('accounts').getChildren().every(function(account) {
            if(account == xaccount) return true;//skip ourselves
            if(accountName < account.getElement('form').account.value.toLowerCase()) {
                xaccount.inject(account,'before');
                return false;
            }
            return true;
        })) {
            xaccount.inject($('accounts'),'bottom');
        }
        redoOddEven();
    };
    var resetFocus = function() {
        this.focus();
    };
    var shome ; //selector for default home account
    var sextn ; //selector for default extn account
    var selectionInsert = function(selector,optionValue) {
        var newOption = new Element('option',{'text':optionValue});
        var lower = optionValue.toLowerCase();
        if(selector.getChildren().every(function(option) {
            if(option.value.toLowerCase() > lower) {
                newOption.inject(option,'before');
                return false;
            }
            return true;
        })) {
             newOption.inject(shome,'bottom');                                
        };
    };
    var selectionRemove = function(selector,optionValue) {
        selector.getChildren().every(function(option) {
            if(option.value == optionValue) {
                option.dispose();
                return false;
            }
            return true;
        });
    };
    return {
        Account: function () {
            shome = $('startaccounts').homeaccount;
            sextn = $('startaccounts').extnaccount;
            shome.addEvent('change',function(){changestart(this);});
            sextn.addEvent('change',function(){changestart(this);});
            $('addaccount').addEvent('click', function(e) {
                e.stop();
                var accountName = $('newaccount').account.value;
                if ( accountName == '') {
                    alert("This account name should not be blank, a new account is not being created");
                    resetFocus.delay(10,$('newaccount').account);
                } else {
                    if(nameUnique(accountName,null)) {
                        request.callRequest('newaccount.php',$('newaccount'),$('newaccount'), function(holder) {
                            this.account.value = ''; //blank the new account name
                            this.currency.selectedIndex = 0; // and selections to default
                            this.domain.value = '';
                            var xaccount = holder.getElement('.xaccount');
                            moveAccount(xaccount);
                            addAccountEvents(xaccount);
                            //Add account into default account selectors

                            selectionInsert(shome,accountName);

                            selectionInsert(sextn,accountName);
                        });
                    } else {
                        alert("Account name is not unique, please alter until it is");
                        resetFocus.delay(10,$('newaccount').account);
                    }
                }
            }).addEvent('keydown', function(e) {
                if(e.key == "enter"){
                    this.fireEvent('click',e);
                }
            });
            $('accounts').getChildren().each(addAccountEvents);
        }
    }
}();
