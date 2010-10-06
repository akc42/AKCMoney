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
    var request = new Utils.Queue('domains.php');
    var updateDomain = function(xdomain){
        var form = xdomain.getElement('form');
        request.callRequest('updatedomain.php',form,form, function(holder) {
            this.version.value = holder.getElement('domain').get('version');
            this.original.value = this.domain.value; //store the updated name as the new original name
        });
    };
    var nameUnique = function(domainName,xdomain) {
        return $('domains').getChildren().every(function(domain) {
            if( domain != xdomain) {
                if (domainName == domain.getElement('form').domain.value) return false;
            }
            return true;
        });
    };
    //adds the events related to an domain to it
    var addDomainEvents = function (xdomain) {
        var form = xdomain.getElement('form');
        form.domain.addEvent('blur',function(e) {
            e.stop();
            if(this.value != form.original.value) {//Only worry if the value is different from the original value
                if(this.value != '') {
                    if(nameUnique(this.value,xdomain)) {
                        var originalName = form.original.value;
                        var newName = this.value;
                        updateDomain(xdomain);
                        moveDomain(xdomain);
                    } else {
                        alert("Domain name is not unique, please alter until it is");
                        resetFocus.delay(10,this);
                    }
                } else {
                    alert("You cannot change the domain name to blank, it will be set back to the original value")
                    this.value = form.original.value;
                    resetFocus.delay(10,this);
                }
            }
        });
        form.description.addEvent('blur',function(e) {
        	updateDomain(xdomain);
        });
        
        xdomain.getElement('a.button').addEvent('click', function(e) {
            e.stop();
            if(confirm('Are you sure you wish to delete this ('+form.original.value+') domain?')) {
                request.callRequest('deletedomain.php',form,xdomain,function(holder) {
                    xdomain.destroy();
                    redoOddEven();
                });
            }
        }).addEvent('keydown', function(e) {
            if(e.key == "enter"){
                this.fireEvent('click',e);
            }
        });
    };
    var redoOddEven = function() {
    	var tabCount = 4; //skips over new
        $('domains').getChildren().each(function(domain,i) {
            if(i%2!=0) {
                domain.addClass('even');
            } else {
                domain.removeClass('even');
            }
            var form = domain.getElement('form');
            form.domain.set('tabindex',tabCount++);
            form.description.set('tabindex',tabCount++);
            domain.getElement('a').set('tabindex',tabCount++);
        });
    };
    var moveDomain = function(xdomain) {
        var domainName = xdomain.getElement('form').domain.value.toLowerCase();
        if ($('domains').getChildren().every(function(domain) {
            if(domain == xdomain) return true;//skip ourselves
            var domainForm = domain.getElement('form');
            if(domainName < domainForm.domain.value.toLowerCase()) { //Domain is same - so now look at domain name
                xdomain.inject(domain,'before');
                return false;
            }
            return true;
        })) {
            xdomain.inject($('domains'),'bottom');
        }
        redoOddEven();
    };
    var resetFocus = function() {
        this.focus();
    };
    return {
        Domain: function () {
            $('adddomain').addEvent('click', function(e) {
                e.stop();
                var domainName = $('newdomain').domain.value;
                if ( domainName == '') {
                    alert("This domain name should not be blank, a new domain is not being created");
                    resetFocus.delay(10,$('newdomain').domain);
                } else {
                    if(nameUnique(domainName,null)) {
                        request.callRequest('newdomain.php',$('newdomain'),$('newdomain'), function(holder) {
                            this.domain.value = ''; //blank the new domain name
                            this.description.value = '';
                            var xdomain = holder.getElement('.xdomain');
                            moveDomain(xdomain);
                            addDomainEvents(xdomain);
                        });
                    } else {
                        alert("domain name is not unique, please alter until it is");
                        resetFocus.delay(10,$('newdomain').domain);
                    }
                }
            }).addEvent('keydown', function(e) {
                if(e.key == "enter"){
                    this.fireEvent('click',e);
                }
            });
            $('domains').getChildren().each(addDomainEvents);
        }
    }
}();
