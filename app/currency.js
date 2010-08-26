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
        $('currencyselector').addEvent('change', function(e) {
            var container = $('updefcurrency');
            e.stop();
            container.addClass('spinner');
            request.callRequest(
                'updatedefcur.php',
                {
                    'key':Utils.sessionKey,
                    'version':container.getElement('input[name=version]').value,
                    'currency': $('currencyselector').value
                },
                this,
                function (holder) {
                    container.removeClass('spinner');
                    container.set('html',holder.getElement('selector').get('html'));
                    Utils.defaultCurrency = $('currencyselector').value;
                    Utils.dcDescription = $('dc_description').get('text')
                    $('defaultcurrency').empty();
                    $('defaultcurrency').set('html',holder.getElement('defaultcurrency').get('html'));
                    var currencies = holder.getElement('currencies');
                    $('topcurrencies').empty();
                    $('topcurrencies').set('html',currencies.get('html'));
                    defcurrency(); //Set myself up all over again
                    topcurrencies();
                }
            );
            container.empty();
        });
    };
    var topcurrencies = function() {
        sorting = new Sortables($('topcurrencies'),{
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
                            'key':Utils.sessionKey,
                            'currency':currency.getElement('.currency').get('text'),
                            'oldpriority':oldpriority,
                            'newpriority':newpriority,
                            'version':currency.getElement('input[name=version]').value
                        },
                        this,
                        function (holder) {
                            var select = $('currencyselector');
                            var options = holder.getElement('selectoptions').get('html');
                            var newoptions = options.replace(/<select>([\s\S]*?)<\/select>/gi,'$1')
                            select.set('html',newoptions);
                            $('topcurrencies').removeClass('spinner').set('html',holder.getElement('currencies').get('html')); 
                            topcurrencies(); //Set myself up all over again
                        }
                    );
                    $('topcurrencies').empty().addClass('spinner');
                }
            }

        });
        $('topcurrencies').getChildren().each(showClick);            
    };
    var showClick = function(currency) {
        currency.getElement('input[name=show]').addEvent('change', function(e) {
            e.stop();
            /* We may have moved to the other list since setting this event up, so
               we need to find out if our parent is #othercurrencies or not to decide whether we
               are now showing or not */
            var show = (currency.getParent() == $('othercurrencies'))
            if(!show) sorting.removeItems(currency);
            request.callRequest(
                'updateshowcur.php',
                {
                    'key':Utils.sessionKey,
                    'version':currency.getElement('input[name=version]').value,
                    'currency':currency.getElement('.currency').get('text'),
                    'priority':$('maxpriority').value.toInt(),
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
                        $('othercurrencies').getChildren().every(function(el) {
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
                        }).inject($('currencyselector'),'bottom');
                        thisEl.inject($('topcurrencies'),'bottom'); //move into top currencies
                        thisEl.getElement('input[name=priority]').value=priority;
                        $('maxpriority').value = priority+1;
                        thisEl.getElement('.rate').removeClass('hidden');
                        checkbox = thisEl.getElement('input[name=show]');
                        checkbox.checked = 'checked';
                        sorting.addItems(thisEl);
                    } else {
                        $('currencyselector').getElement('option[value='+currency+']').destroy();
                         $('topcurrencies').getChildren().each(function(el) {
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
                        if ($('othercurrencies').getChildren().every(function(el) {
                            if (el.getElement('.currency').get('text') > currency) {
                                marker = el;
                                return false;
                            }
                            evenClass = el.hasClass('even');
                            el.toggleClass('even');
                            return true;
                        })) {
                            thisEl.inject($('othercurrencies'),'bottom');
                        } else {
                            thisEl.inject(marker,'before');
                        }
                        thisEl.removeClass('even');
                        if(evenClass) thisEl.addClass('even');
                        $('maxpriority').value = priority-1;
                        
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
            $('othercurrencies').getChildren().each(showClick);            
        }
    }
}();
