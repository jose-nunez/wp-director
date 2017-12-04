const { Installer } = require('./installer.js');
const { server_log, server_error, checkValues , duplicateObj } = require('./modules/util.js');
const { VestaAPI } = require('./api/vesta_api');
const settings = require('./modules/settings');
const { db } = require('./modules/database');
const server = require('./modules/server');


function processSettings(sessionSettings,siteSettings,appSettings){
	newSettings = settings.translateSettings(settings.joinSettings(siteSettings,sessionSettings));
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

	return newSettings;
}

function getFileSettings(filename){
	let sessionSettings = settings.getSettings(filename||'session.yml');
	let appSettings = settings.getAppSettings();
	return settings.getSiteSettings(sessionSettings.site_name)
		.then(siteSettings=>processSettings(sessionSettings,siteSettings,appSettings));
}

function testSettings(){
	return getFileSettings().then(newSet=>console.log(newSet));
}
function testOptions(app_args){
	return Promise.resolve(console.log(app_args));
}

function get_domains(){
	let vesta_api = new VestaAPI();
	return vesta_api.get_domains().then(domains=>console.log(domains));
}
function get_users(){
	let vesta_api = new VestaAPI();
	return vesta_api.get_users().then(users=>console.log(users));
}

function get_sites(fullconfig){
	return db.getSiteList(fullconfig).then(sites=>console.log(sites));
}


function runInstaller(operation,cfg){
	let run_op;
	switch (operation){
		case 'iwp': run_op='full_site_wp_install';break;
		case 'ithemes': run_op='install_wp_themes';break;
		case 'restore': run_op='full_site_backup_restore';break;
		default: throw new Error('Wrong operation');
	}
	let installer = new Installer(cfg);
	return installer[run_op](cfg);
}

function run_file({settings,operation,restart_user,restart_domain}){
	return getFileSettings(settings).then(newSet=>{
		newSet.restart_user = restart_user;
		newSet.restart_domain = restart_domain;
		return runInstaller(operation,newSet);
	});
}

function run_operation(app_args){
	let fn;
	switch (app_args.operation){
		case 'to':	fn=testOptions(app_args);break;
		case 'ts':	fn=testSettings();break;
		case 'u':	fn=get_users();break;
		case 's':	fn=get_sites();break;
		case 'sf':	fn=get_sites(true);break;
		default:	fn=run_file(app_args);
	}
	fn.catch(e=>server_error(e)).then(r=>process.exit(0));
}

function run_console(){
	console.log('################\nWelcome to WP Director\n################\nPlease type a command (type exit to stop the app)');
	let stdin = process.openStdin();
	stdin.addListener("data", function(d) {
		console.log("- you entered: " + d.toString().trim());
	});
}

function run_server(port){
	return server.startServer(port);
}


function initApp(app_args,app_settings){
	let dbconnection = app_settings.dbconnection;
	if(app_args.db_pass) dbconnection.db_pass = app_args.db_pass;
	if(app_args.db_name) dbconnection.db_name = app_args.db_name;
	if(app_args.db_user) dbconnection.db_user = app_args.db_user;	
	db.connect(dbconnection);
}

(function(){
	let app_settings = settings.getAppSettings();
	let app_args = settings.getCmdArgs();
	initApp(app_args,app_settings);
	if(!app_args.operation){
		run_server(app_settings.port)
		.then(()=>run_console())
		.catch(e=>{server_error(e);process.exit(0)});
	} 
	else{
		run_operation(app_args);
	}

})()