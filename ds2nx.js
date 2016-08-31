"use strict";

var chalk = require('chalk');
var minimist = require('minimist');
var Nuxeo = require('./nuxeo');
var DsObjects = require('./dsobjects');
var DsParser = require('./dsparser');
var Collections = require('./collections');
var Q = require("q");
var _ = require("lodash");
var nx;
var dso;
var args = {};

function checkArgs() {
	args = minimist(process.argv.slice(2));
	if (!args.f || !args.c || !args.u ||!args.p) {
		help();
		error('argument missing');
	}
	args.h = args.h || "http://localhost:8080";

}

function help() {
	console.log('usage: node ds2nx', 
		'-f', '<FILEPATH>', 
		'-c', '<COLLECTION_ID>',
		'-u', '<USERNAME>',
		'-p', '<PASSWORD>');
}

function error(message) {
	console.log("ERROR", chalk.red(message));
	process.exit(1);
}

function info(message) {
	console.log("INFO", chalk.blue(message));
}

function warn(message) {
	console.log("WARN", chalk.yellow(message));
}

var main = function() {
	checkArgs();
	info("Loading data, please wait ...");
	var dsData = DsParser.parse(args.f);
	dso = DsObjects.create(dsData);
	nx = Nuxeo.create(args.h);
	var root = dso.getCollectionById(args.c);
	var path = "/default-domain/UserWorkspaces/78232";
	var  collections = new Collections(dso, nx, root, 1);
	nx.connect({
			user: args.u,
			password: args.p
		})
		.then(function() {
			return collections.create(path)
		})
		.then(function(res) {
			info(res);
		});
}


main();