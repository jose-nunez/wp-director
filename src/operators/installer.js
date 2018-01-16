
const path = require('path');
const { VestaAPI } = require('../api/vesta_api');
const { WP_API } = require('../api/wp_api');
const { FileSystemAPI } = require('../api/file_system_api');
const { FTP_API } = require('../api/ftp_api');
const { DataBaseAPI } = require('../api/data_base_api');
const { process_log } = require('../modules/logger.js');
const { urlOrigin , lPTrim , lWTrim , rPTrim , rWTrim , checkValues} = require('../modules/util.js');


class Installer{

	constructor(cfg){
		this.init_vesta_api(cfg);
		// Reinitiate in case of User restart
		this.init_wp_api(cfg);
		this.init_fs_api(cfg);
		this.init_ftp_api(cfg);
		this.init_database_api(cfg);
	}


	/******************************************
	* APIs 
	******************************************/
	init_vesta_api(){ this.vesta_api = new VestaAPI(/*DON'T CHANGE USER*/);	}
	init_wp_api(cfg){ this.wp_api = new WP_API(cfg.vesta.user_name,cfg.local.path); } // Init after created Vesta User!
	init_fs_api(cfg){ this.fs_api = new FileSystemAPI(cfg.vesta.user_name); } // Init after created Vesta User!
	init_ftp_api(cfg){ 
		if(cfg.remote) this.ftp_api = new FTP_API(cfg.vesta.user_name,cfg.remote.ftp); 
	} // Init after created Vesta User!
	init_database_api(cfg){ this.database_api = new DataBaseAPI(cfg.vesta.user_name,cfg.local.database.name,cfg.local.database.user,cfg.local.database.password); } // Init after created Vesta User!

	
	checkValues(cfg,keys,errorMsg){
		if(!checkValues({obj:{cfg},keys})) return Promise.reject(new Error(errorMsg));
		else return Promise.resolve();
	}

	/******************************************
	* VESTA ADMIN 
	******************************************/

	delete_user(cfg){
		return this.checkValues(cfg,['cfg.vesta.user_name'],`Can't delete user: Wrong parameters!`).then(()=>{
			process_log(`Deleting user ${cfg.vesta.user_name}`);
			return this.vesta_api.get_domains(cfg.vesta.user_name).then(domains=>{
				if( domains.length==0 || ( domains.length==1 && domains.some(domain_obj=>domain_obj.domain==cfg.local.domain) ) ){ 
					return this.vesta_api.delete_user(cfg.vesta.user_name)
					.then((result)=>process_log(`Deleted user ${cfg.vesta.user_name}`));
				}
				else throw new Error(`Can't delete user: there are active domains`);
			});
		});
	}

	create_user(cfg){
		return this.checkValues(cfg,['cfg.vesta.user_password','cfg.vesta.user_email','cfg.vesta.user_name'],`Can't create user: Wrong parameters!`).then(()=>{
			process_log(`Creating user ${cfg.vesta.user_name}`);
			return this.vesta_api.create_user(cfg.vesta.user_name,cfg.vesta.user_password,cfg.vesta.user_email)
				.then(()=>{
					// Restarting APIS for new user
					this.init_fs_api(cfg);
					this.init_ftp_api(cfg);
					this.init_wp_api(cfg);
					this.init_database_api(cfg);
				})
				.then((result)=>process_log(`Created user ${cfg.vesta.user_name}`));
		});
	}

	create_user_backup_folder(cfg){
		return this.checkValues(cfg,['cfg.local.backup_dir'],`Can't create user backup folder: Wrong parameters!`).then(()=>{
			process_log(`Creating user backup folder ${cfg.local.backup_dir}`);
			return this.fs_api.create_dir(cfg.local.backup_dir,cfg.local.backup_dir_owner)
			.then(()=>process_log(`Created user backup folder ${cfg.local.backup_dir}`));
		});
	}

