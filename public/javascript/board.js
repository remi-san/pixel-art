var Board = function (id, size) {
	this.tool      = 'pencil';
	this.color     = '000000';
	this.size	   = size;
	this.id 	   = id;

	this.bitMap    = {};
}

Board.prototype.mouseDown = false;

Board.prototype.draw = function(element) {
	var curColor = (this.tool == 'pencil') ? this.color : null;
	element.css('background-color', ((curColor) ? curColor : 'transparent'));

	var lineNumber = element.parent().attr('pixel-line');
	var colNumber  = element.attr('pixel-col');
	if (!this.bitMap[lineNumber]) {
		this.bitMap[lineNumber] = {};
	}

	if (curColor) {
		this.bitMap[lineNumber][colNumber] = curColor;
	} else {
		delete this.bitMap[lineNumber][colNumber];
	}
	
};

Board.prototype.save = function() {
	var jsonText = JSON.stringify(this.bitMap);

	var dd = document.createElement('a');
	dd.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + escape(jsonText));
	dd.setAttribute('download', 'pixelart.json');
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

Board.prototype.buildBoard = function(picture) {

	var self    = this;
	self.bitMap = picture || {};

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
	
	// Build the table
	for(var i=0; i<self.size; i++) {
		var row = self.bitMap[i+''] || {};
		var tr = $(document.createElement('tr'));
		tr.attr('pixel-line', i);
		for (var j=0; j<self.size; j++) {
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
	div.append($(''+
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
		'</div>')); // TODO refacto this

	div.find('.tool-draw').click(function() {
		self.tool = $(this).attr('pixel-tool');

		if (self.tool == 'erase-all') {
			self.buildBoard();
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

Board.prototype.init = function() {

	var self = this;
	var div = $(self.id);

	div.empty();
	div.width('640px');
	div.css('margin', 'auto');

	this.buildBoard();
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