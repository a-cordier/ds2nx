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

/* returns the handle id of a dsobject */
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
		"id": this.getObjectId(collection),
		"createDate": this.getCreateDate(collection),
		"modifiedDate": this.getModifiedDate(collection),
		"parent": this.getParent(collection)
	};
};

DsObject.prototype.getMappedCollections = function() {
	return this.mappCollections || _.map(this.getCollections(), this.collectionMapper.bind(this));
};

DsObject.prototype.getCollectionById = function(id) {
	return _.find(this.getMappedCollections(), function(collection) {
		return id === collection.id;
	});
};

DsObject.prototype.getChildren = function(collectionId) {
	return _.filter(this.getMappedCollections(), function(_collection) {
		return _collection.parent == collectionId;
	});
};

DsObject.prototype.walk = function(root, preprocessor, processor, postprocessor) {
	var self = this;
	if (!root)
		return false;
	var children = this.getChildren(root.id);
	if (children && children.length) {
		_.each(children, function(child) {
			preprocessor(child);
			processor(child);
			self.walk.call(self, child, preprocessor, processor, postprocessor);
			postprocessor(child);
		});
	}
};

DsObject.prototype.printHierarchy = function(rootId){
	var position = 1;
	var print = function(collection){
		console.log(Array(position).join('--|'), collection.title);
	};
	print(this.getCollectionById(rootId));
	this.walk.call(this, this.getCollectionById(rootId), 
		function(){
			position++;
		}, 
		print,
		function(){
			position--;
		});
};


