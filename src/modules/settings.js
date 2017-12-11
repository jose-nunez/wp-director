const YAML = require('yamljs');
const { db }= require('./database');
const path = require('path');
const util = require('./util');
const commandLineArgs = require('command-line-args')

let getAppArgs = exports.getAppArgs = function(args){
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
		{ name: 'site_name', alias: 's', type: String },
		{ name: 'restart_user', alias: 'U', type: Boolean },
		{ name: 'restart_domain', alias: 'D', type: Boolean },
	];

	return commandLineArgs(optionDefinitions, args? {argv:args} : null);
}

let getDefaultSettings = exports.getDefaultSettings = function(site_name){
	return YAML.load(path.join(__dirname,'../config.yml'));
}

let translateSettings = exports.translateSettings = function(settings,source){
	return util.translateValues(settings,source||settings,true);
}

let joinSettings = exports.joinSettings = function(deaultSettings,newSettings){
	return util.copyAttrs(deaultSettings,newSettings);
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
	else return Promise.resolve(default_settings.site);
}



let processSettings = exports.processSettings = function(sessionSettings,siteSettings,appSettings,app_args){
	newSettings = translateSettings(joinSettings(siteSettings,sessionSettings));
	delete(newSettings.local.subdomain);
	delete(newSettings.local.subdomain_sufix);
	
	newSettings.robots_template = appSettings.robots_template;

	// Each theme and plugin has to be an array
	if(newSettings.wordpress){
		if(newSettings.wordpress.themes instanceof Array)
			newSettings.wordpress.themes = newSettings.wordpress.themes.map(theme=>theme.split('|'));
		if(newSettings.wordpress.plugins instanceof Array)
			newSettings.wordpress.plugins = newSettings.wordpress.plugins.map(plugin=>plugin.split('|'));
		
	}

	newSettings.local.database.password = 'algunawea';
	newSettings.vesta.user_password = 'algunawea';


	// COMMAND LINE ARGUMENTS___________
	newSettings.restart_user = app_args.restart_user || newSettings.restart_user;
	newSettings.restart_domain = app_args.restart_domain || newSettings.restart_domain;
	
	if((newSettings.remote && newSettings.remote.ftp) || app_args.ftp_user || app_args.ftp_host || app_args.ftp_pass){
		if(!newSettings.remote) newSettings.remote = {};
		if(!newSettings.remote.ftp) newSettings.remote.ftp = {};

		newSettings.remote.ftp.user = app_args.ftp_user || newSettings.remote.ftp.user;
		newSettings.remote.ftp.host = app_args.ftp_host || newSettings.remote.ftp.host;
		newSettings.remote.ftp.password = app_args.ftp_pass || newSettings.remote.ftp.password;
	}

	return newSettings;
}

let getSettings = exports.getSettings = function(filename){
	let app_args = getAppArgs();
	let appSettings = getAppSettings();
	let sessionSettings = YAML.load(filename||'session.yml');

	return getSiteSettings(app_args.site_name || sessionSettings.site_name)
		.then(siteSettings=>processSettings(sessionSettings,siteSettings,appSettings,app_args));
}