const { FileSystemAPI } = require('./file_system_api');
const Client = require('ftp');

class FTP_API extends FileSystemAPI{
	constructor(v_user_name,connection){
		super(v_user_name);
		this.connection = connection;
	}

	connect(){
		return new Promise((resolve,reject)=>{
			let connector = new Client();
			connector.on('ready',()=>resolve(connector));
			connector.on('error',err=>reject(err));
			connector.connect(this.connection);
		});
	}

	scan_folder_aux(connector,path){
		return new Promise((resolve,reject)=>{
			connector.list(path,(list_err,list)=>{
				connector.end();
				if (list_err) reject(list_err);
				resolve(list);
			});
		});
	}
	scan_folder(path){
		return this.connect().then(connector=>this.scan_folder_aux(connector,path));
	}

	
	get_file(connector,source){
		return new Promise((resolve,reject)=>{
			connector.get(source,(get_err,get_stream)=>{
				if (get_err){ 
					reject(get_err);
					return;
				}
				get_stream.once('close',()=>connector.end());
				resolve(get_stream);
			});
		});
	}

	download_file(source,dest,noupdateuser) {
		return this.connect()
			.then((connector)=>this.get_file(connector,source))
			.then((read)=>this.write_file(read,dest))
			.then(()=>!noupdateuser?this.update_owner(dest):false);
	}

}

exports.FTP_API = FTP_API;