const path = require('path');

const { VestaAPI } = require('./api/vesta_api');
const { WP_API } = require('./api/wp_api');
const { FileSystemAPI } = require('./api/file_system_api');
const { FTP_API } = require('./api/ftp_api');
const { DataBaseAPI } = require('./api/data_base_api');
const { server_log } = require('./modules/util.js');

class Installer{

	constructor(cfg){
		this.vesta_api;
		this.wp_api;
		this.fs_api;
		this.ftp_api;
		this.database_api;

		this.cfg = cfg;
		this.db_name = cfg.v_user_name+'_'+cfg.db_name_sufix;
		this.db_user = cfg.v_user_name+'_'+cfg.db_user_sufix;
		this.pre_domain_path = `/home/${cfg.v_user_name}/web/${cfg.domain_name}/`;
		this.domain_path = this.pre_domain_path+`public_html/`;
		this.domain_path_nts = this.pre_domain_path+`public_html`; //NO TRAILING SLASH
		this.local_backup_dir = `/home/admin/storage/backups/${cfg.v_user_name}/`;

		this.init_vesta_api();
		// Reinitiate in case of User restart
		this.init_wp_api();
		this.init_fs_api();
		this.init_ftp_api();
		this.init_database_api();
	}


	/******************************************
	* APIs 
	******************************************/
	init_vesta_api(){ this.vesta_api = new VestaAPI(/*DON'T CHANGE USER*/);	}
	init_wp_api(){ this.wp_api = new WP_API(this.cfg.v_user_name,this.domain_path); } // Init after created Vesta User!
	init_fs_api(){ this.fs_api = new FileSystemAPI(this.cfg.v_user_name); } // Init after created Vesta User!
	init_ftp_api(){ this.ftp_api = new FTP_API(this.cfg.v_user_name,this.cfg.backup_ftp_connection); } // Init after created Vesta User!
	init_database_api(){ this.database_api = new DataBaseAPI(this.cfg.v_user_name,this.db_name,this.db_user,this.cfg.db_pass); } // Init after created Vesta User!

	/******************************************
	* VESTA ADMIN 
	******************************************/

	delete_user(){
		/*if(this.cfg.delete_user) return this.vesta_api.delete_user(this.cfg.v_user_name).then((result)=>server_log('Deleted vesta user'));
		else return new Promise((resolve, reject)=>resolve("Te salvaste ql!"));  */
		return this.vesta_api.delete_user(this.cfg.v_user_name).then((result)=>server_log('Deleted vesta user'));
	}

	create_user(){ return this.vesta_api.create_user(this.cfg.v_user_name,this.cfg.v_user_password,this.cfg.v_user_email).then((result)=>server_log('Created vesta user')); }

	create_domain(){ 
		return 		this.vesta_api.create_domain(this.cfg.v_user_name,this.cfg.domain_name).then((result)=>server_log('Created domain'))
		.then(()=>	this.vesta_api.add_letsencrypt(this.cfg.v_user_name,this.cfg.domain_name).then((result)=>server_log('Added Lets Encrypt'))).catch(e=>server_log(e.stdout));

	}

	clean_domain_dir(){
		let robots_src  = this.vesta_api.getDefaultRobotsFileName();
		let robots_dst  = this.domain_path + path.basename(robots_src);
		
		return 		this.fs_api.delete_folder(this.domain_path,true)
		.then(()=>	this.fs_api.copy_file(robots_src,robots_dst))
		.then(()=>	this.fs_api.create_dir(this.domain_path)).then(()=>server_log('Domain folder cleaned'));
	}

	remove_domain(){ return this.vesta_api.remove_domain(this.cfg.v_user_name,this.cfg.domain_name).then((result)=>server_log('Removed domain')); }

	remove_database(){ return this.vesta_api.remove_database(this.cfg.v_user_name,this.db_name).then((result)=>server_log('Removed database')); }

	create_database(){ return this.vesta_api.create_database(this.cfg.v_user_name,this.cfg.db_name_sufix,this.cfg.db_user_sufix,this.cfg.db_pass).then((result)=>server_log('Created database')); }

	/******************************************
	* WORDPRESS INSTALL 
	******************************************/

	download_wp(){ return this.wp_api.download().then((result)=>server_log(result.stdout)); }

	config_wp(){ return this.wp_api.config(this.db_name,this.db_user,this.cfg.db_pass).then((result)=>server_log(result.stdout)); }
	
