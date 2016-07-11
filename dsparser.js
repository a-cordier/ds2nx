var fs = require("fs");
var	xml2js = require("xml2js");
var parser = new xml2js.Parser();

var _data = false;

module.exports = {
	parse: function(path) {
		console.log(path);
		var buf = fs.readFileSync(path);
		parser.parseString(buf, function(err, data) {
				_data = data;
		});
		return _data;
	}
};