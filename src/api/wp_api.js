const { SystemAPI } = require('./system_api');


class WP_API extends SystemAPI{

	constructor(v_user_name,path){
		super(v_user_name);
		this.path = path;
	}


	/*wpu(...args){
		args.unshift(`--path='${this.path}'`);
		this.sys_call_user.call(this,args);
	}*/

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

	find_replace(find,replace){
		return this.sys_call_user('wp search-replace',
			// `${find}`,
			// `${replace}`,
			find,
			replace,
			`--all-tables`,
			`--path='${this.path}'`,
		);
	}

	update_option(key/*DOT NOTATION!*/,value){

		/*	
			wp option get et_divi --format=json --allow-root | php -r "\$option=json_decode(fgets(STDIN));\$option->et_pb_product_tour_global = \"false\";print json_encode(\$option);" | wp option set et_divi --format=json --allow-root
			wp option get et_divi --format=json --allow-root | php -r "\$option=json_decode(fgets(STDIN));\$option->et_pb_product_tour_global = \"on\";print json_encode(\$option);" | wp option set et_divi --format=json --allow-root
			
			wp option get et_divi --format=json --allow-root | php -r "\$option=json_decode(fgets(STDIN));\$option->divi_fixed_nav = \"false\";print json_encode(\$option);" | wp option set et_divi --format=json --allow-root
			wp option get et_divi --format=json --allow-root | php -r "\$option=json_decode(fgets(STDIN));\$option->divi_fixed_nav = \"on\";print json_encode(\$option);" | wp option set et_divi --format=json --allow-root





			const { WP_API } = require('./api/wp_api');
			wp_api.update_option('et_divi','et_pb_product_tour_global')
			let wp_api = new WP_API('jose','/home/jose/web/jose-2.webchemistry.studio/public_html/');
		*/

		let split_key = key.split('.');
		if(split_key.length==1){
			return this.sys_call_user('wp option update', 
				`--path='${this.path}'`,
				split_key,
				value,
			)
		}
		/*if(opt_key){
			return this.sys_call_user(
				`wp option get ${opt_name} --format=json`,`--path='${this.path}'`,
				`| php -r "$option=json_decode(fgets(STDIN));$option->${opt_key} = "false";print json_encode($option);"`,
				`| wp option set ${opt_name} --format=json`,`--path='${this.path}'`,
			);
		}
		else{
			
		}*/

	}
}

exports.WP_API = WP_API;