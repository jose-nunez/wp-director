const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

let database;
function c(db_name,db_user,db_pass){
	if(database) return database;
	else if(db_name && db_user && db_pass){
		database = new Promise((resolve,reject)=>{
			MongoClient.connect(`mongodb://${db_user}:${db_pass}@localhost:27017/${db_name}`,function(err, db){
				assert.equal(err, null);
				resolve(db);
			});
		});
		return database;
	}
	else return Promise.reject(new Error('No database credentials provided'));
}

function find(collection,query,projection){		
	return c().then(db=>{
		let cursor = db.collection(collection).find(query||{});
		cursor.project(projection);
		return cursor;
	});
}

class DB{
	
	connect({db_name,db_user,db_pass}){
		c(db_name,db_user,db_pass);
	}

	getStageSettings(site_name){
		if(!site_name) throw new Error('Database: No site name defined');

		let query = site_name?{site_name: site_name}:null;
		return find('stagesites',query,{'_id':false})
			.then(cursor=>cursor.next());
		
	}

	getSiteList(fullconfig){
		return find('stagesites',null,{'_id':false})
			.then(cursor=>cursor.toArray())
			.then(array=>fullconfig?array:array.map(({site_name})=>site_name));
	}
	
}

exports.db = new DB();