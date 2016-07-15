"use strict";

var chalk = require('chalk');
var minimist = require('minimist');
var async = require("async-q");
var Nuxeo = require('./nuxeo');
var DsObjects = require('./dsobjects');
var DsParser = require('./dsparser');
var Q = require("q");
var _ = require("lodash");
var nx;
var dso;
var args = {};
var queued = 0,
	todo;

var Queue = (function() {

	var deferred = Q.defer();
	var promise = deferred.promise;

	var queue = async.queue(function(child) {
		warn(JSON.stringify(child));
		if (child.nxparent) {
			create(child).then(function(child) {
				warn("queue - " + JSON.stringify(child));
				queue.push(walk(child));
			});
		}
	}, 1);

	queue.on("drain", function() {
		if (queued === todo) {
			console.log('drain');
			deferred.resolve("walked");
		}
	});

	return {
		queue: queue,
		promise: promise
	}

})();


function check() {
	args = minimist(process.argv.slice(2));
	if (args.h) {
		help();
		process.exit(0);
	}
	if (!args.f) {
		help();
		error('argument missing');
	}
	if (!args.c) {
		help();
		error('argument missing');
	}
}

function help() {
	console.log('usage: node ds2nx', '-f', '<FILEPATH>', '-c', '<COLLECTION_ID>');
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

function parseError(response) {
	if (response)
		return response.statusCode + " - " + response.statusMessage;
}

function walk(collection) {
	var children = dso.getChildren(collection);
	info(JSON.stringify(children));
	_.each(children, function(child) {
		info("child" + JSON.stringify(child));
		child.nxparent = collection.nxid;
		queued++;
		console.log(queued);
		Queue.queue.push(child);
	});
	return Queue.promise;
}

function count(collection) {
	var deferred = Q.defer();
	var query = "SELECT * FROM Document WHERE ecm:ancestorId='"
	query += collection.nxid + "'";
	var path = nx.buildEndpoint("query?query=" + query);
	var body = {
		headers: {
			"accept": "application/json"
		}
	};
	nx.client.get(path, body, function(data, response) {
		if (response.statusCode !== 200) {
			error("Parent: " + JSON.stringify(collection) + " - " + parseError(response));
			deferred.reject(new Error("Could not create document: " + parseError(response)));
		} else  {
			deferred.resolve(data.entries.length);
		}
	});
	return deferred.promise;
}

function create(collection) {
	var deferred = Q.defer();
	info(JSON.stringify(collection));
	info(collection.nxparent);

	var path = nx.buildEndpoint("id/" + collection.nxparent);
	var body = nx.getPostRequestBody({
		"name": collection.dsid,
		"title": collection.title,
		"type": "Folder"
	});
	nx.client.post(path, body, function(data, response) {
		if (response.statusCode !== 201) {
			error("Parent: " + JSON.stringify(collection) + " - " + parseError(response));
			deferred.reject(new Error("Could not create document: " + parseError(response)));
		} else  {
			collection.nxid = data.uid;
			deferred.resolve(collection);
		}
	});
	return deferred.promise;
}


function root(collection, path) {
	var deferred = Q.defer();
	var endpoint = nx.buildEndpoint("path/" + path);
	var body = nx.getPostRequestBody({
		"name": collection.dsid,
		"title": collection.title,
		"type": "Folder"
	});
	nx.client.post(endpoint, body, function(data, response) {
		if (response.statusCode !== 201) {
			info("Error - " + parseError(response));
			deferred.reject(new Error("Could not create root document: " + parseError(response)));
		} else  {
			collection.nxid = data.uid;
			info("root id is " + data.uid);
			deferred.resolve(collection);
		}
	});
	return deferred.promise;
};

var main = function() {
	check();
	info("Loading data, please wait ...");
	var dsData = DsParser.parse(args.f);
	dso = new DsObjects(dsData);
	nx = new Nuxeo("http://172.16.23.112:8080");
	var rootCollection = dso.getCollectionById(args.c);
	var path = "/default-domain/UserWorkspaces/78232";
	var collections = dso.getMappedCollections();
	todo = collections.length;
	info(--todo + " docushare collections");
	// nx.connect({
	// 		user: "78232",
	// 		password: "bnfofstu"
	// 	})
	// 	.then(function() {
	// 		return root(rootCollection, path);
	// 	}).catch(function(err) {
	// 		console.log(err);
	// 	})
	// 	.then(walk).then(function(res) {
	// 		info(res);
	// 	}).then(function() {
	// 		count(rootCollection).then(function(res) {
	// 			console.log(res)
	// 		});
	// 	});
	var docs = dso.getMappedDocuments();
	// console.log(dso.getDocuments());
	info(docs.length + " documents to import");
	// _.each(docs, function(doc){
	// 	info(doc.title + " - " + doc.originalFileName + " - " + doc.modifiedDate + " - " + doc.dsparent);
	// });
	_.each(dso.getDocuments(), function(doc){
		console.log(JSON.stringify(dso.getVersions(doc)[0][0].dsobject[0].renditions));
	});
}


main();