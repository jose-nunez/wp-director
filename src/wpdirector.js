const { server_error } = require('./modules/util.js');
const settings = require('./modules/settings');
const { db } = require('./modules/database');
const server = require('./server');
const { run_operation } = require('./operator');
const { run_console } = require('./console');
const { run_server } = require('./server');


function initApp(app_args,app_settings){
	let dbconnection = app_settings.dbconnection;
	if(app_args.db_pass) dbconnection.db_pass = app_args.db_pass;
	if(app_args.db_name) dbconnection.db_name = app_args.db_name;
	if(app_args.db_user) dbconnection.db_user = app_args.db_user;	
	db.connect(dbconnection);
}

(function(){
	let app_settings = settings.getAppSettings();
	let app_args = settings.getAppArgs();
	initApp(app_args,app_settings);
	
	console.log('\n+++ Welcome to WP Director +++\n');
	let run;
	if(!app_args.operation) run = run_console();
	else if(app_args.operation=='server') run = run_server(app_settings.port);
	else run = run_operation(app_args).catch(e=>server_error(e)).then(r=>process.exit(0));

})()