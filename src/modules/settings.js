const YAML = require('yamljs');
const DB = require('./database').DB;
const path = require('path');
const util = require('./util');

function translateSettings(settings){
	return util.translateValues(settings,settings);
}

function joinSettings(deaultSettings,newSettings){
	return util.copyAttrs(deaultSettings,newSettings);
}

function getAppSettings(site_name){
	let deault_settings = YAML.load(path.join(__dirname,'../config.yml'));
	let dbconnection = deault_settings.dbconnection;
	delete(deault_settings.dbconnection); // Will not go to the app
	
	let connector = new DB(dbconnection);
	return connector.getStageSettings(site_name).then(site_settings=>joinSettings(deault_settings,site_settings));

}

exports.getAppSettings = getAppSettings;
exports.translateSettings = translateSettings;