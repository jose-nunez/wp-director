const { Installer } = require('./installer.js');
const { server_log, server_error, checkValues , duplicateObj } = require('./modules/util.js');
const { VestaAPI } = require('./api/vesta_api');
const settings = require('./modules/settings');
const { db } = require('./modules/database');

function initApp(){
	let app_settings = settings.getAppSettings();
	let dbconnection = app_settings.dbconnection;
	let app_args = settings.getCmdArgs();
	if(app_args.db_pass) dbconnection.db_pass = app_args.db_pass;
	if(app_args.db_name) dbconnection.db_name = app_args.db_name;
	if(app_args.db_user) dbconnection.db_user = app_args.db_user;	
	db.connect(dbconnection);
}


function runInstaller(cfg){

	let installer = new Installer(cfg);
	// return installer.delete_user(cfg);
	// return installer.create_user(cfg);
	// return installer.create_user_backup_folder(cfg);
	// return installer.restart_user(cfg);
	// return installer.create_domain(cfg);
	// return installer.remove_domain(cfg);
	// return installer.clean_domain_dir(cfg);
	// return installer.remove_database(cfg);
	// return installer.restart_database(cfg);
	// return installer.download_wp();
	// return installer.config_wp(cfg);
	// return installer.config_wp_manually(cfg);
	// return installer.install_wp(cfg);
	// return installer.install_wp_themes(cfg);
	// return installer.install_wp_plugins(cfg);
	
	/*let restart_user=false,restart_domain=false;
	return installer.full_site_wp_install(cfg,{restart_user,restart_domain});*/
	
	let restart_user=false,restart_domain=false;
	// return installer.full_site_backup_restore(cfg,{restart_user,restart_domain});
	// return installer.download_backup_files(cfg);
	// return installer.install_backup_files(cfg);
	// return installer.migratedb_replace_path(cfg);

	
	// let restore_mode = 'duplicator';
	/*let restore_mode = 'migratedb';
	let download_method = 'get'; // get | ftp
	let DELETE_USER = false;
	let RESTART_DOMAIN = false;
	server_log(`${cfg.domain_name} | DELETE_USER=${DELETE_USER} RESTART_DOMAIN=${RESTART_DOMAIN}`);*/

	// server_log('full_site_backup_restore');installer.full_site_backup_restore({mode:restore_mode,delete_user:DELETE_USER,restart_domain:RESTART_DOMAIN,download_method}).catch(err=>server_log('Cago la wea',err))

	// server_log('download_backups');installer.get_backup_full_names(restore_mode,download_method,false).then(backup_full_names=>installer.get_backup_files(download_method,backup_full_names)).catch(e=>server_log('Failed download_backups',e));
	// server_log('restart_database');installer.restart_database().then(()=>installer.install_migratedb_database()).catch(err=>server_log('Cago la wea',err.message));
	// server_log('find-replace database');installer.migratedb_replace_domain().then(()=>installer.migratedb_replace_path()).catch(err=>server_log('Cago la wea',err.message));
	// server_log('find-replace database');installer.migratedb_replace_path().catch(err=>server_log('Cago la wea',err.message));

	// server_log('get_migratedb_local_files_all_names');installer.get_migratedb_local_files_all_names().then(result=>server_log('result',result));
	// server_log('unzip_migratedb_files');installer.unzip_migratedb_files().then(result=>server_log('result',result));

}

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

function getSettings(filename){
	let sessionSettings = settings.getSettings(filename||'session.yml');
	let appSettings = settings.getAppSettings();
	return settings.getSiteSettings(sessionSettings.site_name).then(siteSettings=>{
		return processSettings(sessionSettings,siteSettings,appSettings)
	});
}

function run(){
	return getSettings().then(newSet=>runInstaller(newSet));
}

function testSettings(){
	return getSettings().then(newSet=>console.log(newSet));
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


initApp();
// run().catch(e=>server_error(e)).then(r=>process.exit(0));
// testSettings().catch(e=>server_error(e)).then(r=>process.exit(0));
// get_domains().catch(e=>server_error(e)).then(r=>process.exit(0));
// get_users().catch(e=>server_error(e)).then(r=>process.exit(0));
// get_sites().catch(e=>server_error(e)).then(r=>process.exit(0));
get_sites(true).catch(e=>server_error(e)).then(r=>process.exit(0));