
var user = require('../models/user');


exports.users = function(req, res){
	console.log('users');
  	process.nextTick(function(){
		var query = user.find({});
		query.exec(function(err, users){
			
			if(err)
			{
				console.log('err trying to find users');	
				res.send(404);
			}

			var cleanedList = [];

			users.forEach(function(userData){
				cleanedList.push({_id: userData._id, name: userData.name});
			});

			res.send(cleanedList);
		});
	});
};

