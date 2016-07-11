var DsObjects = require('./dsobjects');
var DsParser = require('./dsparser');

var dsData = DsParser.parse(__dirname + "/Collection-3348.xml");
var dso = new DsObjects(dsData);

dso.printHierarchy("Collection-3348");
