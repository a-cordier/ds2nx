var fs = require("fs"),
	xml2js = require("xml2js"),
	parser = new xml2js.Parser(),
	_data = false;

module.exports = {
	parse: function(path) {
		var buf = fs.readFileSync(path);
		parser.parseString(buf, function(err, data) {
				_data = data;
		});
		return _data;
	}
};