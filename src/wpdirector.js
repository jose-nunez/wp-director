const { Installer } = require('./installer.js');
const { server_log, server_error, checkValues , duplicateObj } = require('./modules/util.js');
const { VestaAPI } = require('./api/vesta_api');
const settings = require('./modules/settings');
const { db } = require('./modules/database');
const server = require('./modules/server');


function processSettings(sessionSettings,siteSettings,appSettings,app_args){
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

function getSettingsFile(filename,app_args){
	let sessionSettings = settings.getSettings(filename||'session.yml');
	let appSettings = settings.getAppSettings();
	return settings.getSiteSettings(app_args.site_name || sessionSettings.site_name)
		.then(siteSettings=>processSettings(sessionSettings,siteSettings,appSettings,app_args));
}

function testSettings(newSet){
	return Promise.resolve(console.log(newSet));
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
		case 'init' : run_op='full_site_init';break;
		
		case 'install-wordpress': run_op='full_site_wp_install';break;
		case 'install-themes': run_op='install_wp_themes';break;
		case 'install-plugins': run_op='install_wp_plugins';break;
		
		case 'restore': run_op='full_site_backup_restore';break;
		case 'download-backups': run_op='download_backup_files';break;

		default: throw new Error('Wrong operation');
	}
	let installer = new Installer(cfg);
	return installer[run_op](cfg);
}


function run_operation(app_args){
	return getSettingsFile(app_args.settings_file,app_args).then(newSet=>{
		let fn;
		switch (app_args.operation){
			case 'settings':	fn=testSettings(newSet);break;
			case 'options':		fn=testOptions(app_args);break;
			case 'users':		fn=get_users();break;
			case 'sites':		fn=get_sites();break;
			case 'sites-full':	fn=get_sites(true);break;
			case 'domains':		fn=get_domains();break;
			default:			fn=runInstaller(app_args.operation,newSet);
		}
		return fn;
	});
}

// https://github.com/dthree/vorpal
function run_console(){
	console.log('\nPlease type a command (type exit to stop the app)');
	let prompt = 'WPD > ';
	process.stdout.write(prompt);
	
	let stdin = process.openStdin();

	stdin.addListener("data", function(d){
		let data = d.toString().trim(); 
		if(data == '') process.stdout.write(prompt);
		else if(data == 'exit'){ 
			console.log('Good bye');
			process.exit(0);
		}
		else {
			let cmdArgs = settings.getCmdArgs(data.split(' '));
			run_operation(cmdArgs)
			.catch(e=>server_error(e))
			.then(()=>process.stdout.write(prompt));
		}
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
	
	console.log('\n+++ Welcome to WP Director +++\n');
	let run;
	if(!app_args.operation) run = run_console();
	else if(app_args.operation=='server') run = run_server(app_settings.port);
	else run = run_operation(app_args).catch(e=>server_error(e)).then(r=>process.exit(0));

})()