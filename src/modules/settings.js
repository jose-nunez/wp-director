const YAML = require('yamljs');
const DB = require('./database').DB;
const path = require('path');
const util = require('./util');

let translateSettings = exports.translateSettings = function(settings,source){
	return util.translateValues(settings,source||settings,true);
}

let joinSettings = exports.joinSettings = function(deaultSettings,newSettings){
	return util.copyAttrs(deaultSettings,newSettings);
}

let getDefaultSettings = exports.getDefaultSettings = function(site_name){
	return YAML.load(path.join(__dirname,'../config.yml'));
}

let getAppSettings = exports.getAppSettings = function(site_name){
	return getDefaultSettings().app;
}

let getSiteSettings = exports.getSiteSettings = function(site_name){
	let default_settings = getDefaultSettings();
	let dbconnection = default_settings.app.dbconnection;	
	let db = new DB(dbconnection);
	return db.getStageSettings(site_name)
		.then(site_settings=>joinSettings(default_settings.site,site_settings))
		// .then(site_settings=>translateSettings(site_settings));
}

let getSessionSettings = exports.getSessionSettings = function(){
	return YAML.load(path.join(__dirname,'../session.yml'));
}