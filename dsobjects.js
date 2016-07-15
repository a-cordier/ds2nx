var fs = require("fs"),
	xml2js = require("xml2js");
var parser = new xml2js.Parser();
var _ = require("lodash");

/* Public */

module.exports = DsObject;

function DsObject(data) {
	this.data = data;
}

DsObject.prototype.getCollections = function() {
	return this.collections || _.filter(this.data.dsobjects.dsobject, function(object) {
		return object.$.classname === "Collection";
	});
};

DsObject.prototype.getDocuments = function() {
	return this.documents || _.filter(this.data.dsobjects.dsobject, function(object) {
		return object.$.classname === "Document";
	});
};


DsObject.prototype.getVersions = function(document) {
	return  document.versions;
};


DsObject.prototype.getRenditions = function(document) {
	return this.versions || _.map(this.getVersions(document), function(object){
		return object.dsobject[0].renditions;
	});
};


/* returns the handle dsid of a dsobject */
DsObject.prototype.getObjectId = function(dsobject) {
	return dsobject.$.handle;
};

/* returns any property a dsobject by its name */
DsObject.prototype.getProp = function(dsobject, propName) {
	return _.find(dsobject.props[0].prop, function(prop) {
		return prop.$.name === propName;
	})["_"];
};

DsObject.prototype.getTitle = function(dsobject) {
	return this.getProp(dsobject, "title");
};

DsObject.prototype.getOriginalFilename = function(dsobject) {
	return this.getProp(dsobject, "original_file_name");
};

DsObject.prototype.getModifiedDate = function(dsobject) {
	return this.getProp(dsobject, "modified_date");
};

DsObject.prototype.getCreateDate = function(dsobject) {
	return this.getProp(dsobject, "create_date");
};

/* dsobjects may be rooted in more than one parent object at the same time. use if it does matter */
DsObject.prototype.isMultiRooted = function(dsobject) {
	var containment = dsobject.sourcelinks[0].containment;
	return (containment && containment.length > 1);
};

/* get parent of a dsobject in a "first will fit" way when multi rooting does NOT matter (@see isMultiRooted) */
DsObject.prototype.getParent = function(dsobject) {
	try {
		return dsobject.sourcelinks[0].containment[0];
	} catch (err) {
		return null;
	}
};

/* get parents of a dsobject when multi rooting should be preserved (@see isMultiRooted) */
DsObject.prototype.getParents = function(dsobject) {
	return dsobject.sourcelinks[0].containment || null;
};

/* returns a mapped collection, with only needed values */
DsObject.prototype.collectionMapper = function(collection) {
	return {
		"title": this.getTitle(collection),
		"dsid": this.getObjectId(collection),
		"createDate": this.getCreateDate(collection),
		"modifiedDate": this.getModifiedDate(collection),
		"dsparent": this.getParent(collection)
	};
};

DsObject.prototype.documentMapper = function(document) {
	return {
		"originalFileName": this.getOriginalFilename(document),
		"title": this.getTitle(document),
		"dsid": this.getObjectId(document),
		"createDate": this.getCreateDate(document),
		"modifiedDate": this.getModifiedDate(document),
		"dsparent": this.getParent(document)
	};
};

DsObject.prototype.getMappedCollections = function() {
	return this.mappCollections || _.map(this.getCollections(), this.collectionMapper.bind(this));
};

DsObject.prototype.getMappedDocuments = function() {
	return this.mappDocuments || _.map(this.getDocuments(), this.documentMapper.bind(this));
};


DsObject.prototype.getCollectionById = function(dsid) {
	return _.find(this.getMappedCollections(), function(collection) {
		return dsid === collection.dsid;
	});
};

DsObject.prototype.getChildren = function(collection) {
	return _.filter(this.getMappedCollections(), function(_collection) {
		return _collection.dsparent == collection.dsid;
	});
};