	restart_user(cfg){
		return this.checkValues(cfg,['cfg.vesta.user_password','cfg.vesta.user_email','cfg.vesta.user_name'],`Can't restart user: Wrong parameters!`).then(()=>{
			// process_log(`Restarting user ${cfg.vesta.user_name}`);
			return this.vesta_api.user_exists(cfg.vesta.user_name)
				.then(exists=>exists? this.delete_user(cfg) : true)
				.then(()=>	this.create_user(cfg));
		});
	}

	remove_domain(cfg){ 
		return this.checkValues(cfg,['cfg.local.domain','cfg.vesta.user_name'],`Can't remove domain: Wrong parameters!`).then(()=>{
			process_log(`Removing domain ${cfg.local.domain} for ${cfg.vesta.user_name}`);
			return this.vesta_api.remove_domain(cfg.vesta.user_name,cfg.local.domain)
			.then(()=>process_log(`Removed domain ${cfg.local.domain}`)); 
		});
	}

	create_domain(cfg){ 
		return this.checkValues(cfg,['cfg.local.domain','cfg.vesta.user_name'],`Can't remove domain: Wrong parameters!`).then(()=>{
			process_log(`Creating domain ${cfg.local.domain} for ${cfg.vesta.user_name}`);
			return this.vesta_api.create_domain(cfg.vesta.user_name,cfg.local.domain)
				.then(()=>process_log('Created domain'))
				.then(()=>{if(cfg.local.protocol=='https'){
					process_log(`Adding SSL support for ${cfg.local.domain} for ${cfg.vesta.user_name}`);
					return this.vesta_api.add_letsencrypt(cfg.vesta.user_name,cfg.local.domain)
					.then(()=>process_log('Added SSL support'));
				}});
		});
	}
	
	restart_domain(cfg){
		return this.checkValues(cfg,['cfg.local.domain','cfg.vesta.user_name'],`Can't restart domain: Wrong parameters!`).then(()=>{
			return 		this.remove_domain(cfg).catch(`Domain ${cfg.local.domain} not deleted`)
			.then(()=>	this.create_domain(cfg));
		});
	}

	clean_domain_dir(cfg){
		return this.checkValues(cfg,['cfg.local.path','cfg.robots_template'],`Can't clean folder: Wrong parameters!`).then(()=>{
			process_log(`Cleaning folder ${cfg.local.path}`);
			let robots_src  = cfg.robots_template;
			let robots_dst  = path.join(cfg.local.path,path.basename(robots_src));
			return 		this.fs_api.delete_folder(cfg.local.path,true)
			.then(()=>	this.fs_api.create_dir(cfg.local.path))
			.then(()=>	this.fs_api.copy_file(robots_src,robots_dst))
			.then(()=>process_log(`Folder ${cfg.local.path} cleaned`));
		});
	}

	remove_database(cfg){ 
		return this.checkValues(cfg,['cfg.local.database.name','cfg.vesta.user_name'],`Can't remove database: Wrong parameters!`).then(()=>{
			process_log(`Removing database ${cfg.local.database.name} for ${cfg.vesta.user_name}`);
			return this.vesta_api.remove_database(cfg.vesta.user_name,cfg.local.database.name)
			.then((result)=>process_log('Removed database')); 
		});
	}

	create_database(cfg){ 
		return this.checkValues(cfg,['cfg.local.database.name','cfg.vesta.user_name','cfg.local.database.name_sufix','cfg.local.database.user_sufix','cfg.local.database.password'],`Can't create database: Wrong parameters!`).then(()=>{
			process_log(`Creating database ${cfg.local.database.name} for ${cfg.vesta.user_name}`);
			return this.vesta_api.create_database(cfg.vesta.user_name,cfg.local.database.name_sufix,cfg.local.database.user_sufix,cfg.local.database.password)
			.then((result)=>process_log('Created database')); 
		});
	}

