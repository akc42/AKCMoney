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
    var request = new Utils.Queue('codes.php');
    var updateCode = function(xcode){
        var form = xcode.getElement('form');
        request.callRequest('updatecode.php',form,form, function(holder) {
        	this.original.value = this.description.value;
            this.version.value = holder.getElement('code').get('version');
        });
    };
    //adds the events related to an code to it
    var addCodeEvents = function (xcode) {
        var form = xcode.getElement('form');
        form.description.addEvent('blur',function(e) {
            e.stop();
            if(this.value != form.original.value) {//Only worry if the value is different from the original value
                if(this.value != '') {
                    updateCode(xcode);
                    moveCode(xcode);
                } else {
                    alert("You cannot change the code description to blank, it will be set back to the original value")
                    this.value = form.original.value;
                    resetFocus.delay(10,this);
                }
            }
        });
        form.codetype.addEvent('change',function(e) {
        	e.stop();
        	updateCode(xcode);
        	moveCode(xcode);
        });
        
        xcode.getElement('a.button').addEvent('click', function(e) {
            e.stop();
            if(confirm('Are you sure you wish to delete this ('+form.original.value+') code?')) {
                request.callRequest('deletecode.php',form,xcode,function(holder) {
                    xcode.destroy();
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
        $('codes').getChildren().each(function(code,i) {
            if(i%2!=0) {
                code.addClass('even');
            } else {
                code.removeClass('even');
            }
            var form = code.getElement('form');
            form.description.set('tabindex',tabCount++);
            form.codetype.set('tabindex',tabCount++);
            code.getElement('a').set('tabindex',tabCount++);
        });
    };
    var moveCode = function(xcode) {
        var codeName = xcode.getElement('form').description.value.toLowerCase();
        var codeType = xcode.getElement('form').codetype.value.toLowerCase();
        if ($('codes').getChildren().every(function(code) {
            if(code == xcode) return true;//skip ourselves
            var codeForm = code.getElement('form');


            var thisCodetype = codeForm.codetype.value.toLowerCase();
            if(codeType > thisCodetype) return true;  //Not interested if codetype is beyond this
            if(codeType < thisCodetype) {
            	xcode.inject(code,'before'); //Goes here if codetype is less
            	return false;
            }
            if(codeName < codeForm.description.value.toLowerCase()) { 
                xcode.inject(code,'before');
                return false;
            }
            return true;
        })) {
            xcode.inject($('codes'),'bottom');
        }
        redoOddEven();
    };
    var resetFocus = function() {
        this.focus();
    };
    return {
        Code: function () {
            $('addcode').addEvent('click', function(e) {
                e.stop();
                var codeName = $('newcode').description.value;
                if ( codeName == '') {
                    alert("This code description should not be blank, a new code is not being created");
                    resetFocus.delay(10,$('newcode').code);
                } else {
                    request.callRequest('newcode.php',$('newcode'),$('newcode'), function(holder) {
                        this.description.value = '';
                        var xcode = holder.getElement('.xcode');
                        moveCode(xcode);
                        addCodeEvents(xcode);
                    });
                }
            }).addEvent('keydown', function(e) {
                if(e.key == "enter"){
                    this.fireEvent('click',e);
                }
            });
            $('codes').getChildren().each(addCodeEvents);
        }
    }
}();
