"use strict";

var Client = require("node-rest-client").Client;
var validator = require("validator");
var Q = require("q");

var api;
var _client;

var buildUrl = function(host) {
	if (!(validator.isURL(host)))
		throw new Error("invalid url");
	if (!host.match(/.*\/nuxeo$/))
		host = host.replace(/(\/)*$/, "/nuxeo");
	return host + "/api/v1/";
};


/* public */

module.exports = Nuxeo;

function Nuxeo(host) {
	api = buildUrl(host);
};


Nuxeo.prototype.buildEndpoint = function(endpoint) {
	return api + endpoint;
};

// options := {user:<USERNAME>,password:<PASSWORD>}
Nuxeo.prototype.connect = function(credentials) {
	var deferred = Q.defer();
	_client = new Client(credentials);
	_client.get(this.buildEndpoint("path/"), {
			headers: {
				"accept": "application/json"
			}
		},
		function(data, response) {
			if (response.statusCode !== 200) {
				deferred.reject(response);
			} else {
				deferred.resolve(data);
			}

		});
	return deferred.promise;
};

Nuxeo.prototype.getPostRequestBody = function(options) {
	return {
		headers: {
			"Content-Type": "application/json",
			"accept": "application/json"
		},
		data: {
			"entity-type": "document",
			"type": options.type || "File",
			"name": options.name,
			"properties": {
				"dc:title": options.title || options.name
			}
		}
	}
};

Object.defineProperty(Nuxeo.prototype, 'client', {
    get: function() { 
    	if(!_client){
    		throw new Error('You must issue a connection. Use connect({user: "username", "password": "s3cr3t"})');
    	} else {
    		return _client;
    	}
    }
});