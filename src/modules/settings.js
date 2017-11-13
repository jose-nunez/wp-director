const YAML = require('yamljs');
const {DB} = require('./database');
const fs = require('fs');
const path = require('path');


function copyAttrs(prev,next){
	if(!next) return prev;
	else if(typeof next !== "object" || typeof prev !== "object") return next;
	else{
		let r = {};
		let prev_keys = Object.keys(prev);
		prev_keys.map(key=>{
			r[key] = copyAttrs(prev[key],next[key])
		});
		let next_keys = Object.keys(next).filter(key=>prev_keys.indexOf(key)==-1);
		next_keys.map(key=>{
			r[key] = next[key];
		});
		return r;
	}
}

function joinSettings(deaultSettings,newSettings){
	return copyAttrs(deaultSettings,newSettings);
}


function findValue(obj,key/*in dot notation*/){
	if(obj[key]) return obj[key];
	else{
		let keyA = key.split('.')[0];
		let keyB = key.split('.')[1];
		if(keyB && obj[keyA]) return findValue(obj[keyA],key.replace(/.*?\./,''));
		else return null;
	}
}
function translateSettings(settings){
	
}

function getAppSettings(site_name){
	let deault_settings = YAML.load(path.join(__dirname,'../config.yml'));
	let dbconnection = deault_settings.dbconnection;
	delete(deault_settings.dbconnection); // Will not go to the app
	
	let connector = new DB(dbconnection);
	return connector.getStageSettings(site_name).then(site_settings=>joinSettings(deault_settings,site_settings));

}

exports.getAppSettings = getAppSettings;