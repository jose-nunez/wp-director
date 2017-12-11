const { Installer } = require('./operators/installer.js');
const { VestaAPI } = require('./api/vesta_api');
const settings = require('./modules/settings');

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


let run_operation = exports.run_operation = (app_args)=>{
	return settings.getSettings(app_args.settings_file,app_args).then(newSet=>{
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

