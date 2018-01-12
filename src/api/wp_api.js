const { SystemAPI } = require('./system_api');


class WP_API extends SystemAPI{

	constructor(v_user_name,path){
		super(v_user_name);
		this.path = path;
	}

	download(locale,version){
		return this.sys_call_user('wp core download',
			`--path='${this.path}'`,
			locale? `--locale='${locale}'`:'',
			version? `--version='${version}'`:'',
			);
	}

	config(db_name,db_user,db_pass){ 
		return this.sys_call_user('wp config create',
			`--path='${this.path}'`,
			`--dbname='${db_name}'`,
			`--dbuser='${db_user}'`,
			`--dbpass='${db_pass}'`
		);
	}

	install(url,title,admin_user,admin_password,admin_email,skip_email/*,skip_themes*/){
		return this.sys_call_user('wp core install',
			`--path='${this.path}'`,
			`--url='${url}'`,
			`--title='${title}'`,
			`--admin_user='${admin_user}'`,
			admin_password? `--admin_password='${admin_password}'`:'',
			`--admin_email='${admin_email}'`,
			skip_email?`--skip-email`:'',
			// skip_themes?`--skip-themes=all`:'',
		);
	}

	install_theme(theme,activate){ return this.sys_call_user('wp theme install',`--path='${this.path}'`,`${theme}`,activate?`--activate`:'');}
	install_plugin(plugin,activate){ return this.sys_call_user('wp plugin install',`--path='${this.path}'`,`${plugin}`,activate?`--activate`:'');}

	migratedb_find_replace(find,replace){
		return this.sys_call_user('wp migratedb find-replace',
			`--path='${this.path}'`,
			`--find="${find}"`,
			`--replace="${replace}"`
		);
	}
}

exports.WP_API = WP_API;