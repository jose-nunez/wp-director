const YAML = require('yamljs');
const DB = require('./database').DB;
const path = require('path');
const util = require('./util');

let translateSettings = exports.translateSettings = function(settings){
	return util.translateValues(settings,settings);
}

let joinSettings = exports.joinSettings = function(deaultSettings,newSettings){
	return util.copyAttrs(deaultSettings,newSettings);
}

let getAppSettings = exports.getAppSettings = function(site_name){
	let deault_settings = YAML.load(path.join(__dirname,'../config.yml'));
	return deault_settings.app;
}

let getSiteSettings = exports.getSiteSettings = function(site_name){
	let deault_settings = YAML.load(path.join(__dirname,'../config.yml'));
	let dbconnection = deault_settings.app.dbconnection;
	
	let connector = new DB(dbconnection);
	return connector.getStageSettings(site_name).then(site_settings=>joinSettings(deault_settings.site,site_settings));

}