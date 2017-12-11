const { printDate } = require('./util.js');

let log_file = false;
let log_server = false;
let log_console = true;

let init_log = exports.init_log = (_log_file,_log_console,_log_server)=>{
	log_file = _log_file;
	log_server = _log_server;
	log_console = _log_console;
}

let server_log = exports.server_log = function(...args){
	process.stdout.write(printDate()+' ');
	if(log_console) console.log.apply(null,args);
	if(log_file) ;
}

/*let server_print = exports.server_print = function(...args){
	if(log_server) server_log.apply(null,args);
}*/

/*let server_log_ln = exports.server_log_ln = function(...args){
	args.push('\n');
	args.unshift('\n');
	server_log.apply(null,args);
}*/

let server_error = exports.server_error = function(e){
	process.stdout.write(printDate()+' ');
	if(!e) console.error('Unknown Error');
	console.log.apply(null,[`${e.name||''} ${e.message||''} ${e.stdout||''}`]);
}