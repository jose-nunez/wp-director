const { SystemAPI } = require('./system_api');


class VestaAPI extends SystemAPI{

	/* ***************************
	CRUD
	****************************** */
	constructor(v_user_name){
		super(v_user_name);
	}

	delete_user(v_user_name){ 
		return this.sys_call('v-delete-user',v_user_name);
	}

	create_user(v_user_name,password,email){ 
		return this.sys_call('v-add-user',v_user_name,password,email);
	}

	create_database(v_user_name,db_name_sufix,db_user_sufix,db_pass){ 
		return this.sys_call('v-add-database',v_user_name,db_name_sufix,db_user_sufix,db_pass);
	}

	remove_database(v_user_name,db_name){ 
		return this.sys_call('v-delete-database',v_user_name,db_name);
	}

	create_domain(v_user_name,domain_name){ 
		return this.sys_call('v-add-domain',v_user_name,domain_name)
			.then(()=>this.sys_call('v-delete-web-domain-alias',v_user_name,domain_name,'www.'+domain_name));
	}
	add_letsencrypt(v_user_name,domain_name){ 
		return this.sys_call('v-add-letsencrypt-domain',v_user_name,domain_name);
	}

	remove_domain(v_user_name,domain_name){ 
		return this.sys_call('v-delete-domain',v_user_name,domain_name);
	}

	/* ***************************
	Read
	****************************** */

	get_users(){
		return this.sys_call('v-list-sys-users','json').then(childProcess=>JSON.parse(childProcess.stdout));
	}

	get_domains(v_user_name){
		let list_domains = 
				v_user_name=>this.sys_call('v-list-web-domains',v_user_name,'json')
				.then(childProcess=>Object.keys(JSON.parse(childProcess.stdout)).map(domain=>({domain,user_name:v_user_name})));
		
		if(v_user_name) return list_domains(v_user_name);
		else{
			return this.get_users().then(users=>{
				return Promise.all(users.map(user=>list_domains(user)))
				.then(domains_arr=>domains_arr.reduce((accumulator, currentValue)=>accumulator.concat(currentValue),[]));
			});
		}
	}

}

exports.VestaAPI = VestaAPI;