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
Utils = function () {
    var m_names = ["Jan","Feb","Mar","Apr","May","Jun","Jly","Aug","Sep","Oct","Nov","Dec"];
    var sender = new Request({link:'chain'}); 
    return {
        dateAdjust: function(topel,todoclass,doneclass) {
	        var datespans = topel.getElements('.'+todoclass);
		    datespans.each(function(datespan,i) {
		       	datespan.removeClass(todoclass);
		       	datespan.addClass(doneclass);
		       	var d = datespan.value; //should be a hidden input, so can use .value here
		       	if(d != '' && d !='0') {
	                var myDate = new Date(d.toInt()*1000);
	                var p = datespan.getPrevious();
	                if (p && (p.get('tag') == 'span')) p.destroy();
	                var el = new Element('span',{'text':myDate.getDate() + ' ' + m_names[myDate.getMonth()] 
	                    + ' ' + myDate.getFullYear()}).inject(datespan,'before');
	        	}
		    });
        },
        /* The function below was based on code from 
    The JavaScript Source :: http://javascript.internet.com
    Created by: Francis Cocharrua :: http://scripts.franciscocharrua.com/ */
        selectValueSet:function(el,Name,Value) {
            var selectElement = el.getElement('select[name='+Name+']');
            for(index = 0; index < selectElement.length; index++) {
                if(selectElement[index].value == Value)
                    selectElement.selectedIndex = index;
            }    
        },
        Queue: new Class({
            initialize: function(myURL) {
            	this.pageURL = myURL;
            },
            callRequest:function (myUrl,myParams,bind,myCallback) {
				var that = this;
				var c = myCallback.bind(bind);
				function requestComplete(html) {
					sender.removeEvent('success',requestComplete);
		            var holder = new Element('div').set('html',html);
		            if (holder.getElement('error')) {
		                alert(holder.getElement('error').get('text'));
						window.location = that.pageURL;
		            } else {
		                c(holder);
		            }
		        }
				
				sender.addEvent('success',requestComplete);
				sender.send({url:myUrl,data:myParams,method:'post'});

            }
        })
    }
}();
