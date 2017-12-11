const settings = require('./modules/settings');
const { printDate } = require('./modules/util.js');
const { server_log , attach_log_function } = require('./modules/logger.js');
const operator = require('./operator');

const express = require('express');
const http = require("http");
const sockets = require('socket.io');


let run_server = exports.run_server = (port)=>{
	return startServer(port);
}

function startServer(port,db){
	let	app = express();
	let http_server = http.createServer(app);

	// CROSS ORIGIN REQUESTS, SOLO TESTING
	/*app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});*/
	/*var cors = require('cors');
	app.use(cors());*/

	http_server.listen(port,function() {
		server_log(`WP Director is listening at port: ${port}`);
	});
	
	var io = openSockets(http_server,db);
	publishServices(app,db,io);

	return Promise.resolve();
}

function publishServices(app,db,io){
	
	app
	.get('/',function(req,res){
		server_log('Empty call');
		res.send(`WP Director is running and listening<br/>${printDate()}`);
	})
	.get('/args',function(req,res){
		server_log('Getting app args');
		let cmdArgs = settings.getAppArgs(req.query.appargs.split(' '));
		res.send(cmdArgs);
		server_log('App args sent');
	})
	.get('/settings',function(req,res){
		server_log('Getting settings');
		let cmdArgs = settings.getAppArgs(req.query.appargs.split(' '));
		operator.get_settings(cmdArgs)
		.then(set=>res.send(set))
		.then(()=>server_log('Settings sent'));
	})
/*
	.get('/update',function(req,res){
		var obj = JSON.parse(req.query.obj);
		var id = obj.id;
		var data = obj.data;

		update(req.query.type,req.query.obj).then(function(result){
			server_log('enviando datos actualizados');
			io.emit('datasent',result);
		},handleError);

	})
	;*/
}


let buffer = [];
function init_server_log(socket){
	attach_log_function((...args)=>process_log(socket,...args));
}

function process_log(socket,...args){
	let arg = args.join(' ');
	buffer.push(args);
	socket.emit('serverlog',arg);
}

function full_process_log(socket){
	buffer.map(arg=>socket.emit('serverlog',arg));
}
function empty_buffer(){
	buffer = [];
}

function openSockets(http_server,db){
	const io = sockets(http_server);
	io.on('connection', function(socket){
		init_server_log(socket);
		
		process_log(socket,'Hi there!');
		full_process_log(socket);
	});
	/*
	io.on('connection', function(socket){
		server_log('conexion establecida.');

		socket.on('disconnect', function(){
			server_log('conexión cerrada');
		});

		socket.on('get', function(params){
			server_log('recibida solicitud. Last updated:'+params.lastUpdated);
			get(params.type,params.lastUpdated).then(function(result){
				server_log('enviando datos');
				socket.emit('datasent',result);
			},handleError);
		});


		socket.on('update', function(params){
			update(params.type,params.obj).then(function(result){
				server_log('enviando datos actualizados');
				io.emit('datasent',result);
			},handleError);
		});
	});
	*/

	return io;
}


function get(type,lastUpdated){
	// UNA CHUCHUFLETA DEL PORTE DE UN BUQUE
	var now = formatDate(new Date((new Date()).toISOString().replace('T',' ').replace('Z','')));
	
	server_log('iniciando lectura');
	/**************************************************************************************/
	var promesa = new Promise(function(resolve, reject){
		db.get(type,{lastUpdated:lastUpdated}).then(function(result){
			if(result.count>0){
				server_log('datos obtenidos');
			}
			else{
				server_log('no hay datos');
			}
			result.lastUpdated = now;
			
			resolve(result);
		},function(err){reject(err);});
	});

	/**************************************************************************************/
	/*var promesa = new Promise(function(resolve, reject){
		resolve(require('jsonfile').readFileSync('el_barista.json','utf8'));
	});*/
	/**************************************************************************************/

	

	return promesa;
}

function update(type,obj){
	var promesa = new Promise(function(resolve, reject){
		db.update(type,obj).then(function(result){
			resolve(result);
		},function(err){reject(err);});

	});
	return promesa;
}

function handleError(err){
	server_log('un errorcillo',err,err.stack);
	throw err;
}