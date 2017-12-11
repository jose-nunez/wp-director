const settings = require('./modules/settings');
const { run_operation } = require('./operator');

// https://github.com/dthree/vorpal
let run_console = exports.run_console = ()=>{
	console.log('\nPlease type a command (type exit to stop the app)');
	let prompt = 'WPD > ';
	process.stdout.write(prompt);
	
	let stdin = process.openStdin();

	stdin.addListener("data", function(d){
		let data = d.toString().trim(); 
		if(data == '') process.stdout.write(prompt);
		else if(data == 'exit'){ 
			console.log('Good bye');
			process.exit(0);
		}
		else {
			let cmdArgs = settings.getAppArgs(data.split(' '));
			run_operation(cmdArgs)
			.catch(e=>server_error(e))
			.then(()=>process.stdout.write(prompt));
		}
	});
}