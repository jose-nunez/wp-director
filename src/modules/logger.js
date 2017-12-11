const { printDate } = require('./util.js');

let logs = [];

function file_log(...args){

}

function console_log(...args){
	process.stdout.write(printDate()+' ');
	console.log.apply(null,args);
}

let init_log = exports.init_log = (log_file,log_console)=>{
	log_file = logs.push(file_log);
	log_console = logs.push(console_log);
}

let attach_log_function = exports.attach_log_function = (fn)=>{
	logs.push(fn);
}

let server_log = exports.server_log = function(...args){
	logs.map(fn=>fn.apply(null,args));
}

let server_error = exports.server_error = function(e){
	let args = [];
	if(!e) args = ['Unknown Error'];
	else args = [`${e.name||''} ${e.message||''} ${e.stdout||''}`];
	logs.map(fn=>fn.apply(null,args));
}

