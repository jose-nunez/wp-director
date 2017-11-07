const { SystemAPI } = require('./system_api');

class DataBaseAPI extends SystemAPI{

	constructor(v_user_name,db_name,db_user,db_pass){
		super(v_user_name);
		if(!db_name || !db_user || !db_pass) throw new Error('DataBaseAPI error: no credentials defined');
		this.db_name = db_name;
		this.db_user = db_user;
		this.db_pass = db_pass;
	}

	run_gzip(source){
		// require('child-process-promise').exec('zcat /home/admin/storage/backups/airconditioningsales/aircon_201710021902_db_compatible.sql.gz | mysql -u 'aircon_us' -pblsCE9dvTDk aircon_db').then(()=>console.log('wena wena')).catch(e=>console.log('cago la wea',e))
		return this.sys_call('zcat',source,'|','mysql',`-u${this.db_user}`,`-p${this.db_pass}`,this.db_name);
	}

	run_script(source){
		if(source.match(/\.gz/)){
			return this.run_gzip(source);
		}
		else{
			return this.sys_call('mysql',`-u${this.db_user}`,`-p${this.db_pass}`,this.db_name,`< ${source}`);
		}
	}

	/*
	zcat /home/admin/storage/backups/airconditioningsales/aircon_201710021902_db_compatible.sql.gz | mysql -u 'aircon_us' -pblsCE9dvTDk aircon_db
	wp migratedb --path='/home/aircon/web/aircon-4.webchemistry.studio/public_html/' find-replace --find="//www.airconditioningsales.com.au" --replace="//aircon-4.webchemistry.studio" --allow-root
	wp migratedb --path='/home/aircon/web/aircon-4.webchemistry.studio/public_html/' find-replace --find="/home/wwwairco/public_html" --replace="/home/aircon/web/aircon-4.webchemistry.studio/public_html" --allow-root
	*/

}

exports.DataBaseAPI = DataBaseAPI;