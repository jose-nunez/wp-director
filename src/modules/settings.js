const YAML = require('yamljs');
const {DB} = require('./database');
const fs = require('fs');
const path = require('path');


//TODO: join arrays
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
	if(!key) return;
	else if(obj[key]) return obj[key];
	else{
		let parent_key = key.replace(/\..*/,'');
		let sub_keys = key.replace(/.*?\./,'');
		if(sub_keys && obj[parent_key]) return findValue(obj[parent_key],sub_keys);
		else return null;
	}
}

function translateValue(value,source){
	if(!value) return;
	let r = value;
	let token = /\$\{.*?\}/g;
	let templates = value.match(token);
	if(templates){
		templates.map(template=>{
			r = r.replace(template,findValue(source,template.replace(/[\$\{\}]/g,'')));
		});
	}
	return r;
}

function translateValues(value,source){
	if(value instanceof Array) return value.map(val=>translateValues(val,source));
	else if(typeof value === "object"){ 
		let r = {};
		Object.keys(value).map(key=>{
			r[key] = translateValues(value[key],source);
		});
		return r;
	}
	else if(typeof value === "string") return translateValue(value,source);
	else return value;
}	

		
function translateSettings(settings){
	return translateValues(settings,settings);
}

function getAppSettings(site_name){
	let deault_settings = YAML.load(path.join(__dirname,'../config.yml'));
	let dbconnection = deault_settings.dbconnection;
	delete(deault_settings.dbconnection); // Will not go to the app
	
	let connector = new DB(dbconnection);
	return connector.getStageSettings(site_name).then(site_settings=>joinSettings(deault_settings,site_settings));

}

exports.getAppSettings = getAppSettings;
exports.translateSettings = translateSettings;