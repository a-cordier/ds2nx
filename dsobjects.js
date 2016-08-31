"use strict";

var _ = require("lodash"),
dsoPrototype = {
	getCollections: function getCollections() {
		return this.collections || _.filter(this.data.dsobjects.dsobject, function(object) {
			return object.$.classname === "Collection";
		});
	},
	getDocuments: function getDocuments() {
		return this.documents || _.filter(this.data.dsobjects.dsobject, function(object) {
			return object.$.classname === "Document";
		});
	},
	getVersions: function getVersions(document) {
		return document.versions;
	},
	getRenditions: function getRenditions(document) {
		return this.renditions || _.map(this.getVersions(document), function(object) {
			return object.dsobject[0].renditions;
		});
	},
	getObjectId: function getObjectId(dsobject) {
		return dsobject.$.handle;
	},
	getProp: function getProp(dsobject, propName) {
		return _.find(dsobject.props[0].prop, function(prop) {
			return prop.$.name === propName;
		})._;
	},
	getTitle: function getTitle(dsobject) {
		return this.getProp(dsobject, "title");
	},
	getOriginalFilename: function getOriginalFilename(dsobject) {
		return this.getProp(dsobject, "original_file_name");
	},
	getModifiedDate: function getModifiedDate(dsobject) {
		return this.getProp(dsobject, "modified_date");
	},
	getCreateDate: function getModifiedDate(dsobject) {
		return this.getProp(dsobject, "create_date");
	},
	/* dsobjects may be rooted in more than one parent object at the same time. use if it does matter */
	isMultiRooted: function(dsobject) {
		var containment = dsobject.sourcelinks[0].containment;
		return (containment && containment.length > 1);
	},

	/* get parent of a dsobject in a "first will fit" way when multi rooting does NOT matter (@see isMultiRooted) */
	getParent: function getParent(dsobject) {		
		try {
			return dsobject.sourcelinks[0].containment[0];
		} catch (err) {
			return null;
		}
	},

	/* get parents of a dsobject when multi rooting should be preserved (@see isMultiRooted) */
	getParents: function getParents(dsobject) {
		return dsobject.sourcelinks[0].containment || null;
	},
	/* returns a mapped collection, with only needed values */
	collectionMapper: function collectionMapper(collection) {
		return {
			"title": this.getTitle(collection),
			"dsid": this.getObjectId(collection),
			"createDate": this.getCreateDate(collection),
			"modifiedDate": this.getModifiedDate(collection),
			"dsparent": this.getParent(collection)
		};
	},
	documentMapper: function documentMapper(document) {
		return {
			"originalFileName": this.getOriginalFilename(document),
			"title": this.getTitle(document),
			"dsid": this.getObjectId(document),
			"createDate": this.getCreateDate(document),
			"modifiedDate": this.getModifiedDate(document),
			"dsparent": this.getParent(document)
		};
	},
	getMappedCollections: function getMappedCollections() {
		return this.mappCollections || _.map(this.getCollections(), this.collectionMapper.bind(this));
	},
	getMappedDocuments: function getMappedDocuments() {
		return this.mappDocuments || _.map(this.getDocuments(), this.documentMapper.bind(this));
	},
	getCollectionById: function getCollectionById(dsid) {
		return _.find(this.getMappedCollections(), function(collection) {
			return dsid === collection.dsid;
		});
	},
	getChildren: function getCollectionById(collection) {
		return _.filter(this.getMappedCollections(), function(_collection) {
			return _collection.dsparent == collection.dsid;
		});
	}
};
/* Public */

module.exports = {create: factory};

function create(data){
	var instance = Object.create(dsoPrototype);
	Object.assign(instance, {data: data});
	return instance;
}
