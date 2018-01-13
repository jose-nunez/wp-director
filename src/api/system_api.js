const userid = require('userid');
const { exec } = require('child-process-promise');
const { spawn } = require('child_process');
const shellescape = require('shell-escape');


// let instance = null;

class SystemAPI{
	constructor(v_user_name){
		this.setUser(v_user_name);
	}

	setUser(v_user_name){
		this.v_user_name = v_user_name;
		if(v_user_name) try{
			this.v_user_guid={uid:userid.uid(v_user_name),gid:userid.gid(v_user_name)};
		}catch(e){}
	}

	sys_call_user(...args){
		// let cmd = shellescape(args);
		let cmd = args.join(" ");
		return exec(cmd,this.v_user_guid).catch(e=>{throw new Error(e.stderr)});
	}
	sys_call(...args){
		// let cmd = shellescape(args);
		let cmd = args.join(" ");
		return exec(cmd);
	}

	sys_call_stream(command,args){
		return Promise.resolve(spawn(command,args).stdout);
	}
}

exports.SystemAPI = SystemAPI;