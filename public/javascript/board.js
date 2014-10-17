var Board = function (id, pic, displayWidth) {

	this.id 	      = id;
	this.displayWidth = displayWidth || 640; 

	this.tool    = 'pencil';
	this.color   = '000000';
	this.picture = null;

	this.init(pic);
}

Board.prototype.mouseDown = false;

Board.prototype.draw = function(element) {
	var curColor = (this.tool == 'pencil') ? this.color : null;
	element.css('background-color', ((curColor) ? curColor : 'transparent'));

	var lineNumber = element.parent().attr('pixel-line');
	var colNumber  = element.attr('pixel-col');
	if (!this.picture.bitMap[lineNumber]) {
		this.picture.bitMap[lineNumber] = {};
	}

	if (curColor) {
		this.picture.bitMap[lineNumber][colNumber] = curColor;
	} else {
		delete this.picture.bitMap[lineNumber][colNumber];
	}
	
};

Board.prototype.save = function() {
	var jsonText = JSON.stringify(this.picture);

	var dd = document.createElement('a');
	dd.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + escape(jsonText));
	dd.setAttribute('download', this.picture.name+'.pix');
	dd.click();
}

Board.prototype.load = function(file) {
	var self = this;

	var reader = new FileReader();
    reader.onload = function(e) {
    	var picture = $.parseJSON(e.target.result);
    	self.buildBoard(picture);
    };
    reader.readAsText(file);
}

Board.prototype.initPicture = function(pic) {
	var picture = pic || {};

	this.picture = {};
	this.picture.width  = picture.width  || 64;
	this.picture.height = picture.height || this.picture.width;
	this.picture.name   = picture.name   || 'untitled';
	this.picture.bitMap = picture.bitMap || {};

	return this.picture;
}

Board.prototype.buildBoard = function(pic) {

	var self     = this;
	this.picture = this.initPicture(pic);

	var maxSize = Math.max(this.picture.width, this.picture.height);
	var pixelWidth = 10;
	switch (maxSize) {
		case 16:
			pixelWidth = 40;
			break;
		case 32:
			pixelWidth = 20;
			break;
		case 64:
			pixelWidth = 10;
			break;
		case 96:
			pixelWidth = 7;
			break;
	}

	var div   = $(self.id);
	var table = $(document.createElement('table'));
	var tbody = $(document.createElement('tbody'));

	// create or replace the board
	var board = div.find('.board');
	if (board.length) {
		board.empty();
	} else {
		board = $(document.createElement('div')).addClass('board');
		div.append(board);
	}

	// Build the config bar
	var buildOption = function (name, value) {
		var selectedValue = value || 64;
		var select = $('<select class="'+name+'"></select>');
		[16, 32, 64, 96].forEach(function(val){
			var option = $('<option value="'+val+'">'+val+'</option>');
			if (val == selectedValue) {
				option.attr('selected', 'selected');
			}
			select.append(option);
		});
		return select;
	};
	
	var optionBar = $('<div class="optionbar"></div>');
	optionBar.append($('<input type="text" class="picture-name" value="'+this.picture.name+'" />'));
	optionBar.append(buildOption('picture-width', this.picture.width));
	optionBar.append(buildOption('picture-height', this.picture.height));
	optionBar.append($('<button class="picture-size-btn">OK</option>'));
	board.append(optionBar);

	// Watch the option events
	board.find('.picture-name').change(function(){
		self.picture.name = $(this).val();
	});

	board.find('.picture-size-btn').click(function(){
		self.picture.width = $('.picture-width').val();
		self.picture.height = $('.picture-height').val();
		self.buildBoard(self.picture);
	});

	
	// Build the table
	for(var i=0; i<self.picture.height; i++) {
		var row = self.picture.bitMap[i+''] || {};
		var tr = $(document.createElement('tr'));
		tr.attr('pixel-line', i);
		for (var j=0; j<self.picture.width; j++) {
			var colColor = row[j+''] || 'transparent';
			var td = $(document.createElement('td'));
			td.css('background-color', colColor);
			td.attr('pixel-col', j);
			tr.append(td);
		}
		tbody.append(tr);
	}
	table.append(tbody);
	board.append(table);

	table.find('td').css('width', pixelWidth+'px').css('height', pixelWidth+'px');
	div.width(this.picture.width*pixelWidth+'px');

	// Watch the drawing event
	board.find('td').mouseover(function(){
		if (Board.prototype.mouseDown) {
			self.draw($(this));
		}
	}).mousedown(function() {
		self.draw($(this));
	});
}

Board.prototype.buildToolBar = function() {
	var self = this;

	var div   = $(self.id);
	div.append($(
		'<div class="toolbar">'+
		'	<div class="toolset toolset-draw">'+
		'		<button class="tool tool-draw tool-draw-pencil btn glyphicon glyphicon-pencil" pixel-tool="pencil"></button>'+
		'		<button class="tool tool-draw tool-draw-rubber btn glyphicon glyphicon-remove" pixel-tool="rubber"></button>'+
		'		<button class="tool tool-draw tool-draw-rubber btn glyphicon glyphicon-trash" pixel-tool="erase-all"></button>'+
		'	</div>'+
		'	<div class="toolset toolset-colors">'+
		'		<input class="tool tool-color btn color {hash:true,caps:false}" value="'+self.color+'"/>'+
		'	</div>'+
		'	<div class="toolset toolset-util">'+
		'		<button class="tool tool-util btn glyphicon glyphicon-save" pixel-util="save"></button>'+
		'		<button class="tool tool-util btn glyphicon glyphicon-open" pixel-util="load"></button>'+
		'		<input type="file" class="tool-util-import" style="display:none;"></button>'+
		'	</div>'+
		'</div>'
	)); // TODO refacto this

	div.find('.tool-draw').click(function() {
		self.tool = $(this).attr('pixel-tool');

		if (self.tool == 'erase-all') {
			self.picture.bitMap = {};
			self.buildBoard(self.picture);
			self.tool = 'pencil';
		}
	});

	div.find('.tool-color').change(function(color) {
		self.color = color.target.color.toString();
	});

	div.find('.tool-util').click(function() {
		switch ($(this).attr('pixel-util')) {
			case 'save' :
				self.save();
				break;
			case 'load' :
				div.find('.tool-util-import').click();
				break;
		}
	});

	div.find('.tool-util-import').change(function(){
		var file = $(this)[0].files[0];
		self.load(file);
	});
}

Board.prototype.init = function(pic) {
	$(self.id).empty();
	this.buildBoard(pic);
	this.buildToolBar();
}

$(document)
	.mousedown(function(event) {
		if (event.which == 1) {
			Board.prototype.mouseDown = true;
		}
	})
	.mouseup(function() {
		Board.prototype.mouseDown = false;
	});
