
function replaceAll(text, busca, reemplaza ){
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

function printDate(){
	return new Date().toISOString().replace(/T/,'|').replace(/\..*/,'');
}

function server_log(...args){
	process.stdout.write(printDate()+' ');
	console.log.apply(null,args);
}


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

exports.replaceAll = replaceAll;
exports.printDate = printDate;
exports.server_log = server_log;
exports.copyAttrs = copyAttrs;
exports.translateValues = translateValues;