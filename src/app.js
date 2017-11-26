const { Installer } = require('./installer.js');
const { server_log,duplicateObj } = require('./modules/util.js');
const settings = require('./modules/settings');

function runInstaller(cfg){

	console.log('Vamoooo',cfg);
	
	// let installer = new Installer(cfg);
	
	// let restore_mode = 'duplicator';
	/*let restore_mode = 'migratedb';
	let download_method = 'get'; // get | ftp
	let DELETE_USER = false;
	let RESTART_DOMAIN = false;
	server_log(`${cfg.domain_name} | DELETE_USER=${DELETE_USER} RESTART_DOMAIN=${RESTART_DOMAIN}`);*/

	// server_log('full_site_init');installer.full_site_init(DELETE_USER,RESTART_DOMAIN).catch(e=>server_log('cago la wea',e));
	// server_log('full_wp_install');installer.full_site_wp_install(DELETE_USER,RESTART_DOMAIN).catch(e=>server_log('cago la wea',e.name,e.message));

	// server_log('full_site_backup_restore');installer.full_site_backup_restore({mode:restore_mode,delete_user:DELETE_USER,restart_domain:RESTART_DOMAIN,download_method}).catch(err=>server_log('Cago la wea',err))

	// server_log('download_backups');installer.get_backup_full_names(restore_mode,download_method,false).then(backup_full_names=>installer.get_backup_files(download_method,backup_full_names)).catch(e=>server_log('Failed download_backups',e));
	// server_log('wp config');installer.config_wp_manually().catch(err=>server_log('Cago la wea',err.message));
	// server_log('restart_database');installer.restart_database().then(()=>installer.install_migratedb_database()).catch(err=>server_log('Cago la wea',err.message));
	// server_log('find-replace database');installer.migratedb_replace_domain().then(()=>installer.migratedb_replace_path()).catch(err=>server_log('Cago la wea',err.message));
	// server_log('find-replace database');installer.migratedb_replace_path().catch(err=>server_log('Cago la wea',err.message));

	// server_log('config_wp_manually');installer.config_wp_manually();
	// server_log('get_migratedb_local_files_all_names');installer.get_migratedb_local_files_all_names().then(result=>server_log('result',result));
	// server_log('unzip_migratedb_files');installer.unzip_migratedb_files().then(result=>server_log('result',result));

}

function processSettings(sessionSettings,siteSettings,appSettings){
	newSettings = settings.translateSettings(settings.translateSettings(siteSettings,sessionSettings));
	delete(newSettings.local.subdomain);
	
	newSettings.local.database.password = 'algunawea';
	newSettings.vesta.user_password = 'algunawea';
	newSettings.robots_template = appSettings.robots_template;
	// TEMPORARY
	newSettings.wordpress = settings.translateSettings(sessionSettings.wordpress,appSettings);
	newSettings.remote.duplicator_files_prefix = sessionSettings.duplicator_files_prefix;
	return newSettings;

}


function run(){
	let sessionSettings = settings.getSessionSettings();
	let appSettings = settings.getAppSettings();

	return settings.getSiteSettings(sessionSettings.site_name).then(siteSettings=>{

		let newSet = processSettings(sessionSettings,siteSettings,appSettings)

		return runInstaller(newSet);
	});
}

run();