/*
 	Copyright (c) 2010 Alan Chandler
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
    var request = new Utils.Queue('users.php');
    var updateUser = function(xuser){
        var form = xuser.getElement('form');
        var params = form.clone();
        if(form.passwd.value != '') params.passwd.value = hex_md5(form.passwd.value);
        request.callRequest(
        	'updateuser.php',
        	{
        		'uid':form.uid.value,
        		'version':form.version.value,
        		'user':form.user.value.toLowerCase(),
        		'passwd':(form.passwd.value != '')?hex_md5(form.passwd.value):'',
        		'domains': selectedDomains(form),
        		'account':form.account.options[form.account.selectedIndex].value,
        		'domain': form.domain.options[form.domain.selectedIndex].value,
        		'admin':(form.admin.checked)?'yes':'no'  		
        	},
        	form,
        	function(holder) {
		        this.version.value = holder.getElement('user').get('version');
		        this.original.value = this.user.value; //store the updated name as the new original name
		        this.passwd.value = ''; //clear password field - we don't keep a value here.
	        }
	    );
    };
    var nameUnique = function(userName,xuser) {
    	var lun = userName.toLowerCase();
        return $('users').getChildren().every(function(user) {
            if( user != xuser) {
                if (lun == user.getElement('form').user.value.toLowerCase()) return false;
            }
            return true;
        });
    };
    //adds the events related to a user to it
    var addUserEvents = function (xuser) {
        var form = xuser.getElement('form');
    	var domainOptions = $A(form.domains.options);
        form.user.addEvent('blur',function(e) {
            e.stop();
            if(this.value.toLowerCase() != form.original.value) {//Only worry if the value is different from the original value
                if(this.value != '') {
                    if(nameUnique(this.value,xuser)) {
                        updateUser(xuser);
                        moveUser(xuser);
                    } else {
                        alert("User name is not unique, please alter until it is");
                        resetFocus.delay(10,this);
                    }
                } else {
                    alert("You cannot change the user name to blank, it will be set back to the original value")
                    this.value = form.original.value;
                    resetFocus.delay(10,this);
                }
            }
        });
        form.passwd.addEvent('blur',function(e) {
        	e.stop();
        	if(this.value != '') updateUser(xuser);//Only process non blank passwords
        });
        form.account.addEvent('change', function() {
            updateUser(xuser);
        });
        form.domain.addEvent('change', function() {
            updateUser(xuser);
        });
        form.admin.addEvent('change', function(e) {
        	if(this.checked) {
        		form.domains.disabled = true;
            	$A(form.account.options).each(function(option){option.disabled = false});
            	$A(form.domain.options).each(function(option){option.disabled = false});
        	} else {
        		form.domains.disabled = false;
	    		//if at least one option is selected then leave it like it is, otherwise select everything
	            if (domainOptions.every(function(option) {return !option.selected})) {
	            	domainOptions.each(function(option) {option.selected = true});
	            	$A(form.account.options).each(function(option){option.disabled = false});
	            	$A(form.domain.options).each(function(option){option.disabled = false});
	            } else {
	            	matchSelectionsToDomains(form);
	            }
        	}
        	updateUser(xuser);
        });
        domainOptions.each(function(option){
        	option.addEvent('click',function(e) {
        		e.stop();
        		var allUnSelected = false;
        		if(!this.selected) {//if not selected check if now all are not selected - in which case enable again
        			allUnSelected = domainOptions.every(function(option) {return !option.selected;});
					if (allUnSelected) this.selected = true;
				}
				if(!allUnSelected) updateUser(xuser);

			}).addEvent('keydown', function(e) {
	            if(e.key == "enter"){
	                this.fireEvent('click',e);
	            }
		    });
		});
		if(form.uid.value != 1) {//uid 1 cannot be deleted          	
		    xuser.getElement('a.button').addEvent('click', function(e) {
		        e.stop();
		        if(confirm('Are you sure you wish to delete this ('+form.original.value+') user?')) {
		            request.callRequest('deleteuser.php',form,xuser,function(holder) {
		                xuser.destroy();
		                redoOddEven();
		            });
		        }
		    }).addEvent('keydown', function(e) {
		        if(e.key == "enter"){
		            this.fireEvent('click',e);
		        }
		    });
		}
    };
    var redoOddEven = function() {
    	var tabCount = 8; //skips over new
        $('users').getChildren().each(function(user,i) {
            if(i%2!=0) {
                user.addClass('even');
            } else {
                user.removeClass('even');
            }
            var form = user.getElement('form');
            form.user.set('tabindex',tabCount++);
            form.passwd.set('tabindex',tabCount++);
            form.domains.set('tabindex',tabCount++);
            form.account.set('tabindex',tabCount++);
            form.domain.set('tabindex',tabCount++);
            form.admin.set('tabindex',tabCount++);
            if(form.uid.value != 1) { //skip uid 1
	            user.getElement('a').set('tabindex',tabCount++);
	        }
        });
    };
    var moveUser = function(xuser) {
        var userName = xuser.getElement('form').user.value.toLowerCase();
        if ($('users').getChildren().every(function(user) {
            if(user == xuser) return true;//skip ourselves
            if(userName < user.getElement('form').user.value.toLowerCase()) { //look at user name
                xuser.inject(user,'before');
                return false;
            }
            return true;
        })) {
            xuser.inject($('users'),'bottom');
        }
        redoOddEven();
    };
    var resetFocus = function() {
        this.focus();
    };
    var selectedDomains = function(form) {
    	var sd = new Array();
    	$A(form.domains.options).each(function(option){if (option.selected) sd.push(option.value)});
    	return sd;
    };
    
    var matchSelectionsToDomains = function(form) {
    	$A(form.account.options).each(function(option,i) {
			if(i !=0) {
				var domain = option.getProperty("domain");
				if(selectedDomains(form).contains(domain)) {
    				option.disabled = false;
				} else {
					option.disabled = true;
					if(option.selected) {
						option.selected = false
						form.account.selectedIndex = 0;
					}
				}
			}
    	});
    	$A(form.domain.options).each(function(option,i) {
    		if(i != 0) {
				if(selectedDomains(form).contains(option.value)) {
					option.disabled = false;
				} else {
					option.disabled = true;
					if(option.selected) {
						form.domain.selectedIndex = 0;
					}
				}
			}
    	});
    }
    return {
        User: function () {
            var form = $('newuser');
    		var domainOptions = $A(form.domains.options);
            $('adduser').addEvent('click', function(e) {
                e.stop();
                var userName = form.user.value.toLowerCase();
                var passWord = form.passwd.value;
                if ( userName == '' || passWord == '') {
                    alert("This user name and password should not be blank, a new user is not being created");
                    resetFocus.delay(10,$('newuser').user);
                } else {
                    if(nameUnique(userName,null)) {
	                    request.callRequest(
	                    	'newuser.php',
	                    	{
	                    		'user':userName,
	                    		'passwd':hex_md5(passWord),
	                    		'domains': selectedDomains(form),
	                    		'account':form.account.options[form.account.selectedIndex].value,
	                    		'domain': form.domain.options[form.domain.selectedIndex].value,
	                    		'admin':(form.admin.checked)?'yes':'no'
	                    	},
	                    	$('newuser'), 
	                    	function(holder) {
			                    this.user.value = ''; //blank the new user name
			                    this.passwd.value = '';
								$A(this.domains.options).each(function(option) {
									option.selected = true;
								});
						
								this.domains.disabled = false;
			                    this.account.selectedIndex = 0; // and selections to default
			                    this.domain.selectedIndex = 0;
			                    this.admin.checked = false;
			                    var xuser = holder.getElement('.xuser');
			                    moveUser(xuser);
			                    addUserEvents(xuser);
	                    	}
	                    );
                    } else {
                        alert("User name is not unique, please alter until it is");
                        resetFocus.delay(10,$('newuser').user);
                    }
                }
            }).addEvent('keydown', function(e) {
                if(e.key == "enter"){
                    this.fireEvent('click',e);
                }
            });
            form.admin.addEvent('change',function(e){
            	e.stop();
            	if(this.checked) {
            		form.domains.disabled = true;
		        	$A(form.account.options).each(function(option){
		        		option.disabled = false;
		        	});
		        	$A(form.domain.options).each(function(option){
		        		option.disabled = false;
		        	});
            	} else {
            		form.domains.disabled = false;
		    		//if at least one option is selected then leave it like it is, otherwise select everything
		            if (domainOptions.every(function(option) {return !option.selected})) {
		            	domainOptions.each(function(option) {option.selected = true});
			        	$A(form.account.options).each(function(option){option.disabled = false});
			        	$A(form.domain.options).each(function(option){option.disabled = false});
			        } else {
			        	matchSelectionsToDomains(form);
			        }
            	}
            });
            domainOptions.each(function(option){
            	option.addEvent('click',function(e) {
            		if(!this.selected) {//if not selected check if now all are not selected - in which case enable again
  						if (domainOptions.every(function(option) {return !option.selected;})) {
  							this.selected = true;
  						} else {
  							matchSelectionsToDomains(form);
  						}
  					} else {
  						matchSelectionsToDomains(form);
  					}
  				}).addEvent('keydown', function(e) {
		            if(e.key == "enter"){
		                this.fireEvent('click',e);
		            }
		        });
  			});          	
            $('users').getChildren().each(addUserEvents);
        }
    }
}();
