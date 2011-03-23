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
    var request = new Utils.Queue('accounting.php');
    var myDomain;
    var myStart;
    var myEnd;
    function codeshrink(e) {
        e.stop();
        this.removeClass('shrink');
        this.removeEvent('click',codeshrink);
        this.getParent().getNext().destroy();
        this.addEvent('click',codeexpand);
        this.addClass('expand');
    };
    function codeexpand(e) {
        e.stop();
        this.removeEvent('click',codeexpand);
        this.removeClass('expand');
        this.addClass('spinner');
        var domainsel = $('domainsel');
        var yearsel = $('yearsel');
        request.callRequest(
            'getCodeXactions.php',
            {
            	'domain':myDomain,
                'code':this.getElement('input').value,
                'start':myStart,
                'end':myEnd
            },
            this,
            function(holder) {
                this.removeClass('spinner');
                var xactions = holder.getFirst();
                xactions.inject(this.getParent(),'after');
                Utils.dateAdjust(xactions,'dateawait','dateconvert');
                xactions.getChildren().each(function(xaction) {
                    var tac =xaction.getElement('.taccount');
                    xaction.getElement('.aamount').addEvents({
                        'mouseenter':function(e) {
                            tac.removeClass('hidden');
                        },
                        'mouseleave':function(e) {
                            tac.addClass('hidden');
                        }
                    });
                });
                this.addEvent('click',codeshrink);
                this.addClass('shrink');
            }
        );
    };
    return {
        Reports: function (domain,start,end) {
        	myDomain = domain;
        	myStart = start;
        	myEnd = end;
// Now provide for jumping to new account when the select list changes
            document.id('yearsel').addEvent('change',function(e) {
                e.stop();
                document.id('selections').submit();
            });
            $$('.expand').addEvent('click', codeexpand);
        }
    }
}();