	restart_database(cfg){
		return this.checkValues(cfg,['cfg.local.database.name','cfg.vesta.user_name','cfg.local.database.name_sufix','cfg.local.database.user_sufix','cfg.local.database.password'],`Can't restart database: Wrong parameters!`).then(()=>{
			return 		this.remove_database(cfg).catch(err=>process_log(`Database ${cfg.local.database.name} not deleted`))
			.then(()=>	this.create_database(cfg));
		});
	}

	/******************************************
	* WORDPRESS INSTALL 
	******************************************/

	download_wp(cfg){ 
		process_log(`Downloading Wordpress`);
		return this.wp_api.download(cfg.wordpress.locale,cfg.wordpress.version)
		.then((result)=>process_log(result.stdout));
	}

	config_wp(cfg){
		return this.checkValues(cfg,['cfg.local.database.name','cfg.local.database.user','cfg.local.database.password'],`Can't restart database: Wrong parameters!`).then(()=>{
			process_log(`Auto generate wp-config.php`);
			return this.wp_api.config(cfg.local.database.name,cfg.local.database.user,cfg.local.database.password)
			.then((result)=>process_log(result.stdout)); 
		});
	}
	
	// https://regex101.com/r/pitmX3/1
	config_wp_manually(cfg){
		return this.checkValues(cfg,['cfg.local.path','cfg.local.database.name','cfg.local.database.user','cfg.local.database.password'],`Can't manually generate wp-config.php: Wrong parameters!`).then(()=>{
			process_log(`Manual generate wp-config.php`);
			let wpconfig = path.join(cfg.local.path , 'wp-config.php');
			return this.fs_api.replace_in_file(wpconfig,[
				{find:/define\s*?\(\s*?('|")DB_NAME('|")\s*?,\s*?('|").*?('|")\s*?\)\s*?;/g,replace:`define('DB_NAME','${cfg.local.database.name}');`},
				{find:/define\s*?\(\s*?('|")DB_USER('|")\s*?,\s*?('|").*?('|")\s*?\)\s*?;/g,replace:`define('DB_USER','${cfg.local.database.user}');`},
				{find:/define\s*?\(\s*?('|")DB_PASSWORD('|")\s*?,\s*?('|").*?('|")\s*?\)\s*?;/g,replace:`define('DB_PASSWORD','${cfg.local.database.password}');`},
			]).then(()=>process_log('wp-config.php generated succesfully'));
		});
	}

	install_wp(cfg){ 
		return this.checkValues(cfg,['cfg.local.domain','cfg.wordpress.title','cfg.wordpress.admin'/*,'cfg.wordpress.password'*/,'cfg.wordpress.email','cfg.wordpress.skip_email'],`Can't install wordpress: Wrong parameters!`).then(()=>{
			process_log(`Installing Wordpress: ${cfg.wordpress.title}`);
			return this.wp_api.install(
				(cfg.local.protocol? cfg.local.protocol+'://':'') + cfg.local.domain,
				cfg.wordpress.title,
				cfg.wordpress.admin,
				cfg.wordpress.password,
				cfg.wordpress.email,
				cfg.wordpress.skip_email
			)
			.then(r=>process_log(r.stdout)); 
		});
	}

	iterate_installs(elems,install_fn,name_plural){
		process_log(`Installing ${name_plural}`);
		return Promise.all(elems.map(elem=>
			this.wp_api[install_fn](elem[0],elem[1])
			.then(r=>{process_log(`Installing ${elem[0]}`);return r})
			.then(r=>process_log(r.stdout))
			.catch(e=>{process_log(`Installing ${elem[0]}`);process_log(e.message)})
		)).then(r=>process_log(`${name_plural} installation finished`))
	}

	install_wp_themes(cfg){ 
		if(cfg && cfg.wordpress && cfg.wordpress.themes && cfg.wordpress.themes instanceof Array) return this.iterate_installs(cfg.wordpress.themes,'install_theme','Themes')
		else return Promise.resolve(process_log('No themes to install'))
	}

	install_wp_plugins(cfg){ 
		if(cfg && cfg.wordpress && cfg.wordpress.plugins && cfg.wordpress.plugins instanceof Array) return this.iterate_installs(cfg.wordpress.plugins,'install_plugin','Plugins')
		else return Promise.resolve(process_log('No plugins to install'))
	}
	
	/******************************************
	* RESTORE DUPLICATOR BACKUP
	******************************************/
	configure_duplicator_installer(cfg){
		let installer = path.join(cfg.local.path,'installer.php');
		return this.fs_api.replace_in_file(installer,[
			{find:/\$GLOBALS\[\'FW_DBNAME\'\]\s*?=\s*?\'\';/,replace:`$GLOBALS['FW_DBNAME'] = '${cfg.local.database.name}';`},
			{find:/\$GLOBALS\[\'FW_DBUSER\'\]\s*?=\s*?\'\';/,replace:`$GLOBALS['FW_DBUSER'] = '${cfg.local.database.user}';`},
			{find:/\$GLOBALS\[\'FW_DBPASS\'\]\s*?=\s*?\'\';/,replace:`$GLOBALS['FW_DBPASS'] = '${cfg.local.database.password}';`},
			{find:/\$GLOBALS\[\'CURRENT_ROOT_PATH\'\]\s*?=\s*?dirname\(__FILE__\);/,replace:`$GLOBALS['CURRENT_ROOT_PATH'] = "${cfg.local.path}";`},
			{find:'<input id="accept-warnings" name="accpet-warnings"',replace:'<input id="accept-warnings" name="accpet-warnings" checked="checked"'},
		]).then(()=>process_log('Duplicator Installer configured'))
	}
	
	get_duplicator_names(cfg){
		return Promise.resolve([
			cfg.remote.duplicator_files_prefix + '_archive.zip',
			cfg.remote.duplicator_files_prefix + '_database.sql',
			cfg.remote.duplicator_files_prefix + '_installer.php',
		]);
	}
	get_duplicator_installer_name(cfg){ 
		return cfg.remote.duplicator_files_prefix + '_installer.php';	
	}

	is_duplicator_installer_file(cfg,filename){
		return cfg.restore_mode==='duplicator' && filename === this.get_duplicator_installer_name(cfg);
	}


	/******************************************
	* RESTORE WP MIGRATE DB BACKUP
	******************************************/
	get_migratedb_names(cfg){
		return Promise.resolve([
			cfg.remote.backup_files,
			cfg.remote.backup_database,
		]);
	}

	find_files_all_names(cfg,{list,no_skip_main}){
		let result = [];
		let mainfile = cfg.remote.backup_files;
		let find = new RegExp(mainfile.replace(/\.zip/,'')+'\\.z');
		list.map(elem=>{
			if((no_skip_main || elem.name!==mainfile) && elem.name.match(find)!==null) result.push(elem.name);
		});
		return result;
	}

	get_migratedb_remote_files_all_names(cfg){
		return this.ftp_api.scan_folder(path.dirname(cfg.remote.backup_files)).then(list=>this.find_files_all_names(cfg,{list}));
	}

	unzip_migratedb_files(cfg,{multipart_support}){
		process_log(`Extracting ${cfg.remote.backup_files}`);
		return this.fs_api.decompress(
				path.join(cfg.local.backup_dir,path.basename(cfg.remote.backup_files)),
				path.dirname(cfg.local.path),
				multipart_support
		)
		.then(process_log(`Extracted ${cfg.remote.backup_files}`));
	}

	migratedb_replace_domain(cfg){ 
		process_log('Replacing domain name in database');
		return this.wp_api.migratedb_find_replace(rWTrim(cfg.remote.domain).replace(/https{0,1}:\/\//,''),rWTrim(cfg.local.domain).replace(/https{0,1}:\/\//,''))
			.then(()=>process_log('Replaced domain name in database')); 
	}
	migratedb_replace_path(cfg){ 
		process_log(`Replacing path name in database`);
		return this.wp_api.migratedb_find_replace(
				rPTrim(cfg.remote.path),
				rPTrim(cfg.local.path)
			)
			.then(()=>process_log('Replaced path name in database')); 
	}

	wp_replace_domain(cfg){ 
		process_log('Replacing domain name in database (WP)');
		return this.wp_api.find_replace(rWTrim(cfg.remote.domain).replace(/https{0,1}:\/\//,''),rWTrim(cfg.local.domain).replace(/https{0,1}:\/\//,''))
			.then(()=>process_log('Replaced domain name in database')); 
	}
	wp_replace_path(cfg){ 
		process_log(`Replacing path name in database (WP)`);
		return this.wp_api.find_replace(
				rPTrim(cfg.remote.path),
				rPTrim(cfg.local.path)
			)
			.then(()=>process_log('Replaced path name in database')); 
	}

	install_migratedb_database(cfg){
		process_log(`Running script ${cfg.remote.backup_database}`);
		return 		this.database_api.run_script(path.join(cfg.local.backup_dir,path.basename(cfg.remote.backup_database)))
		.then(()=>	process_log(`Script ${cfg.remote.backup_database} executed`))
		.then(()=>	this.migratedb_replace_domain(cfg))
		.then(()=>	this.migratedb_replace_path(cfg))
		;
	}

	install_database(cfg){
		process_log(`Running script ${cfg.remote.backup_database}`);
		return 		this.database_api.run_script(path.join(cfg.local.backup_dir,path.basename(cfg.remote.backup_database)))
		.then(()=>	process_log(`Script ${cfg.remote.backup_database} executed`))
		.then(()=>	this.wp_replace_domain(cfg))
		.then(()=>	this.wp_replace_path(cfg))
		;
	}

	/******************************************
	* GENERAL RESTORE BACKUP FUNCTIONS
	******************************************/
	get_backup_full_names(cfg,look_for_parts){
		let the_promise;
		let extras = [];
		switch(cfg.restore_mode){
			case 'manual':
				the_promise = this.get_migratedb_names(cfg).then(names=>{
					if(look_for_parts) return this.get_migratedb_remote_files_all_names(cfg).then(extras=>names.concat(extras));
					else return names;
				});
				break;
			case 'duplicator':
				the_promise = this.get_duplicator_names(cfg);
				break;
			
			default:throw new Error('Wrong restore mode'); break;
		}

		return the_promise.then(names=>names.map(filename=>{
			let the_filename = path.basename(filename);
			let the_folder = cfg.remote[cfg.restore_mode+'_backups_folder'] || cfg.remote.backups_folder || '';

			let the_download = cfg.download_method=='get'? 
								(`${rWTrim(cfg.remote.domain)}/${lWTrim(rWTrim(the_folder))}/${lWTrim(the_filename)}`).replace(/\/\/+/g,'/') : 
								path.join(the_folder,the_filename);
			return {
				filename:				the_filename,
				remote_backup_filename:	the_download,
				local_backup_filename:	path.join(cfg.local.backup_dir,the_filename),
				installation_filename:	path.join(cfg.local.path , (this.is_duplicator_installer_file(cfg,the_filename)?'installer.php':the_filename) ),
			};
		}));
	}

	fileproc(backup_full_names,fn){
		return Promise.all(backup_full_names.map(filenames=>fn(filenames)));
	}

	delete_local_files(backup_full_names){
		return this.fileproc(backup_full_names, ({local_backup_filename}) => this.fs_api.delete_file(local_backup_filename) )
			.then(()=>process_log('All backup files deleted'));
	}

	find_local_files(backup_full_names){
		return this.fileproc(backup_full_names, ({local_backup_filename}) => this.fs_api.read_file(local_backup_filename) )
			.then(()=>process_log('All backup files found in storage'));
	}

	download_files(download_method='get',backup_full_names,backup_owner){
		let downloader = download_method=='ftp'? this.ftp_api : this.fs_api;
		return this.fileproc(backup_full_names,({filename,remote_backup_filename,local_backup_filename})=>{
			process_log('Downloading '+remote_backup_filename);
			return downloader.download_file(remote_backup_filename,local_backup_filename,backup_owner).then(result=>process_log('Downloaded '+filename));
		}).then(()=>process_log('All backup files downloaded'));
	}
	
	transfer_files(backup_full_names){
		return this.fileproc(backup_full_names,({filename,local_backup_filename,installation_filename})=>{
			process_log('Copying '+filename);
			return this.ftp_api.copy_file(local_backup_filename,installation_filename)
				.then(result=>process_log('Copied '+filename))
		}).then(()=>process_log('All backup files transfered'));
	}

	/******************************************
	* PRESET ROUTINES 
	******************************************/

	full_site_init(cfg){
		return this.vesta_api.user_exists(cfg.vesta.user_name)
			.then(exists=>!exists? this.create_user(cfg) : (cfg.restart_user? this.restart_user(cfg) : true))
			.then(()=>this.vesta_api.domain_exists(cfg.local.domain,cfg.vesta.user_name))
			.then(exists=>{
				if(exists && !cfg.restart_domain) return this.clean_domain_dir(cfg);
				else if(exists && cfg.restart_domain) return this.restart_domain(cfg);
				else return this.vesta_api.domain_exists(cfg.local.domain)
					.then(exists=>{
						if(exists) throw new Error(`Domain ${cfg.local.domain} already exists for another user`);
						else return this.create_domain(cfg);
					})
			})
			.then(()=>	this.restart_database(cfg))
		;
	}

	full_site_wp_install(cfg){
		return this.full_site_init(cfg)
			.then(()=>this.download_wp(cfg))
			.then(()=>this.config_wp(cfg))
			.then(()=>this.install_wp(cfg))
			/*.then(()=>Promise.all([
				this.install_wp_themes(cfg),
				this.install_wp_plugins(cfg)
			]))*/
			.then(()=>this.install_wp_themes(cfg))
			.then(()=>this.install_wp_plugins(cfg))
		;
	}


	get_backup_files(download_method,backup_full_names,backup_owner){
		return this.find_local_files(backup_full_names).then(()=>backup_full_names
		/*{
			if(this.cfg.force_download_backups){
				process_log('Forcing download');
				return 			this.delete_local_files(backup_full_names).catch(e=>{})
					.then(()=>	this.download_files(download_method,backup_full_names));
			}
		}*/
		)
		.catch(e=>{
			process_log('Downloading backups');
			return this.download_files(download_method,backup_full_names,backup_owner);
		});
	}

	install_backup_files(cfg,backup_full_names){
		let the_promise;
		if(backup_full_names) the_promise = Promise.resolve(backup_full_names);
		else the_promise = this.get_backup_full_names(cfg,false);

		if(cfg.restore_mode==='duplicator'){
			return 		the_promise
			.then(()=>	this.transfer_files(backup_full_names))
			.then(()=>	this.configure_duplicator_installer(cfg) );
		}
		else if(cfg.restore_mode==='manual'){
			return 		the_promise
			.then(()=>	this.unzip_migratedb_files(cfg,{multipart_support:false}))
			.then(()=>	this.config_wp_manually(cfg))
			// .then(()=>	this.install_migratedb_database(cfg));
			.then(()=>	this.install_database(cfg));
		}
	}
	
	download_backup_files(cfg,backup_full_names){
		let the_promise;
		if(backup_full_names) the_promise = backup_full_names;
		else the_promise = this.get_backup_full_names(cfg,false);

		return this.create_user_backup_folder(cfg)
			.then(()=>the_promise)
			.then(backup_full_names=>this.get_backup_files(cfg.download_method,backup_full_names,cfg.local.backup_dir_owner)
			.then(backup_full_names=>backup_full_names));
	}

	full_site_backup_restore(cfg){
		return this.full_site_init(cfg)
			.then(()=>this.get_backup_full_names(cfg,false))
			.then(backup_full_names=>this.download_backup_files(cfg,backup_full_names))
			.then(backup_full_names=>this.install_backup_files(cfg,backup_full_names))
	}

}

exports.Installer = Installer;