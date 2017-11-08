const { SystemAPI } = require('./system_api');
const userid = require('userid');
const http = require('http');
const fse = require('fs-extra');
const rimraf = require('rimraf');
const Util = require('../modules/util');

class FileSystemAPI extends SystemAPI{

	constructor(v_user_name){
		super(v_user_name);
	}

	update_owner(dest){
		if(this.v_user_name) return fse.chown(dest,userid.uid(this.v_user_name),userid.gid(this.v_user_name));
	}

	delete_file(src){
		return fse.remove(src);
	}
	delete_folder(path,force){
		if(force) return new Promise((resolve,reject)=>{
			try{ rimraf(path,()=>resolve());
			}catch(e){ reject(e); }
		});
		else return this.sys_call('rm','-rf',path);
	}

	create_dir(path){
		return fse.mkdirp(path).then(()=>this.update_owner(path));
	}

	read_file(src){
		return new Promise((resolve,reject)=>{
			let is_error = false;
			let read = fse.createReadStream(src);
			read.on('error',err=>reject(err));
			read.on('open',()=>resolve(read));
		});
	}

	write_file(pipeable,dest){
		return new Promise((resolve,reject)=>{
			let file = fse.createWriteStream(dest);
			file.on('finish',()=>file.close(resolve));
			file.on('error',err=>reject(err));
			pipeable.pipe(file);
		});
	}

	get_file(url){
		let get = url=>{
			return new Promise((resolve,reject)=>{
				http.get(url,res=>{
					const { statusCode } = res;
					if (statusCode !== 200){
						res.resume();// consume response data to free up memory
						reject(new Error('Request Failed. '+`Status Code: ${statusCode}`));
					}
					resolve(res);
				}).on('error',e=>reject(e));
			});
		}
		
		if(url.match(/http.*/)) return get(url);
		// else return get('https://'+url).catch(err=>get('http://'+url));
		else return get('https://'+url).catch(err=>{}).then(()=>get('http://'+url));
	}
	
	copy_file(src,dest) {
		return fse.copy(src,dest).then(()=>this.update_owner(dest));
	}

	download_file(url,dest,noupdateuser) {
		return this.get_file(url)
			.then((read)=>this.write_file(read,dest))
			.then(()=>!noupdateuser?this.update_owner(dest):false);
	}

	replace_in_file(file,finds_replaces){
		return fse.readFile(file, 'utf8').then(data=>{
			let result = data;
			finds_replaces.forEach(({find,replace})=>{
				if(typeof find === 'string') result = Util.replaceAll(result,find,replace);
				else if(find instanceof RegExp) result = result.replace(find,replace);
			});
			return result;
		}).then(result=>{
			return fse.writeFile(file,result,'utf8');
		});
	}

	scan_folder(path){
		return fse.readdir(path)
		.then(list=>list.map(el=>({name:el}))); //homologates with FTP scan folder output
	}
	compress(source,dest,limitsize){
		// require('child-process-promise').exec('cd /home/aircon/web/aircon-2.webchemistry.studio/ ; zip -q -s 50m -r /home/aircon/aircon_201709301443_files.zip ./public_html').then(()=>console.log('wena wena')).catch(e=>console.log('cago la wea',e))
		return this.sys_call('zip',`-q`,`-r`,limitsize?`-s ${limitsize}m`:'',dest,source).then(()=>this.update_owner(dest));
	}

	join_zip_files(source,dest){
		return this.sys_call('zip',`-q`,`-s 0 ${source}`,`--out ${dest}`).then(()=>this.update_owner(dest));
	}
	decompress(source,dest,multipart_support){
		let joint;
		if(multipart_support){
			joint = source.replace('.zip','_TEMP.zip'); 
			return 			this.join_zip_files(source,joint)
				.then(()=>	this.sys_call_user('unzip','-q','-o',joint,`-d ${dest}`))
				.then(()=>	this.delete_file(joint));
		}
		else{
			return this.sys_call_user('unzip','-q','-o',source,`-d ${dest}`);
		}
	}
	
}

exports.FileSystemAPI = FileSystemAPI;

/*let install_custom = (path,package_slug)=>{
	let package = packages[package_slug?package_slug:'default'];
	let filename = Math.random().toString(36).substring(10) + ".zip";
	let file = fse.createWriteStream(filename);
	let rp = http.get(package.url, function(response) {
		let write_file_stream = response.pipe(file);
		write_file_stream.on('finish',()=>{
			let folder = ''
			if(package.type == 'wp') ;
			else if(package.type == 'theme') folder +='wp-content/themes/';
			else if(package.type == 'plugin') folder +='wp-content/plugins/';
			else return;

			let unzip_file_stream = fse.createReadStream(filename).pipe(unzip.Extract({ path: path+folder }));
			unzip_file_stream.on('finish',()=>{
				//DELETE ZIP!!
			});
		});
	});
	
};*/