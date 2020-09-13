/*
	NAME: AIM-DRAWER
	AUTHOR: AIM MIKEL;
	DATE: 13 SEP 2020;
	LICENSE: MIT;
*/

(function(root, factory){

	if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
      define(['Drawee'],factory);
  } else if (typeof exports === 'object') {
    // CommonJS
      module.exports = factory;
  } else {
    // Browser globals
    if(typeof Drawee !== 'undefined'){
    	console.error("It seems like you have included Drawee script more than once");
    }else{
			root.Drawee = factory();
    }
  }

}(typeof window !== 'undefined' ? window : this, function(){ 'use strict';

	window.Drawee = {
		name: 'Drawee',
		version : '1.0',
		license: 'MIT',
		Author: 'Michael Aloo',
		Release: 'Apr 14, 2020',
		errored: false
	};

	var Mouse = {
		down: false,
		target: null,
		position : {x:0, y:0},
		downPosition: {x:0, y:0},
		upPosition: {x:0, y:0},
		targetOffset: {x:0, y:0}
	}

	var Pen = {
		color: '#000000',
		size: 3,
		type: 'round',
		elem: document.querySelector('.tool[role="pen"]')
	}

	var Brush = {
		color: '#000000',
		size: 20,
		type: "round",
		elem: document.querySelector('.tool[role="brush"]')
	}

	var Eraser = {
		size: 20,
		elem: document.querySelector('.tool[role="eraser"]')
	}

	var Select = {
		position: {x:10, y:10},
		size: {w:100, h:100},
		rotate: 0,
		elem: document.querySelector('.tool[role="select"]')
	}

	var Rectangle = {
		position: {x:10, y:10},
		size: {w:100, h:100},
		fill: 'none',
		rotate: 0,
		fillColor: '#ffffff',
		strokeWidth: 2,
		strokeColor: '#000000',
		elem: document.querySelector('.tool[role="rectangle"]')
	}

	var Ellipse = {
		position: {x:10, y:10},
		size: {w:100, h:100},
		fill: 'none',
		rotate: 0,
		fillColor: '#ffffff',
		strokeWidth: 2,
		strokeColor: '#000000',
		elem: document.querySelector('.tool[role="ellipse"]')
	}

	var Line = {
		position: {x:10, y:10},
		size: {w:100, h:100},
		width: 2,
		color: '#000000',
		elem: document.querySelector('.tool[role="line"]')
	}

	var Text = {
		position: {x:10, y:10},
		size: {w:200, h:50},
		color: '#000000',
		text: '',
		font: 'arial',
		fontSize: 16,
		elem: document.querySelector('.tool[role="text"]')
	}

	var Picture = {
		position: {x:10, y:10},
		size: {w:100, h:100},
		rotate: 0,
		elem: document.querySelector('.tool[role="picture"]')
	}

	var Elem = {
		document: document,
		board: document.querySelector("#board"),
		canvas: document.querySelector('[role="canvas"]'),
		mouseX: document.querySelector("#mouseX"),
		mouseY: document.querySelector("#mouseY"),
		fill : document.querySelector("#fill"),
		type : document.querySelector("#type"),
		rotate : document.querySelector("#rotate"),
		color : document.querySelector("#color"),
		fontColor : document.querySelector("#fontColor"),
		fillColor : document.querySelector("#fillColor"),
		size : document.querySelector("#size"),
		fontSize : document.querySelector("#fontSize"),
		strokeWidth : document.querySelector("#strokeWidth"),
		strokeColor : document.querySelector("#strokeColor"),
		x : document.querySelector("#x"),
		y : document.querySelector("#y"),
		w : document.querySelector("#w"),
		h : document.querySelector("#h"),
		dragMode : document.querySelector("#dragMode"),
		snapSize : document.querySelector("#snapSize"),
		aspectRatio : document.querySelector("#aspectRatio"),
		textVal : document.querySelectorAll("#text")[0]
	}

	var temp_1 = '<section class="resizer" role="nw"></section> \
				          <section class="resizer" role="ne"></section> \
				          <section class="resizer" role="se"></section> \
				          <section class="resizer" role="sw"></section> \
				          <section class="resizer" role="n"></section> \
				          <section class="resizer" role="e"></section> \
				          <section class="resizer" role="s"></section> \
				          <section class="resizer" role="w"></section>';
	var tool_elem = ['select', 'rectangle', 'ellipse', 'line', 'text', 'picture', 'inner'];
	var cursor_elem = ['pen', 'brush', 'eraser', 'fill'];
	var css_prefix = ['webkit', 'moz', 'ms'];
	var avail_css = typeof document !== 'undefined' ? document.createElement('div').style : {};
	var ctx = Elem.canvas.getContext('2d');
	var activity = 'text';
	var active = Text;
	var dragMode = 'canvas';
	var snapSize = 0;
	var aspectRatio = 0;


	/**
	 * @description Gets all the elements from the DOM with the given selector.
	 * @param {String|DOMElement} elem the string selector to query. Should be a valid CSS selector.
	 * @returns {Array} returns an array containing the resultant elements.
	 */
	function getElem(elem){
		return typeof elem === 'string' ? document.querySelectorAll(elem) : [elem];
	}

	/**
	 * @description Count the length of an element.
	 * @param {*} val the element to get the length from. Should be a valid JS variable like an Array or Object.
	 * @returns {int} the length of the element.
	 */
	function len(val){
		return val.length;
	}

	/**
	 * @description Converts a given value to an Integer.
	 * @param {*} val the number or string to be converted to an Integer.
	 * @returns {int} the whole number integer.
	 */
	function toInt(val){
		if(val == '') return 0;
		return Number(val).toString() !== 'NaN' ? parseInt(val, 10) : 0;
	}

	/**
	 * @description Round off a number based on the snap size.
	 * @param {String} val the number or string to be ronded off.
	 * @returns {Int} the rounded whole number.
	 */
	function snapInt(val){
		let snap = snapSize;
		if(snap > 1){
			return (val - (val % snap) + (((val % snap) >= (snap / 2)) ? snap : 0));
		}else{
			return toInt(val);
		}
	}

	/**
	 * @description Calculate the dimensions from the aspect ratio and returns a list with the modified dimensions based on the aspect ratio.
	 * @param {int} width the width to check against height.
	 * @param {int} height the height to check against width.
	 * @param {int} which the parameter to be modified. 1 = width, 2 = height. Default is 2 (height).
	 * @returns {list} the modified values as a list with first one being width and the later height.
	 */
	function rationedDimes(width, height, which = 2){
		if(aspectRatio <= 0) return [toInt(width), toInt(height)];
		if(which == 1){
			width = height * aspectRatio;
		}else{
			height = width / aspectRatio;
		}
		return [toInt(width), toInt(height)];
	}

	function cssPrefixed(prop){
		if(prop in avail_css) return prop;
		var capProp = prop[0].toUpperCase() + prop.slice(1),
				i = css_prefix.length;
		while(i--){
			prop = css_prefix[i] + capProp;
			if(prop in avail_css) return prop;
		}
	}

	/**
	 * @description Add styles to an element on the DOM or Virtual DOM.
	 * @param {string|DOMElement} elem the element to apply styles to. Can be a string or a DOMElement.
	 * @param {Object|String} styles the styles to apply to the element. Can be an object or a string.
	 * @param {String} val an optional parameter. The value to apply to the style only if the second parameter is a string representing the style attribute.
	 */
	function css(elem, styles, val){
		elem = getElem(elem);
		if(typeof styles === 'string'){
			var tmp = styles;
			styles = {};
			styles[tmp] = val;
		}
		for(var prop in styles){
			for(var i = 0, ii = len(elem); i < ii; i++){
				elem[i].style[cssPrefixed(prop)] = styles[prop];
			}
		}
	}

	/**
	 * @description Gets or Sets the value of an input element.
	 * If the second parameter was not provided and the query result in more than one element,
	 * then the value of the first element is taken and the rest are ignored.
	 * If the second parameter was provided and the query result in more than one element,
	 * then the provided value is applied to all the elements.
	 * @param {String|DOMElement} elem the element to apply or get value from.
	 * @param {String} value the value to apply to the input element.
	 * @returns {String} returns the value of the first resultant element if the second paremeter was never provided.
	 */
	function val(elem, value){
		elem = getElem(elem);
		if(typeof value !== 'undefined'){
			for(var i = 0, ii = len(elem); i < ii; i++){
				elem[i].value = value;
			}
		}else{
			return elem[0].value;
		}
	}

	/**
	 * @description Get or Sets the innerText of an Element.
	 * If the second argument was not provided and the query result in more than one element,
	 * then the inneText of the first element is selected and the rest are ignored.
	 * If the second argument was provided and the query result in more than one element,
	 * then the provided value is applied to all the elements.
	 * @param {String|DOMElement} elem The element to get or set text. This should be a valid CSS selector string or a DOM element.
	 * @param {String} val the value to set as the innerText to the element. If not provided, the function will return the inner text of the first resultant element.
	 * @returns {String} the inner text of the first resultant element if the second parameter was not provied.
	 */
	function text(elem, val){
		let elems = getElem(elem);
		if(typeof val !== 'undefined'){
			for(var i = 0, ii = len(elems); i < ii; i++){
				elems[i].innerText = val;
			}
		}else{
			return elems[0].innerText;
		}
	}

	/**
	 *
	 * @param {String|DOMElement} elem the element ot get or set the innerHTML.
	 * @param {String} val the value to be set as the innerHTML.
	 */
	function html(elem, val){
		elem = getElem(elem);
		if(typeof val !== 'undefined'){
			for(var i = 0, ii = len(elem); i < ii; i++){
				elem[i].innerHTML = val;
			}
		}else{
			return elem[0].innerHTML;
		}
	}

	function append(elem, val){
		let elems = getElem(elem);
		for(var i = 0, ii = len(elems); i < ii; i++){
			if(typeof val === 'string'){
				elems[i].innerHTML = html(elems[i]) + val;
			}else{
				elems[i].appendChild(val);
			}
		}
	}

	/**
	 *
	 * @param {*} elem
	 * @param {*} attr
	 */
	function attr(elem, attr, val){
		elem = getElem(elem);
		if(arguments.length > 2){
			for(var i = 0, ii = len(elem); i < ii; i++){
				elem[i].setAttribute(attr, val);
			}
		}else{
			return elem[0].getAttribute(attr);
		}
	}

	function hasAttr(elem, attr){
		return getElem(elem)[0].getAttribute(attr) !== null ? true : false;
	}

	/**
	 *
	 * @param {*} elem
	 * @param {*} val
	 */
	function hasClass(elem, val){
		elem = getElem(elem);
		return elem[0].getAttribute('class') === null ? false :
			elem[0].getAttribute('class').includes(val) ? true : false;
	}

	/**
	 *
	 * @param {*} elem
	 * @param {*} val
	 */
	function addClass(elem, val){
		elem = getElem(elem);
		for(var i = 0, ii = len(elem); i < ii; i++){
			var init_class = hasAttr(elem[i], 'class') ? elem[i].getAttribute('class') : '';
			elem[i].setAttribute('class', init_class.includes(val) ? init_class : `${init_class.trim()} ${val}`);
		}
	}

	function removeClass(elem, val){
		elem = getElem(elem);
		for(var i = 0, ii = len(elem); i < ii; i++){
			if(hasAttr(elem[i], 'class')){
				var init_class = elem[i].getAttribute('class');
				elem[i].setAttribute('class', init_class.replace(val).trim());
			}
		}
	}

	function on(elem, evt, callback){
		elem = getElem(elem);
		for(var i = 0, ii = len(elem); i < ii; i++){
			elem[i].addEventListener(evt, callback, true);
		}
	}

	function off(elem, evt){
		elem = getElem(elem);
		for(var i = 0, ii = len(elem); i < ii; i++){
			removeEventListener(evt, elem[i]);
		}
	}

	/**
	 *
	 * @param {*} data
	 * @param {*} callback
	 */
	function objectToDataUrl(data, callback){
		data = data.toDataURL('image/png');
		callback(data);
	}

	function canvasToDataURL(canvas, type = 'png', callback){
		if(arguments.length < 3 && typeof type === 'function'){
			callback = type;
			type = 'png';
		}
		let imageURL = canvas.toDataURL(`image/${type}`);
		callback(imageURL);
	}

	/**
	 *
	 * @param {*} canvas
	 * @param {*} props
	 * @param {*} callback
	 */
	function canvasToImage(canvas, props, callback){

	}

	/**
	 *
	 * @param {*} image
	 * @param {*} position
	 * @param {*} size
	 * @param {*} origin
	 * @param {*} rotation
	 */
	function drawImage(image, position, size, origin, rotation){
		ctx.save();
		ctx.transform(position.x, position.y);
		ctx.rotate(rotation);
		ctx.drawImage(image, 0, 0, size.w);
		ctx.restore();
	}

	/**
	 *
	 */
	function clearBoard(){
		ctx.clearRect(0,0, Elem.board.width, Elem.board.height);
	}


	function saveCanvas(){
		let canvas = document.createElement('canvas');
		canvas.width = active.size.w;
		canvas.height = active.size.h;
		let imageData = ctx.getImageData(active.position.x, active.position.y, active.size.w, active.size.h);
		canvas.getContext('2d').putImageData(imageData, 0,0);
		objectToDataUrl(canvas, function(url){
			document.querySelector('#resImg').src = '';
			document.querySelector('#resImg').src = url;
			let link = document.createElement('a');
			link.innerText = "mikel";
			link.href = url;
			link.download = "mikel.png";
			//link.click();
		});
	}



	/**
	 * @description
	 * @returns
	 */
	var set = {

		/**
		 *
		 * @param {*} type
		 */
		typeTo : function typeTo(type){
			active.type = type.toString;
			val(Elem.type, type);
			if(type === 'square'){
				css(active.elem, {borderRadius:'0px'});
			}else{
				css(active.elem, {borderRadius:'100%'});
			}
		},

		/**
		 *
		 * @param {*} color
		 */
		colorTo: function colorTo(color){
			active.color = color;
			val(Elem.color, color);
			css(active.elem, {background: active.color});
		},

		/**
		 *
		 * @param {*} color
		 */
		fontColorTo: function fontColorTo(color){
			active.color = color;
			val(Elem.fontColor, active.color);
			css(Elem.textVal, 'color',  active.color);
		},

		/**
		 *
		 * @param {*} fill
		 */
		fillTo: function fillTo(fill){
			active.fill = fill;
			val(Elem.fill, fill);
			if(fill === 'color'){
				css(active.elem, {background: active.fillColor});
			}else{
				css(active.elem, {background: 'transparent'});
			}
		},

		/**
		 *
		 * @param {*} color
		 */
		fillColorTo: function fillColorTo(color){
			active.fillColor = color;
			val(Elem.fillColor, color)
			if(active.fill === 'color'){
				css(active.elem, {background: active.fillColor});
			}else if(activity === 'fill'){
				css(active.elem, {background: active.fillColor});
			}
		},

		/**
		 *
		 * @param {*} size
		 */
		sizeTo: function sizeTo(size){
			active.size = toInt(size);
			val(Elem.size, size);
			css(active.elem, {width:`${active.size}px`, height:`${active.size}px`});
		},

		/**
		 *
		 * @param {*} size
		 */
		fontSizeTo: function fontSizeTo(size){
			active.fontSize = toInt(size);
			val(Elem.fontSize, size);
			css(Elem.textVal, 'fontSize', `${active.fontSize}px`);
		},

		/**
		 *
		 * @param {*} width
		 */
		strokeWidthTo: function strokeWidthTo(width){
			active.strokeWidth = toInt(width);
			val(Elem.strokeWidth, width);
			css(active.elem, {borderWidth: `${active.strokeWidth}px`});
		},

		/**
		 *
		 * @param {*} color
		 */
		strokeColorTo: function strokeColorTo(color){
			active.strokeColor = color;
			val(Elem.strokeColor, color);
			css(active.elem, {borderColor: active.strokeColor});
		},

		/**
		 *
		 * @param {*} x
		 */
		offsetXTo: function offsetXTo(x){
			x = snapInt(x);
			if(dragMode === 'canvas'){
				if(x + active.size.w <= Elem.canvas.width){
					active.position.x = x;
				}else{
					active.position.x = snapInt(Elem.canvas.width - active.size.w);
				}
			}else{
				active.position.x = x;
			}
			val(Elem.x, active.position.x);
			css(active.elem, {left: `${active.position.x}px`});
		},

		/**
		 *
		 * @param {*} y
		 */
		offsetYTo: function offsetYTo(y){
			y = snapInt(y);
			if(dragMode === 'canvas'){
				if(y + active.size.h <= Elem.canvas.height){
					active.position.y = y;
				}else{
					active.position.y = snapInt(Elem.canvas.height - active.size.h);
				}
			}else{
				active.position.y = y;
			}
			val(Elem.y, active.position.y);
			css(active.elem, {top: `${active.position.y}px`});
		},

		/**
		 *
		 * @param {*} w
		 */
		widthTo: function widthTo(width){
			let [w, h] = rationedDimes(width, active.size.h);
			if(h === active.size.h){
				if(dragMode === 'canvas'){
					if(active.position.x + w <= Elem.canvas.width){
						if(w >= 30){
							active.size.w = w;
						}else{
							active.size.w = 30;
						}
					}else{
						active.size.w = Elem.canvas.width - active.position.x;
					}
				}else{
					active.size.w = w >= 30 ? w : active.size.w;
				}
			}else{
				if(h >= 30 && w >= 30){
					if(dragMode === 'canvas'){
						if((w + active.position.x) <= Elem.canvas.width && (h + active.position.y) <= Elem.canvas.height){
							active.size.w = w;
							this.heightTo(h);
						}
					}else{
						active.size.w = w;
						this.heightTo(h);
					}
				}
			}
			val(Elem.w, active.size.w);
			css(active.elem, {width: `${active.size.w}px`});
		},

		/**
		 *
		 * @param {*} h
		 */
		heightTo: function heightTo(height){
			let [w, h] = rationedDimes(active.size.w, height, 1);
			if(w === active.size.w){
				if(dragMode === 'canvas'){
					if(active.position.y + h <= Elem.canvas.height){
						if(w >= 30){
							active.size.h = h;
						}else{
							active.size.h = 30;
						}
					}else{
						active.size.h = Elem.canvas.height - active.position.y;
					}
				}else{
					active.size.h = h >= 30 ? h : active.size.h;
				}
			}else{
				if(h >= 30 && w >= 30){
					if(dragMode === 'canvas'){
						if((w + active.position.x) <= Elem.canvas.width && (h + active.position.y) <= Elem.canvas.height){
							active.size.h = h;
							this.widthTo(w);
						}
					}else{
						active.size.h = h;
						this.widthTo(w);
					}
				}
			}
			val(Elem.h, active.size.h);
			css(active.elem, {height: `${active.size.h}px`});
		},

		/**
		 *
		 * @param {*} mode
		 */
		dragModeTo: function dragModeTo(mode){
			dragMode = mode;
			val(Elem.dragMode, mode);
			if(mode === 'canvas'){
				if(active.size.w >= Elem.canvas.width){
					this.widthTo(Elem.canvas.width);
				}
				if(active.size.h >= Elem.canvas.height){
					this.heightTo( Elem.canvas.height);
				}
				if(active.position.x < 0){
					this.offsetXTo(0);
				}
				if(active.position.y < 0){
					this.offsetYTo(0);
				}
				if((active.position.x + active.size.w)  > Elem.canvas.width){
					this.offsetXTo(Elem.canvas.width - active.size.w);
				}
				if((active.position.y + active.size.h)  > Elem.canvas.height){
					this.offsetYTo(Elem.canvas.height - active.size.h);
				}
			}
		},
		snapSizeTo: function snapSizeTo(size){
			snapSize = toInt(size);
			val(Elem.snapSize, snapSize);
			if(size > 1){
				this.offsetXTo(active.position.x);
				this.offsetYTo(active.position.y);
			}
		},
		aspectRatioTo: function aspectRatioTo(ratio){
			aspectRatio = Number(ratio).toString() !== 'NaN' ? Number(ratio).toFixed(1) : 0;
			val(Elem.aspectRatio, aspectRatio);
			if(aspectRatio >= 1){
				this.widthTo(active.size.w);
			}else{
				this.heightTo(active.size.h);
			}
		},
		textTo: function textTo(text){
			active.text = text;
		},
		rotateTo: function rotateTo(angle){
			angle = toInt(angle);
			if(angle < -45 && activity !== 'text'){
				active.rotate = -45;
			}else if(angle > 45  && activity !== 'text'){
				active.rotate = 45;
			}else{
				active.rotate = angle;
			}
			css(active.elem, 'transform', `rotate(${active.rotate}deg)`);
			val(Elem.rotate, active.rotate);
		}
	}

	/**
	 * @description
	 */
	var action = {
		/**
		 * @description
		 * @returns
		 */
		resizeNorth: function resizeNorth(){
			let val = snapInt(Mouse.position.y);
			if(val > 0){
				if(val <= active.position.y){
					set.heightTo(active.size.h + (active.position.y - val));
					set.offsetYTo(val);
				}else if((active.size.h - (val - active.position.y)) >= 30){
					set.heightTo(active.size.h - (val - active.position.y));
					set.offsetYTo(val);
				}
				css(Elem.board, 'cursor', 'ns-resize');
			}
		},

		/**
		 * @description
		 * @returns
		 */
		resizeEast: function resizeEast(){
			let w = (Mouse.position.x - active.position.x);
			if(w >= 30) set.widthTo(w);
			css(Elem.board, 'cursor', 'ew-resize');
		},

		/**
		 * @description
		 * @returns
		 */
		resizeSouth: function resizeSouth(){
			let h = Mouse.position.y - active.position.y;
			if(h >= 30) set.heightTo(h);
			css(Elem.board, 'cursor', 'ns-resize');
		},

		/**
		 * @description
		 * @returns
		 */
		resizeWest: function resizeWest(){
			let val = snapInt(Mouse.position.x);
			if(val > 0){
				if(val <= active.position.x){
					set.widthTo(active.size.w + (active.position.x - val));
					set.offsetXTo(val);
				}else{
					if((active.size.w - (val - active.position.x)) >= 30){
						set.widthTo(active.size.w - (val - active.position.x));
						set.offsetXTo(val);
					}
				}
				css(Elem.board, 'cursor', 'ew-resize');
			}
		},

		/**
		 * @description
		 * @returns
		 */
		resizeNorthWest: function resizeNorthWest(){
			this.resizeNorth();
			this.resizeWest();
			css(Elem.board, 'cursor', 'nwse-resize');
		},

		/**
		 * @description
		 * @returns
		 */
		resizeNorthEast: function resizeNorthEast(){
			this.resizeNorth();
			this.resizeEast();
			css(Elem.board, 'cursor', 'nesw-resize');
		},

		/**
		 * @description
		 * @returns
		 */
		resizeSouthWest: function resizeSouthWest(){
			this.resizeSouth();
			this.resizeWest();
			css(Elem.board, 'cursor', 'nesw-resize');
		},

		/**
		 * @description
		 * @returns
		 */
		resizeSouthEast: function resizeSouthEast(){
			this.resizeSouth();
			this.resizeEast();
			css(Elem.board, 'cursor', 'nwse-resize');
		},

		/**
		 * @description
		 * @returns
		 */
		move: function move(){
			let x = snapInt(Mouse.position.x - Mouse.downPosition.x);
			let y = snapInt(Mouse.position.y - Mouse.downPosition.y);
			if(dragMode === 'canvas'){
				if(x >= 0 && x <= (Elem.canvas.width - active.size.w)){
					set.offsetXTo(x);
				}
				if(y >= 0 && y <= (Elem.canvas.height - active.size.h)){
					set.offsetYTo(y);
				}
			}else{
				set.offsetXTo(x);
				set.offsetYTo(y);
			}
		}
	}

	/**
	 * @description
	 * @returns
	 */
	function cursorMoves(){
		if(cursor_elem.indexOf(activity) !== -1){
			css(active.elem, {top: `${Mouse.position.y - (active.size / 2)}px`, left:`${Mouse.position.x - (active.size / 2)}px`});
		}
	}



	var activate = {

		/**
		 * @description Activates the pen tool and updates the DOM appropriately.
		 * @returns {null}
		 */
		penTool: function penTool(){
			activity = 'pen';
			active = Pen;
			val(Elem.color, active.color);
			val(Elem.size, active.size);
			val(Elem.type, active.type);
			addClass('[role*="pen"]','active');
		},

		/**
		 * @description Activates the brush tool and updates the DOM appropriately.
		 * @returns {null}
		 */
		brushTool: function brushTool(){
			activity = 'brush';
			active = Brush;
			val(Elem.color, active.color);
			val(Elem.size, active.size);
			val(Elem.type, active.type);
			addClass('[role*="brush"]','active');
		},

		/**
		 * @description	Activates the eraser tool and updates the DOM appropriately.
		 * @returns
		 */
		eraserTool: function eraserTool(){
			activity = 'eraser';
			active = Eraser;
			val(Elem.size, active.size);
			val(Elem.type, active.type);
			addClass('[role*="eraser"]','active');
		},

		/**
		 * @description Activates the select tool and updates the DOM appropriately.
		 * @returns
		 */
		selectTool: function selectTool(){
			activity = 'select';
			active = Select;
			set.offsetXTo((Elem.canvas.width / 2) - (active.size.w / 2));
			set.offsetYTo((Elem.canvas.height / 2) - (active.size.h / 2));
			val(Elem.x, active.position.x);
			val(Elem.y, active.position.y);
			val(Elem.w, active.size.w);
			val(Elem.h, active.size.h);
			addClass('[role*="select"]','active');
		},

		/**
		 * @description Activates the rectangle tool and activate the DOM Appropriately.
		 * @returns
		 */
		rectangleTool: function rectangleTool(){
			activity = 'rectangle';
			active = Rectangle;
			set.offsetXTo((Elem.canvas.width / 2) - (active.size.w / 2));
			set.offsetYTo((Elem.canvas.height / 2) - (active.size.h / 2));
			val(Elem.fill, active.fill);
			val(Elem.fillColor, active.fillColor);
			val(Elem.strokeWidth, active.strokeWidth);
			val(Elem.strokeColor, active.strokeColor);
			val(Elem.x, active.position.x);
			val(Elem.y, active.position.y);
			val(Elem.w, active.size.w);
			val(Elem.h, active.size.h);
			addClass('[role*="rectangle"]','active');
		},

		/**
		 * @description Activates the ellipse tool and updates the DOM appropriately.
		 * @returns
		 */
		ellipseTool: function ellipseTool(){
			activity = 'ellipse';
			active = Ellipse;
			set.offsetXTo((Elem.canvas.width / 2) - (active.size.w / 2));
			set.offsetYTo((Elem.canvas.height / 2) - (active.size.h / 2));
			addClass('[role*="ellipse"]','active');
			val(Elem.fill, active.fill);
			val(Elem.fillColor, active.fillColor);
			val(Elem.strokeWidth, active.strokeWidth);
			val(Elem.strokeColor, active.strokeColor);
			val(Elem.x, active.position.x);
			val(Elem.y, active.position.y);
			val(Elem.w, active.size.w);
			val(Elem.h, active.size.h);
		},

		/**
		 * @description
		 * @returns
		 */
		lineTool: function lineTool(){
			activity = 'line';
			active =Line;
			set.offsetXTo((Elem.canvas.width / 2) - (active.size.w / 2));
			set.offsetYTo((Elem.canvas.height / 2) - (active.size.h / 2));
			addClass('[role*="line"]','active');
			val(Elem.color, active.color);
			val(Elem.x, active.position.x);
			val(Elem.y, active.position.y);
			val(Elem.w, active.size.w);
			val(Elem.h, active.size.h);
		},

		/**
		 * @description
		 * @returns
		 */
		textTool: function textTool(){
			activity = 'text';
			active = Text;
			set.offsetXTo((Elem.canvas.width / 2) - (active.size.w / 2));
			set.offsetYTo((Elem.canvas.height / 2) - (active.size.h / 2));
			addClass('[role*="text"]','active');
			val(Elem.color, active.color);
			val(Elem.fontSize, active.fontSize);
			val(Elem.x, active.position.x);
			val(Elem.y, active.position.y);
			val(Elem.w, active.size.w);
			val(Elem.h, active.size.h);
		},

		/**
		 * @description
		 * @returns
		 */
		pictureTool: function pictureTool(){
			activity = 'picture';
			active = Picture;
			set.offsetXTo((Elem.canvas.width / 2) - (active.size.w / 2));
			set.offsetYTo((Elem.canvas.height / 2) - (active.size.h / 2));
			addClass('[role*="picture"]','active');
			val(Elem.rotate, active.rotate);
			val(Elem.x, active.position.x);
			val(Elem.y, active.position.y);
			val(Elem.w, active.size.w);
			val(Elem.h, active.size.h);
		}
	};

	var draw = {
		pen: function pen(){
			ctx.strokeStyle = active.color;
			ctx.lineWidth = active.size;
			ctx.lineCap = active.type;
			ctx.lineTo(Mouse.position.x, Mouse.position.y);
			ctx.stroke();
		},
		brush: function brush(){
			ctx.strokeStyle = active.color;
			ctx.lineWidth = active.size;
			ctx.lineCap = active.type;
			ctx.lineTo(Mouse.position.x, Mouse.position.y);
			ctx.stroke();
		},
		eraser: function eraser(){
			ctx.clearRect(Mouse.position.x - (active.size / 2), Mouse.position.y - (active.size / 2), active.size, active.size)
		},
		rectangle: function rectangle(){
			ctx.save();
			ctx.translate(active.position.x + (active.size.w / 2), active.position.y + (active.size.h / 2));
			ctx.rotate((active.rotate / 360) * (Math.PI * 2));
			if(active.fill === 'color'){
				ctx.fillStyle = active.fillColor;
				ctx.rect(-(active.size.w / 2), -(active.size.h / 2), active.size.w, active.size.h);
				ctx.fill();
			}
			if(active.strokeWidth > 0){
				ctx.strokeStyle = active.strokeColor;
				ctx.lineWidth = active.strokeWidth;
				ctx.strokeRect(
					-(active.size.w / 2) + (active.strokeWidth / 2),
					-(active.size.h / 2) + (active.strokeWidth / 2),
					(active.size.w - active.strokeWidth),
					(active.size.h - active.strokeWidth));
			}
			ctx.restore();
		},
		ellipse: function ellipse(){
			ctx.save();
			ctx.translate(active.position.x + (active.size.w / 2), active.position.y + (active.size.h / 2));
			ctx.rotate((active.rotate / 360) * (Math.PI * 2));
			if(active.fill === 'color'){
				ctx.fillStyle = active.fillColor;
				ctx.beginPath();
				ctx.ellipse(0, 0, active.size.w / 2, active.size.h / 2, 0, Math.PI * 2, false);
				ctx.fill();
			}
			if(active.strokeWidth > 0){
				ctx.strokeStyle = active.strokeColor;
				ctx.lineWidth = active.strokeWidth;
				ctx.beginPath();
				ctx.ellipse(0, 0, (active.size.w / 2) - (active.strokeWidth / 2), (active.size.h / 2) - (active.strokeWidth / 2), 0, Math.PI * 2, false);
				ctx.stroke();
			}
			ctx.restore();
		},
		text: function text(){
			if(active.text === '') return;
			ctx.font = `${active.fontSize}px arial`;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'left';
			ctx.fillStyle = active.color;
			ctx.fillText(active.text, active.position.x + 1, active.position.y + 1 +(active.size.h / 2), active.size.width);
			val(Elem.textVal, '');
			active.text = '';
		}
	};


	/**
	 * @description
	 * @returns
	 */
	function triggerActions(){
		let tgt = Mouse.target;
		if(tool_elem.indexOf(tgt) !== -1){
			action.move();
		}else if(tgt === 'n'){
			action.resizeNorth();
		}else if(tgt === 'e'){
			action.resizeEast();
		}else if(tgt === 's'){
			action.resizeSouth();
		}else if(tgt === 'w'){
			action.resizeWest();
		}else if(tgt === 'nw'){
			action.resizeNorthWest();
		}else if(tgt === 'ne'){
			action.resizeNorthEast();
		}else if(tgt === 'sw'){
			action.resizeSouthWest();
		}else if(tgt === 'se'){
			action.resizeSouthEast();
		}else if(tgt === 'canvas' || cursor_elem.indexOf(tgt) !== -1){
			switch(activity){
				case 'pen': draw.pen(); break;
				case 'brush': draw.brush(); break;
				case 'eraser': draw.eraser(); break;
			}
		}
	}


	var handler = {
		mouseMove: function mouseMove(e){
			e.preventDefault();
			let target = e.target.getAttribute('role');
			if(target === "canvas"){
				Mouse.position = {
					x: e.offsetX,
					y: e.offsetY }
			}else if(tool_elem.indexOf(target) !== -1 || cursor_elem.indexOf(target) !== -1){
				Mouse.position = {
					x: active.elem.offsetLeft + e.offsetX,
					y: active.elem.offsetTop + e.offsetY }
			}else{
				Mouse.position = {
					x: active.elem.offsetLeft + e.target.offsetLeft + e.offsetX,
					y: active.elem.offsetTop + e.target.offsetTop + e.offsetY
				}
			}
			if(Mouse.down){
				triggerActions();
			}else{
				ctx.beginPath();
			}
			cursorMoves();
			text(Elem.mouseX, Mouse.position.x);
			text(Elem.mouseY, Mouse.position.y);
		},
		mouseDown: function mouseDown(e){
			Mouse.down = true;
			Mouse.downPosition = {x: e.offsetX, y:e.offsetY};
			Mouse.target = e.target.getAttribute('role');
			if(Mouse.target === 'canvas' || cursor_elem.indexOf(Mouse.target) !== -1){
				switch(activity){
					case 'pen': draw.pen(); break;
					case 'brush': draw.brush(); break;
					case 'eraser': draw.eraser(); break;
				}
			}
		},
		mouseUp: function mouseUp(e){
			Mouse.down = false;
			Mouse.upPosition = {x: e.offsetLeft, y:e.offsetRight}
		},
		change: function change(e){
			let val = e.target.value;
			let id = e.target.id
			switch(id){
				case 'type': set.typeTo(val); break;
				case 'color': set.colorTo(val); break;
				case 'fontColor': set.fontColorTo(val); break;
				case 'fill': set.fillTo(val); break;
				case 'fillColor': set.fillColorTo(val); break;
				case 'size': set.sizeTo(val); break;
				case 'fontSize': set.fontSizeTo(val); break;
				case 'strokeWidth': set.strokeWidthTo(val); break;
				case 'strokeColor': set.strokeColorTo(val); break;
				case 'x': set.offsetXTo(val); break;
				case 'y': set.offsetYTo(val); break;
				case 'w': set.widthTo(val); break;
				case 'h': set.heightTo(val); break;
				case 'dragMode': set.dragModeTo(val); break;
				case 'snapSize': set.snapSizeTo(val); break;
				case 'aspectRatio': set.aspectRatioTo(val); break;
				case 'text': set.textTo(val); break;
				case 'rotate': set.rotateTo(val); break;
			}
		},
		toolChange: function toolChange(role){
			removeClass('[role*="'+activity+'"]', 'active');
			switch(role){
				case 'pen': activate.penTool(); break;
				case 'brush': activate.brushTool(); break;
				case 'eraser': activate.eraserTool(); break;
				case 'select': activate.selectTool(); break;
				case 'rectangle': activate.rectangleTool(); break;
				case 'ellipse': activate.ellipseTool(); break;
				case 'line': activate.lineTool(); break;
				case 'text': activate.textTool(); break;
				case 'picture': activate.pictureTool(); break;
				case 'apply':
					switch(activity){
						case 'rectangle': draw.rectangle(); break;
						case 'ellipse': draw.ellipse(); break;
						case 'text': draw.text(); break;
					}
				break;
				case 'save':
					saveCanvas();
					break;
			}
			css(Elem.board, {cursor:'default'});
		}
	};

	(function(){
		let width = window.innerWidth;
		if(width <= 600){
			Elem.canvas.width = (window.innerWidth);
			Elem.canvas.height = (window.innerHeight);
		}else{
			Elem.canvas.width = (window.innerWidth - 350);
			Elem.canvas.height = (window.innerHeight - 40);
		}
		document.ondragstart = function(e){
			e.preventDefault();
		}
		html(Select.elem, temp_1);
		html(Rectangle.elem, temp_1);
		html(Ellipse.elem, temp_1);
		//append(Text.elem, temp_1);
		val(Elem.dragMode, dragMode);
		val(Elem.snapSize, snapSize);
		val(Elem.aspectRatio, aspectRatio);
		activate.rectangleTool();
	}());

	on(window, 'resize', function(e){
		e.preventDefault();
		let w = window.innerWidth;
		let h = window.innerHeight;
		if(w <= 600){
			Elem.canvas.width = w;
		}else{
			Elem.canvas.width = (w - 350);
		}
		Elem.canvas.height = (h - 40);
	});
	on(Elem.board, 'mousemove', handler.mouseMove);
	on(Elem.board, 'mousedown', handler.mouseDown);
	on(Elem.board, 'mouseup', handler.mouseUp);
	on(Elem.document, 'change', handler.change);
	on('.btn-input', 'click', function(e){
		handler.toolChange(this.getAttribute('role'));
	});


}));
