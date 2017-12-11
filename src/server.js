const { server_log , printDate } = require('./modules/util.js');
const express = require('express');
const http = require("http");
const sockets = require('socket.io');

let startServer = exports.startServer = function(port,db){
	let	app = express();
	let http_server = http.createServer(app);

	// CROSS ORIGIN REQUESTS, SOLO TESTING
	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});
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
		res.send(`WP Director is running and listening<br/>${printDate()}`);
	})
	/*.get('/config',function(req,res){
		res.send(JSON.parse(require('fs').readFileSync(SERVER_PATH_LOCAL+'app_config.json', 'utf8')))
	})
	.get('/i18n',function(req,res){
		translate(res,req.query.lang);
	})
	.get('/get',function(req,res){
		server_log('recibida solicitud. Last updated:'+req.query.lastUpdated);
		get(req.query.type,req.query.lastUpdated).then(function(result){
			res.send(result);
		},handleError);
	})
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


function openSockets(http_server,db){
	const io = sockets(http_server);

	/*io.on('connection', function(socket){
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
	});*/

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