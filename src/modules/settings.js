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
	if(site_name) return db.getStageSettings(site_name).then(site_settings=>joinSettings(default_settings.site,site_settings))
	else{ 
		delete(default_settings.site.remote);//NO remote site as there is no site loaded
		return Promise.resolve(default_settings.site);
	}
}

/*let getSessionSettings = exports.getSessionSettings = function(){
	return YAML.load(path.join(__dirname,'../session.yml'));
}*/

let getSettings = exports.getSettings = function(filename){
	if(filename) return YAML.load(filename);
}