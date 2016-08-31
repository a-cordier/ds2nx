"use strict";

var Q = require("q");
var _ = require("lodash");
var async = require("async-q");

var _size, _queue, _nx, _root, _dso;

function Queue(poolsize) {

	var deferred = Q.defer();
	var promise = deferred.promise;

	var queue = async.queue(function(child) {
		createChild(child).then(function(child) {
			walk(child);
		});
	}, poolsize);

	queue.on("drain", function() {
		if (0 === _size) {
			deferred.resolve("walked succesfully through collections");
		}
	});

	return {
		push: function(child) {
			queue.push(child);
		},
		promise: promise
	}

}

var createChild = function(collection) {
	var deferred = Q.defer();
	var path = _nx.buildEndpoint("id/" + collection.nxparent);
	var body = _nx.getPostRequestBody({
		"name": collection.dsid,
		"title": collection.title,
		"type": "Folder"
	});
	_nx.client.post(path, body, function(data, response) {
		if (response.statusCode !== 201) {
			console.log(_nx.parseError(response));
			deferred.reject(new Error("Could not create document: " + _nx.parseError(response)));
		} else  {
			collection.nxid = data.uid;
			deferred.resolve(collection);
		}
	});
	return deferred.promise;
}

var createRoot = function(path) {
	var deferred = Q.defer();
	var endpoint = _nx.buildEndpoint("path/" + path);
	var body = _nx.getPostRequestBody({
		"name": _root.dsid,
		"title": _root.title,
		"type": "Folder"
	});
	_nx.client.post(endpoint, body, function(data, response) {
		if (response.statusCode !== 201) {
			error("Error creating root document: " + _nx.parseError(response));
			deferred.reject(new Error("Could not create root document: " + _nx.parseError(response)));
		} else  {
			_root.nxid = data.uid;
			_size--;
			deferred.resolve(_root);
		}
	});
	return deferred.promise;
};

var walk = function(collection) {
	var children = _dso.getChildren(collection);
	_.each(children, function(child) {
		child.nxparent = collection.nxid;
		_size--;
		_queue.push(child);
	});
}

module.exports = Collections;

function Collections(dso, nx, root, poolsize) {
	_root = root;
	_dso = dso;
	_size = _dso.getMappedCollections().length;
	_nx = nx;
	_queue = new Queue(poolsize);
}

Collections.prototype.create = function(path) {
	createRoot(path)
		.then(walk);
	return _queue.promise;
}

Collections.prototype.getChildren = function(collection) {
		var deferred = Q.defer();
		var query = "SELECT * FROM Document WHERE ecm:ancestorId='"
		query += ancestorId + "'";
		var path = _nx.buildEndpoint("query?query=" + query);
		var body = {
			headers: {
				"accept": "application/json"
			}
		};
		_nx.client.get(path, body, function(data, response) {
			if (response.statusCode !== 200) {
				deferred.reject(new Error("Could not execute count operation: " + _nx.parseError(response)));
			} else  {
				deferred.resolve(data.entries);
			}
		});
		return deferred.promise;
}

