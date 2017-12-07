const YAML = require('yamljs');
const { db }= require('./database');
const path = require('path');
const util = require('./util');
const commandLineArgs = require('command-line-args')

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
	if(site_name) return db.getStageSettings(site_name).then(site_settings=>{
		if(!site_settings) throw new Error(`Site name ${site_name} not found in database`);
		else return joinSettings(default_settings.site,site_settings);
	})
	else{ 
		// delete(default_settings.site.remote);//NO remote site as there is no site loaded -> NA QUE VER PO
		return Promise.resolve(default_settings.site);
	}
}

/*let getSessionSettings = exports.getSessionSettings = function(){
	return YAML.load(path.join(__dirname,'../session.yml'));
}*/

let getSettings = exports.getSettings = function(filename){
	if(filename) return YAML.load(filename);
}

let getCmdArgs = exports.getCmdArgs = function(args){
	let optionDefinitions = [
		// Database
		{ name: 'db_pass', alias: 'p', type: String },
		{ name: 'db_name', alias: 'd', type: String },
		{ name: 'db_user', alias: 'u', type: String },
		// FTP
		{ name: 'ftp_user', alias: 'x', type: String },
		{ name: 'ftp_host', alias: 'y', type: String },
		{ name: 'ftp_pass', alias: 'z', type: String },
		// run
		{ name: 'operation', alias: 'o', type: String , defaultOption: true },
		{ name: 'settings_file', alias: 'f', type: String },
		{ name: 'restart_user', alias: 'U', type: Boolean },
		{ name: 'restart_domain', alias: 'D', type: Boolean },
		{ name: 'run_server', alias: 's', type: Boolean },
	];

	return commandLineArgs(optionDefinitions, args? {argv:args} : null);
}