	// https://regex101.com/r/pitmX3/1
	config_wp_manually(){
		let wpconfig = this.domain_path + 'wp-config.php';
		return this.fs_api.replace_in_file(wpconfig,[
			{find:/define\s*?\(\s*?('|")DB_NAME('|")\s*?,\s*?('|").*?('|")\s*?\)\s*?;/g,replace:`define('DB_NAME','${this.db_name}');`},
			{find:/define\s*?\(\s*?('|")DB_USER('|")\s*?,\s*?('|").*?('|")\s*?\)\s*?;/g,replace:`define('DB_USER','${this.db_user}');`},
			{find:/define\s*?\(\s*?('|")DB_PASSWORD('|")\s*?,\s*?('|").*?('|")\s*?\)\s*?;/g,replace:`define('DB_PASSWORD','${this.cfg.db_pass}');`},
		]).then(()=>server_log('File wp-config succesfully'));
	}

	install_wp(){ return this.wp_api.install(this.cfg.domain_name,this.cfg.title,this.cfg.admin_user,this.cfg.admin_password,this.cfg.admin_email,this.cfg.skip_email).then((result)=>server_log(result.stdout)); }

	install_wp_themes(){ this.cfg.install_themes.forEach(theme=>(this.wp_api.install_theme(theme[0],theme[1]).then(result=>server_log(result.stdout)))); }

	install_wp_plugins(){ this.cfg.install_plugins.forEach(plugin=>(this.wp_api.install_plugin(plugin[0],plugin[1]).then(result=>server_log(result.stdout)))); }

	migratedb_replace_domain(){ return this.wp_api.migratedb_find_replace(this.cfg.original_domain,this.cfg.domain_name).then(()=>server_log('Replaced domain name in database')); }
	migratedb_replace_path(){ return this.wp_api.migratedb_find_replace(this.cfg.original_path,this.domain_path_nts).then(()=>server_log('Replaced path name in database')); }
			
	
	/******************************************
	* RESTORE DUPLICATOR BACKUP
	******************************************/
	configure_duplicator_installer(){
		let installer = this.domain_path + 'installer.php';
		return this.fs_api.replace_in_file(installer,[
			{find:/\$GLOBALS\[\'FW_DBNAME\'\]\s*?=\s*?\'\';/,replace:`$GLOBALS['FW_DBNAME'] = '${this.db_name}';`},
			{find:/\$GLOBALS\[\'FW_DBUSER\'\]\s*?=\s*?\'\';/,replace:`$GLOBALS['FW_DBUSER'] = '${this.db_user}';`},
			{find:/\$GLOBALS\[\'FW_DBPASS\'\]\s*?=\s*?\'\';/,replace:`$GLOBALS['FW_DBPASS'] = '${this.cfg.db_pass}';`},
			{find:/\$GLOBALS\[\'CURRENT_ROOT_PATH\'\]\s*?=\s*?dirname\(__FILE__\);/,replace:`$GLOBALS['CURRENT_ROOT_PATH'] = "${this.domain_path}";`},
			{find:'<input id="accept-warnings" name="accpet-warnings"',replace:'<input id="accept-warnings" name="accpet-warnings" checked="checked"'},
		]).then(()=>server_log('Duplicator Installer configured'))
	}
	
	get_duplicator_names(){
		return Promise.resolve([
			this.cfg.duplicator_backup_name + '_archive.zip',
			this.cfg.duplicator_backup_name + '_database.sql',
			this.cfg.duplicator_backup_name + '_installer.php',
		]);
	}
	get_duplicator_installer_name(){ return this.cfg.duplicator_backup_name + '_installer.php';	}
	is_duplicator_installer_file(mode,filename){ return mode==='duplicator' && filename === this.get_duplicator_installer_name();}


	/******************************************
	* RESTORE WP MIGRATE DB BACKUP
	******************************************/
	get_migratedb_names(){
		return Promise.resolve([
			this.cfg.manual_backup_db,
			this.cfg.manual_backup_files,
		]);
	}

	find_files_all_names(list,no_skip_main){
		let result = [];
		let mainfile = this.cfg.manual_backup_files;
		let find = new RegExp(mainfile.replace(/\.zip/,'')+'\\.z');
		list.map(elem=>{
			if((no_skip_main || elem.name!==mainfile) && elem.name.match(find)!==null) result.push(elem.name);
		});
		return result;
	}

	get_migratedb_remote_files_all_names(){
		return this.ftp_api.scan_folder(this.cfg.remote_backup_dir).then(list=>this.find_files_all_names(list));
	}
	/*get_migratedb_local_files_all_names(){
		return this.fs_api.scan_folder(this.local_backup_dir).then(list=>this.find_files_all_names(list,true));
	}*/

	unzip_migratedb_files(multipart_support){
		/*return this.get_migratedb_local_files_all_names().then(sources=>{
			return this.fs_api.decompress(sources.map(filename=>(this.local_backup_dir+filename)),this.pre_domain_path,multipart_support).then('Uzipped files');
		});*/
		server_log(`Extracting ${this.cfg.manual_backup_files}`);
		return this.fs_api.decompress(this.local_backup_dir+this.cfg.manual_backup_files,this.pre_domain_path,multipart_support).then(server_log(`Extracted ${this.cfg.manual_backup_files}`));
	}

	install_migratedb_database(){
		server_log('Running script '+this.cfg.manual_backup_db);
		return 		this.database_api.run_script(this.local_backup_dir+this.cfg.manual_backup_db).then(()=>server_log('Script executed'))
		.then(()=>	this.migratedb_replace_domain())
		.then(()=>	this.migratedb_replace_path())
		;
	}

	/******************************************
	* GENERAL RESTORE BACKUP FUNCTIONS
	******************************************/
	get_backup_full_names(mode,method,look_for_parts){
		let the_promise;
		let extras = [];
		switch(mode){
			case 'migratedb':
				the_promise = this.get_migratedb_names().then(names=>{
					if(look_for_parts) return this.get_migratedb_remote_files_all_names().then(extras=>names.concat(extras));
					else return names;
				});
				break;
			case 'duplicator':
				the_promise = this.get_duplicator_names();
				break;
			
			default:break;
		}

		return the_promise.then(names=>names.map(filename=>({
			filename:				filename,
			remote_backup_filename:	(method=='get'?this.cfg.original_domain:'') + this.cfg.remote_backup_dir + filename,
			local_backup_filename:	this.local_backup_dir+filename, 	
			installation_filename:	this.domain_path + (this.is_duplicator_installer_file(mode,filename)?'installer.php':filename),
		})));
	}

	fileproc(backup_full_names,fn){
		return Promise.all(backup_full_names.map(filenames=>fn(filenames)));
	}

	delete_local_files(backup_full_names){
		return this.fileproc(backup_full_names,({local_backup_filename})=>this.fs_api.delete_file(local_backup_filename))
			.then(()=>server_log('All backup files deleted'));
	}

	find_local_files(backup_full_names){
		return this.fileproc(backup_full_names,({local_backup_filename})=>this.fs_api.read_file(local_backup_filename))
			.then(()=>server_log('All backup files found in storage'));
	}

	download_files(method='get',backup_full_names){
		let downloader = method=='ftp'? this.ftp_api : this.fs_api;
		return this.fileproc(backup_full_names,({filename,remote_backup_filename,local_backup_filename})=>{
			server_log('Downloading '+remote_backup_filename);
			return downloader.download_file(remote_backup_filename,local_backup_filename,true).then(result=>server_log('Downloaded '+filename));
		}).then(()=>server_log('All backup files downloaded'));
	}
	
	transfer_files(backup_full_names){
		return this.fileproc(backup_full_names,({filename,local_backup_filename,installation_filename})=>{
			server_log('Copying '+filename);
			return this.ftp_api.copy_file(local_backup_filename,installation_filename)
				.then(result=>server_log('Copied '+filename))
		}).then(()=>server_log('All backup files transfered'));
	}

	/******************************************
	* PRESET ROUTINES 
	******************************************/

	create_user_backup_folder(){
		return this.fs_api.create_dir(this.local_backup_dir);
	}

	restart_user(){
		return 		this.delete_user().catch(err=>server_log('Vesta user not deleted'))
		.then(()=>	this.create_user())
		.then(()=>{
			// Restarting APIS for new user
			this.init_fs_api();
			this.init_ftp_api();
			this.init_wp_api();
			this.init_database_api();
			return;
		})
		.catch(err=>server_log('Failed to create vesta user'))
	}

	restart_domain(){
		return 		this.remove_domain().catch(err=>server_log('Failed to remove domain'))
		.then(()=>	this.create_domain());
	}

	restart_database(){
		return 		this.remove_database().catch(err=>server_log('Failed to remove database'))
		.then(()=>	this.create_database());
	}

	full_site_init(delete_user,restart_domain){
		return 			(delete_user? this.restart_user() : Promise.resolve(true))
			.then(()=>	this.create_user_backup_folder())
			.then(()=>	(restart_domain? this.restart_domain() : this.clean_domain_dir()))
			.then(()=>	this.restart_database())
		;
	}

	full_site_wp_install(delete_user,restart_domain){
		return this.full_site_init(delete_user,restart_domain)
		.then(()=>this.download_wp())
		.then(()=>this.config_wp())
		.then(()=>this.install_wp())
		.then(()=>{
			this.install_wp_themes();
			this.install_wp_plugins();
		})
		;
	}


	get_backup_files(download_method,backup_full_names){
		return this.find_local_files(backup_full_names).then(()=>{
			if(this.cfg.force_download_backups){
				server_log('Forcing download');
				return 			this.delete_local_files(backup_full_names).catch(e=>{})
					.then(()=>	this.download_files(download_method,backup_full_names));
			}
		})
		.catch(e=>{
			server_log('Downloading backups');
			return this.download_files(download_method,backup_full_names);
		});
	}

	install_backup_files(mode,backup_full_names){
		if(mode==='duplicator'){
			return 	this.transfer_files(backup_full_names)
			.then(	()=>this.configure_duplicator_installer() );
		}
		else if(mode==='migratedb'){
			return 		this.unzip_migratedb_files(false)
			.then(()=>	this.config_wp_manually())
			.then(()=>	this.install_migratedb_database());
		}
	}

	full_site_backup_restore({mode,delete_user,restart_domain,download_method}){	
		return this.full_site_init(delete_user,restart_domain)
			.then(()=>this.get_backup_full_names(mode,download_method,false))
			.then(backup_full_names=>
				this.get_backup_files(download_method,backup_full_names).then(()=>this.install_backup_files(mode,backup_full_names))
			)
			.catch(e=>server_log('Failed full_site_init',e));
	}
}

exports.Installer = Installer;