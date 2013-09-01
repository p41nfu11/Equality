var LogEntry = require('./logentry.js');

exports.createLogEntry = function(text, level){

	console.log(level + ": " + text);

	process.nextTick(function(){
		var entry = new LogEntry();
	    
	    entry.text = text;
	    entry.level = level;
	    entry.date = new Date();
		
		process.nextTick(function(){
		    entry.save(function(err){
				if(err){
					console.log('could not save entry');
					console.log(err);
					return;
				}
			});	
		});
	});
};