// Calendar: a Javascript Module for Mootools that adds accessible and unobtrusive date pickers to your form input hidden elements 
// Derived from <http://electricprism.com/aeron/calendar> Calendar RC4, Copyright (c) 2007 Aeron Glemann <http://electricprism.com/aeron>, MIT Style License
//
/*	Copyright (c) 2008,2009 Alan Chandler
*	see COPYING.txt in this directory for more details
*/

Calendar = function() {
	var calendarloaded = false;
	var calrequested = false;
	var url;
	var scripts = document.getElements('script');
	scripts.every(function(script) {
		var u = script.src.substr(script.src.length - 11);
		if (u === 'calendar.js') {
			url = script.src.substr(0, script.src.length - 2) + 'html';
			return false;
		}
		return true;
	});
	var calcopy = new Element('div');
	var calqueue = new Chain();
	var calendar = function(bind,callback) {
		var calling = callback.bind(bind);
		function doCallback() {
			calling(calcopy.clone(true,true));
		}
		if (calendarloaded) {
			calling(calcopy.clone(true,true));
			calqueue.callChain();
			return true;
		}
		if(!calrequested) {
			var req = new Request({
				url:url,
				onSuccess:function(html) {
					calcopy.set('html',html);
					calendarloaded = true;
					calqueue.callChain();
				},
				onFailure: function(xhr) {
				    var i = 0;
				}
			});
			req.get();
			calrequested = true;
		}
		calqueue.chain(doCallback);
		return false;
	}


	return {
		Single: new Class({
			Implements: [Events, Options],
			options: {
				classes: [],
				// ['calendar', 'prev', 'next', 'month', 'year', 'today', 'invalid', 'valid', 'inactive', 'active', 'hover', 'hilite']
				days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				// days of the week starting at sunday
				draggable: true,
				end: new Date(Date.UTC(2999, 11, 31,23,59,59,999)),
				// null maans current time
				format: 'd-M-y',
				months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				offset: 0,
				// first day of the week: 0 = sunday, 1 = monday, etc..
				onHideStart: Class.empty,
				onHideComplete: Class.empty,
				onShowStart: Class.empty,
				onShowComplete: Class.empty,
				onUpdate: Class.empty,
				start: new Date(Date.UTC(1000, 0, 1)),
				// null means current time
				tweak: {
					x: 8,
					y: -180
				}, // tweak calendar positioning
				width:'70px'		//Correct width for formating, but if this is changed width will have to change.
	
			},
			initialize: function(input, options) {
				var keys;
				var values;
				var div;
				this.setOptions(options);
				//Basic validation
				if (typeOf(input) != 'element') return false;
				if (input.get('tag') != 'input') return false;
				if (input.type != 'hidden') return false;
				this.input = input;
				if (input.value === '') {
					this.input.value = '0';
				}
				// initialise where we are going to display the calender when it starts
				// create our classes array
				keys = ['calendar', 'picker', 'prev', 'next','nav', 'month', 'year', 'today',
				        'invalid', 'valid', 'inactive', 'active', 'hover', 'hilite'];
				values = keys.map(function(key, i) {
					if (this.options.classes[i]) {
						if (this.options.classes[i].length) {
							key = this.options.classes[i];
						}
					}
					return key;
				},this);
				this.options.classes = values.associate(keys);

				div = input.getParent();
				this.button = new Element('button', {'type': 'button','class': this.options.classes.calendar}).inject(div);
				this.span = new Element('span', {'class':this.options.classes.calendar}).inject(div);
				this.visible = false;

				// create cal element with css styles required for proper cal functioning
				this.picker = new Element('div', {
					'styles': {
						left: '-1000px',
						opacity: 0,
						position: 'absolute',
						top: '-1000px',
						zIndex: 1000
					}
				}).addClass(this.options.classes.picker).inject(document.body);

				// iex 6 needs a transparent iframe underneath the calendar in order to not allow select elements to render through
				if (window.ie6) {
					this.iframe = new Element('iframe', {
						'styles': {
							left: '-1000px',
							position: 'absolute',
							top: '-1000px',
							zIndex: 999
						}
					}).inject(document.body);
					this.iframe.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)';
				}

				// initialize fade method
				this.fx = new Fx.Tween(this.picker, {
					onStart: function() {
						if (this.picker.getStyle('opacity') == 0) { // show
							if (window.ie6) {
								this.iframe.setStyle('display', 'block');
							}
							this.picker.setStyle('display', 'block');
							this.fireEvent('showStart', this);
						} else { // hide
							this.fireEvent('hideStart', this);
						}
					}.bind(this),
					onComplete: function() {
						if (this.picker.getStyle('opacity') == 0) { // hidden
							this.picker.setStyle('display', 'none');
							if (window.ie6) {
								this.iframe.setStyle('display', 'none');
							}
							this.fireEvent('hideComplete', this);
						} else { // shown
							this.fireEvent('showComplete', this);
						}
					}.bind(this)
				});

				// initialize drag method
				if (this.options.draggable) {
					this.drag = new Drag.Move(this.picker, {
						onDrag: function() {
							if (window.ie6) {
								this.iframe.setStyles({
									left: this.calendar.style.left,
									top: this.calendar.style.top
								});
							}
						}.bind(this)
					});
				}
				
				// set start and end dates (which might adjust the input.value
				this.setStart(this.options.start);
				this.setEnd(this.options.end);
				this.resetVal();
				this.picker.empty();

				calendar(this,function(picker) {
					var size;
					var coord;
					var x,y;
					var table;
					var navs;
					var i;
					var firsthr,firstmi,secondhr,secondmi;
					var that = this;
					picker.inject(this.picker);
					this.button.addEvent('click',function(e) {
						e.stop();
						that.toggle();
					});
					size = window.getScrollSize();
					coord = this.button.getCoordinates();
					x = coord.right + this.options.tweak.x;
					y = coord.top + this.options.tweak.y;

					// make sure the calendar doesn't open off screen
					if (!this.picker.coord) this.picker.coord = this.picker.getCoordinates();

					if (x + this.picker.coord.width > size.x) x -= (x + this.picker.coord.width - size.x);
					if (y + this.picker.coord.height > size.y)  y -= (y + this.picker.coord.height - size.y);

					this.picker.setStyles({ left: x + 'px', top: y + 'px' });

					if (window.ie6) {
						this.iframe.setStyles({ height: this.picker.coord.height + 'px', left: x + 'px', top: y + 'px', width: this.picker.coord.width + 'px' });
					}


					// heading of the day columns
					table=picker.getElement('table');
					table.getElements('th').each(function(el,i) {
						var title = this.options.days[(i + this.options.offset) % 7];
						el.empty(); //clear out marker info
						el.appendText(title.substr(0,1));
						el.set('title',title);
						el.getNext();
					},this);

					//get all key elements and save them
					navs = picker.getElements('.'+this.options.classes.prev);
					navs.each(function(nav) {
					//see if it is a year navigation
						if(nav.hasClass(this.options.classes.nav)) {
							this.navprevyear = nav;
							nav.removeClass(this.options.classes.nav);
						} else {
							this.navprevmonth = nav;
						}
						nav.removeClass(this.options.classes.prev);
					},this);

					navs = picker.getElements('.'+this.options.classes.next);
					navs.each(function(nav) {
					//see if it is a year navigation
						if(nav.hasClass(this.options.classes.nav)) {
							this.navnextyear = nav;
							nav.removeClass(this.options.classes.nav);
						} else {
							this.navnextmonth = nav;
						}
						nav.removeClass(this.options.classes.next);
					},this);

					this.days = table.getElements('td'); //me need to set up the actual details dynamically
				});

			},
			resetVal: function() {
				var d = new Date();
				d.setTime(this.input.value.toInt()*1000);
				this.date = d.getDate(); // 1 - 31
				// Also need to format this date in the span
				this.span.set('text', this.format(d));	
				this.month = d.getMonth(); // 0 - 11
				this.year = d.getFullYear(); // 19xx - 20xx				
			},
			setVal: function() {
				var d = new Date(this.year,this.month,this.date,12,0,0,0);
				if (d < this.getStart()) {
					d=this.getStart();
				} else {
					if (d > this.getEnd()) {
						d = this.getEnd();
					}
				}
				this.input.value = d.getTime() / 1000;
				this.span.set('text', this.format(d));
				this.fireEvent('update');
			},
			getStart: function() {
				return (this.start) ? this.start: new Date();
			},
			setStart: function(start) {
				this.start = (start) ? ((this.options.start) ? (
						(start > this.options.start) ? start: this.options.start) : (start > new Date()) ? start: new Date())
						: ((this.options.start) ? ((this.options.start > new Date()) ? this.options.start: null) : null);
				if (this.input.value.toInt() < this.getStart().getTime() / 1000) {
					this.input.value = this.getStart().getTime() / 1000 ;
				}
			},
			getEnd: function() {
				return (this.end) ? this.end: new Date();
			},
			setEnd: function(end) {
				this.end = (end) ? ((this.options.end) ? (
						(end < this.options.end) ? end: this.options.end) :(end < new Date()) ? end: new Date())
						: ((this.options.end) ? ((this.options.end < new Date()) ? this.options.end: null) : null);
				if (this.input.value.toInt() > this.getEnd().getTime() / 1000) {
					this.input.value = this.getEnd().getTime() / 1000 ;
				}
			},
			toggle: function() {
				if (this.visible) {
					document.removeEvent('mousedown', this.hide); // always remove the current mousedown script first
					this.fx.start('opacity', 1, 0);
					this.visible = false;
				} else {
					document.removeEvent('mousedown', this.hide); // always remove the current mousedown script first
					var that = this;
					this.hide = function(e) {
						var el;

						el = new Event(e).target; //Need to clone the event so that changing el does not effect the original one
			
						while (el !== document.body && el.nodeType === 1) {
							if (el === that.picker || el === that.button ) {
								e.stop;
								return false;
							}
							el = el.parentNode;
						}
						that.toggle();
						return true;
					};

					document.addEvent('mousedown', this.hide);
					this.newMorY();
					this.fx.start('opacity', 0, 1);
					this.visible = true;
				}
			},
			newMorY: function() {
				var offset;
				var i;
				var dates,datee;
				var td;
				var today,d;
				var that = this;
				//put the class of the month (allows different months pictures to be done via css
				this.picker.addClass(this.options.months[this.month].toLowerCase());
								//Now add the navigation
				this.picker.getElement('.month').empty().appendText(this.options.months[this.month]);
				this.picker.getElement('.year').empty().appendText(this.year);
					//see if it is a year navigation
				if(this.navprevyear) {
					this.navprevyear.removeEvents().removeClass(this.options.classes.prev);
					if(this.year !== this.getStart().getFullYear()) {
						this.navprevyear.addClass(this.options.classes.prev).addEvent('click',function(e) {
							e.stop();
							that.year--;
							that.setVal();
							that.newMorY();
						});
					}
				}
				if(this.navnextyear) {
					this.navnextyear.removeEvents().removeClass(this.options.classes.next);
					if(this.year !== this.getEnd().getFullYear()) {
						this.navnextyear.addClass(this.options.classes.next).addEvent('click',function(e) {
							e.stop();
							that.year++;
							that.setVal();
							that.newMorY();
						});
					}
				}

				this.navprevmonth.removeEvents().removeClass(this.options.classes.prev);
				if (this.year !== this.getStart().getFullYear() || this.month !== this.getStart().getMonth()) {
					this.navprevmonth.addEvent('click',function(e) {
						e.stop();
						that.picker.removeClass(that.options.months[that.month].toLowerCase());
						that.month--;
						if(that.month < 0) {
							that.month=11;
							that.year--;
						}
						that.setVal();
						that.newMorY();
					}).addClass(this.options.classes.prev);
				}
				
				this.navnextmonth.removeEvents().removeClass(this.options.classes.next);
				if (this.year !== this.getEnd().getFullYear() || this.month !== this.getEnd().getMonth()) {
					this.navnextmonth.addEvent('click',function(e) {
						e.stop();
						that.picker.removeClass(that.options.months[that.month].toLowerCase());
						that.month++
						if(that.month > 11) {
							that.month=0;
							that.year++;
						}
						that.setVal();
						that.newMorY();
					}).addClass(this.options.classes.next);
				}

				offset = ((new Date(this.year, this.month, 1).getDay() - this.options.offset) + 7) % 7; // day of the week (offset)
				d= new Date();
				if (this.year == d.getFullYear() && this.month == d.getMonth()) {
					today = d.getDate() -1 + offset;
				}
				for ( i = 0; i < 42; i++) { // 1 to 42 (6 x 7 or 6 weeks)
					dates = new Date(this.year,this.month,i-offset+1);
					datee = new Date(dates);
					dates.setHours(0,0,0,0);
					datee.setHours(23,59,59,999);
					td = this.days[i]
					td.empty().appendText(dates.getDate()).removeEvents()
							.removeClass(this.options.classes.valid)
							.removeClass(this.options.classes.invalid)
							.removeClass(this.options.classes.active)
							.removeClass(this.options.classes.today);
					if(this.getStart()>datee) {
						td.addClass(this.options.classes.invalid);
					} else {
						if (this.getEnd() < dates) {
							td.addClass(this.options.classes.invalid);
						} else {
							if(dates.getMonth() === this.month) {
								//CSS should make the most important of these stand out
								td.addClass(this.options.classes.valid);
								if (today === i) td.addClass(this.options.classes.today);
								td.store('i',i);
								if (this.date === i-offset+1) td.addClass(this.options.classes.active);
								td.addEvent('click', function(e) {
									var i;
									e.stop();
									i = this.retrieve('i');
									if (that.date>=0) that.days[that.date-1+offset].removeClass(that.options.classes.active);
									that.date = i-offset+1;
									this.addClass(that.options.classes.active);
									that.setVal();
								});
							}
						}
					}
				}
			},
			format: function(date) {
				var str = '';

				if (date) {
					var j = date.getDate(); // 1 - 31
					var w = date.getDay(); // 0 - 6
					var l = this.options.days[w]; // Sunday - Saturday
					var n = date.getMonth() + 1; // 1 - 12
					var f = this.options.months[n - 1]; // January - December
					var y = date.getFullYear() + ''; // 19xx - 20xx
					var h = date.getHours(); // 0 - 23
					var format = this.options.format;
					var loop;

					for (loop = 0,
					len = format.length; loop < len; loop++) {
						var cha = format.charAt(loop); // format char
						switch (cha) {
							// year cases
						case 'y':
							// xx - xx
							y = y.substr(2);
						case 'Y':
							// 19xx - 20xx
							str += y;
							break;

							// month cases
						case 'm':
							// 01 - 12
							if (n < 10) {
								n = '0' + n;
							}
						case 'n':
							// 1 - 12
							str += n;
							break;
						case 'M':
							// Jan - Dec
							f = f.substr(0, 3);
						case 'F':
							// January - December
							str += f;
							break;

							// day cases
						case 'd':
							// 01 - 31
							if (j < 10) {
								j = '0' + j;
							}
						case 'j':
							// 1 - 31
							str += j;
							break;

						case 'D':
							// Sun - Sat
							l = l.substr(0, 3);
						case 'l':
							// Sunday - Saturday
							str += l;
							break;

						case 'N':
							// 1 - 7
							w += 1;
						case 'w':
							// 0 - 6
							str += w;
							break;

						case 'S':
							// st, nd, rd or th (works well with j)
							if (j % 10 == 1 && j != '11') {
								str += 'st';
							} else if (j % 10 == 2 && j != '12') {
								str += 'nd';
							} else if (j % 10 == 3 && j != '13') {
								str += 'rd';
							} else {
								str += 'th';
							}
							break;
						default:
							str += cha;
						}
					}
				}
			return str; //  return format with values replaced
			},
			destroy: function() {
			    this.picker.destroy();
			    this.input.dispose();
			    this.input.inject(this.button.getParent());
			    this.button.destroy();
			}
		})
	};
} ();
