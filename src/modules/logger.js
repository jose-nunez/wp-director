const { printDate } = require('./util.js');

let logs = [];
let process_logs = [];

function file_log(...args){

}

function console_log(...args){
	console.log(...args);
}

let init_log = exports.init_log = (log_file,log_console)=>{
	log_file = logs.push(file_log);
	log_console = logs.push(console_log);
}

let attach_process_log_function = exports. attach_process_log_function = (fn)=>{
	process_logs.push(fn);
}

let process_log = exports.process_log = (...args)=>{
	process_logs.map(fn=>fn.apply(null,[printDate(),...args]));
	server_log(...args);
}

let server_log = exports.server_log = function(...args){
	logs.map(fn=>fn.apply(null,[printDate(),...args]));
}

let server_error = exports.server_error = function(e){
	let args = [];
	if(!e) args = ['Unknown Error'];
	else args = [`${e.name||''} ${e.message||''} ${e.stdout||''}`];
	logs.map(fn=>fn.apply(null,args));
}

