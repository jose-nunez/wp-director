
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

exports.replaceAll = replaceAll;
exports.printDate = printDate;
exports.server_log = server_log;