
let replaceAll = exports.replaceAll = function(text, busca, reemplaza ){
	var recall = false;
	var clave_aux= 'CLAVEUNICAMOMENTANEADELMOMENTOMOMENTUAL';
	//Evita loop infinito
	if(reemplaza.indexOf(busca) != -1){ 
		recall = true;
		reemplaza = reemplaza.replace(busca,clave_aux);
	}

	while (text.toString().indexOf(busca) != -1)
		text = text.toString().replace(busca,reemplaza);

	if(recall){
		return replaceAll(text,clave_aux,busca);
	}
	else return text;
}

let printDate = exports.printDate = function(){
	return new Date().toISOString().replace(/T/,'|').replace(/\..*/,'');
}

let server_log = exports.server_log = function(...args){
	process.stdout.write(printDate()+' ');
	console.log.apply(null,args);
}


//TODO: join arrays
let copyAttrs  =exports.copyAttrs = function(prev,next){
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

let findValue = exports.findValue = function(obj,key/*in dot notation*/){
	if(!key) return;
	else if(obj[key]) return ''+obj[key]; //Convert to string!
	else{
		let parent_key = key.replace(/\..*/,'');
		let sub_keys = key.replace(/.*?\./,'');
		if(sub_keys && obj[parent_key]) return findValue(obj[parent_key],sub_keys);
		else return null;
	}
}

let translateValue = exports.translateValue = function(oldValue,source,nullify){
	if(!oldValue) return;
	let r = oldValue;
	let token = /\$\{.*?\}/g;
	let templates = oldValue.match(token);
	if(templates){
		templates.map(template=>{
			let newValue = findValue(source,template.replace(/[\$\{\}]/g,''));
			if(newValue===null && nullify) newValue = '';
			else if(newValue===null && !nullify) newValue = template;
			else newValue = translateValue(newValue,source,nullify); //CHAIN TRANSLATE 
			r = r.replace(template,newValue);
		});
	}
	return r;
}
let translateValues = exports.translateValues = function(value,source,nullify){
	if(!value) return value;
	else if(value instanceof Array) return value.map(val=>translateValues(val,source,nullify));
	else if(typeof value === "object"){ 
		let r = {};
		Object.keys(value).map(key=>{
			r[key] = translateValues(value[key],source,nullify);
		});
		return r;
	}
	else if(typeof value === "string") return translateValue(value,source,nullify);
	else return value;
}


let duplicateObj = exports.duplicateObj = function (obj){
	return JSON.parse(JSON.stringify(obj));
}

let urlOrigin = exports.urlOrigin = function(url){
	return new url.URL(url).origin;
}