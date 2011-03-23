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
    var request = new Utils.Queue('currency.php');
    var sorting;
    var defcurrency = function() {
        document.id('currencyselector').addEvent('change', function(e) {
            var container = document.id('updefcurrency');
            e.stop();
            container.addClass('spinner');
            request.callRequest(
                'updatedefcur.php',
                {
                    'version':container.getElement('input[name=version]').value,
                    'currency': document.id('currencyselector').value
                },
                this,
                function (holder) {
                    container.removeClass('spinner');
                    container.set('html',holder.getElement('selector').get('html'));
                    document.id('defaultcurrency').empty();
                    document.id('defaultcurrency').set('html',holder.getElement('defaultcurrency').get('html'));
                    var currencies = holder.getElement('currencies');
                    document.id('topcurrencies').empty();
                    document.id('topcurrencies').set('html',currencies.get('html'));
                    defcurrency(); //Set myself up all over again
                    topcurrencies();
                }
            );
            container.empty();
        });
    };
    var topcurrencies = function() {
        sorting = new Sortables(document.id('topcurrencies'),{
            clone:true,
            opacity:0.5, 
            revert: { duration: 500, transition: 'elastic:out' },
            onComplete: function(currency) {
                var prev = currency.getPrevious();
                var oldpriority = currency.getElement('input[name=priority]').value.toInt();
                var priority = (prev)?prev.getElement('input[name=priority]').value.toInt():0;
                var newpriority = (oldpriority < priority)? priority: priority+1;
                if (newpriority != oldpriority) {
                    request.callRequest(
                        'sortcurrency.php',{
                            'currency':currency.getElement('.currency').get('text'),
                            'oldpriority':oldpriority,
                            'newpriority':newpriority,
                            'version':currency.getElement('input[name=version]').value
                        },
                        this,
                        function (holder) {
                            var select = document.id('currencyselector');
                            var options = holder.getElement('selectoptions').get('html');
                            var newoptions = options.replace(/<select>([\s\S]*?)<\/select>/gi,'$1')
                            select.set('html',newoptions);
                            document.id('topcurrencies').removeClass('spinner').set('html',holder.getElement('currencies').get('html')); 
                            topcurrencies(); //Set myself up all over again
                        }
                    );
                    document.id('topcurrencies').empty().addClass('spinner');
                }
            }

        });
        document.id('topcurrencies').getChildren().each(showClick);            
    };
    var showClick = function(currency) {
        currency.getElement('input[name=show]').addEvent('change', function(e) {
            e.stop();
            /* We may have moved to the other list since setting this event up, so
               we need to find out if our parent is #othercurrencies or not to decide whether we
               are now showing or not */
            var show = (currency.getParent() == document.id('othercurrencies'))
            if(!show) sorting.removeItems(currency);
            request.callRequest(
                'updateshowcur.php',
                {
                    'version':currency.getElement('input[name=version]').value,
                    'currency':currency.getElement('.currency').get('text'),
                    'priority':document.id('maxpriority').value.toInt(),
                    'show':show
                },
                this,
                function (holder) {
                    var show = holder.getElement('show');
                    var currency = show.get('currency');
                    var status = show.get('status');
                    var priority = show.get('priority').toInt();
                    var version = show.get('version');
                    var description;
                    var thisEl = null;
                    var checkbox;
                    if(status == 'show') { 
                        document.id('othercurrencies').getChildren().every(function(el) {
                            if (el.getElement('.currency').get('text') == currency) {
                                thisEl = el;
                                return false;
                            }
                            el.toggleClass('even');  //Until we find it, classes must toggle because we are inserting it above here
                            return true;
                        });
                        /*We need to make the rows appear odd or even.  Since we are inserting this at the bottom, 
                          we know it will be the same as priority */
                        if (priority%2 == 0) {
                            thisEl.removeClass('even');
                        } else {
                            thisEl.addClass('even');
                        }
                        new Element('option',{
                            'title':thisEl.getElement('.description'),
                            'value':currency,'text':currency
                        }).inject(document.id('currencyselector'),'bottom');
                        thisEl.inject(document.id('topcurrencies'),'bottom'); //move into top currencies
                        thisEl.getElement('input[name=priority]').value=priority;
                        document.id('maxpriority').value = priority+1;
                        thisEl.getElement('.rate').removeClass('hidden');
                        checkbox = thisEl.getElement('input[name=show]');
                        checkbox.checked = 'checked';
                        sorting.addItems(thisEl);
                    } else {
                        document.id('currencyselector').getElement('option[value='+currency+']').destroy();
                         document.id('topcurrencies').getChildren().each(function(el) {
                            if (thisEl) {
                                el.toggleClass('even'); //if we found it, we must toggle because its moving out and down
                                //also lower its priority
                                el.getElement('input[name=priority]').value = el.getElement('input[name=priority]').value.toInt() -1 ;
                            } else {
                                if (el.getElement('.currency').get('text') == currency) thisEl = el;
                            }
                        });
                        thisEl.getElement('input[name=priority]').value=1000;
                        thisEl.getElement('.rate').addClass('hidden');
                        var marker = null;
                        var evenClass = (priority%2 == 0); //Max even, but will become odd when I remove one, so if I am first, I will be even
                        if (document.id('othercurrencies').getChildren().every(function(el) {
                            if (el.getElement('.currency').get('text') > currency) {
                                marker = el;
                                return false;
                            }
                            evenClass = el.hasClass('even');
                            el.toggleClass('even');
                            return true;
                        })) {
                            thisEl.inject(document.id('othercurrencies'),'bottom');
                        } else {
                            thisEl.inject(marker,'before');
                        }
                        thisEl.removeClass('even');
                        if(evenClass) thisEl.addClass('even');
                        document.id('maxpriority').value = priority-1;
                        
                        checkbox = thisEl.getElement('input[name=show]');
                        checkbox.checked = '';
                    }
                    thisEl.getElement('input[name=version]').value = version;
                }
            ); 
        });

    };
    return {
        Currency: function () {
            defcurrency();  //deal with default currency selection and the ramifications 
            topcurrencies(); //deal with managing the top currencyies
            document.id('othercurrencies').getChildren().each(showClick);            
        }
    }
}();
