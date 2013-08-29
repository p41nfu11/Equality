var list = require('../models/list');
var task = require('../models/task');
var User = require('../models/user');

exports.tasks = function(req, res){
	console.log(req.body);
  	process.nextTick(function(){
		var query = task.find({'fbId': req.user.fbId}).populate('completedBy');;
		query.exec(function(err, tasks){
			res.send(tasks);
		});
	});
};

exports.lists = function(req, res){
  	process.nextTick(function(){
		var query = list.find({ 'owners': { $in: [ req.user ] } });
		query.exec(function(err, lists){
			if(err)
			{
				console.log('err trying to find lists');	
				res.send(404);
			}
			console.log(lists);
			res.send(lists);
		});
	});
};

exports.owners = function(req, res){
	var listId = req.params.id;
  	process.nextTick(function(){
		var query = list.findOne({ '_id': listId }).populate('owners');
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				res.send(404);
			}
			console.log(list);
			res.send(list.owners);
		});
	});
};

exports.list = function(req, res){
	var listId = req.params.id;
  	process.nextTick(function(){
		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				res.send(404);
			}
			console.log(list);
			res.send(list);
		});
	});
};

exports.tasksByList = function(req, res){
  	process.nextTick(function(){
		var query = list.findOne({ '_id': req.params.id }).populate('tasks');
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				res.send(404);
			}
			res.send(list.tasks);
		});
	});
};

exports.addList = function (request, response) {
    var listData = request.body;
    console.log(listData);
    var newList = new list();
    newList.title = listData.title || 'Default title';
    newList.text = listData.description || 'Default description';
    newList.createdDate = listData.createdDate || new Date();
    newList.owners.push(request.user);

    newList.save(function(err, savedList){
		if(err){
			throw err;
		}
		console.log("New task " + savedList.title + " was created");
		response.send(200, savedList);
	});	
};

exports.addTask = function (request, response) {
    var taskData = request.body.task;
    var listId = request.body.listId;
    console.log(taskData);

    var newTask = new task();
    newTask.title = taskData.title || 'Default title';
    newTask.text = taskData.description || 'Default description';
    newTask.createdDate = taskData.createdDate || new Date();
    newTask.dueDate = taskData.dueDate || new Date();
	newTask.completed = false;
	newTask.points = taskData.points || 100;

    newTask.save(function(err){
		if(err){
			throw err;
		}
		console.log("New task " + newTask.title + " was created");
		
	});	

    process.nextTick(function(){
		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				response.send(404);
			}
			list.tasks.push(newTask);
			list.save(function(err){
				if(err){
					throw err;
				}
				console.log("list was saved");
			});	
		});
	});

	response.send(200, newTask);
};

exports.listAddOwner = function (request, response) {
	var userId = request.user._id; 
	var listId = request.body.listId;

	console.log('user = ' + userId);
	console.log(listId);
	var query = list.findOne({ '_id': listId });
	query.exec(function(err, list){
		if(err)
		{
			console.log('err trying to find list');	
			response.send(404);
		}
		list.owners.push(userId);
		list.save(function(err){
			if(err){
				throw err;
			}
			console.log("list was saved");
		});	
	});
};

exports.listConnectToUser = function (request, response) {
	var userId = request.user._id; 
	var listId = request.params.id;

	console.log('user = ' + userId);
	console.log(listId);
	var query = list.findOne({ '_id': listId });
	query.exec(function(err, list){
		if(err)
		{
			console.log('err trying to find list');	
			response.send(404);
		}
		list.owners.push(userId);
		list.save(function(err){
			if(err){
				throw err;
			}
			console.log("list was saved");
			response.send(200);
		});	
	});
};

exports.updateTask = function(request, response){
	var data = request.body;
	var user = request.user;
	task.findOne({ _id:data._id },function(err,doc){
	    if(err)
	    {
	    	response.send(404);
	    }
	    else{
	    	console.log('found one. Updating...');
	    	
	    	doc.completed = data.completed;
	    	doc.dueDate = data.dueDate;
	    	doc.title = data.title;
	    	doc.text = data.text;

	    	doc.save(function(err){
				if(err){
					throw err;
				}
				console.log("Updated task " + doc.title );
				response.send(200, doc);
			});	
	    }
	});
}

exports.completeTask = function(request, response){
	var data = request.body;
	var user = request.user;
	task.findOne({ _id:data._id },function(err,doc){
	    if(err)
	    {
	    	response.send(404);
	    }
	    else{
	    	console.log('found one. Completing task...');
	    	
	    	doc.completed = data.completed;
    		doc.completedBy = user._id;

	    	doc.save(function(err){
				if(err){
					throw err;
				}

				console.log("Updated task " + doc.title );
				User.findOne({ _id:user._id },function(err,dbUser){
					if(err){
						throw err;
					}	
					if(doc.completed)
						dbUser.points += doc.points;
					else
						dbUser.points -= doc.points;
					dbUser.save(function(err){
						if(err){
							throw err;
						}	
						response.send(200, doc);					
					});
	    		});
				
			});	
	    	

	    }
	});
}

exports.removeList = function(request, response){
	list.find({ _id:request.body._id },function(err,docs){
	    if(err)
	    {
	    	response.send(404);
	    }
	    else
	    {
	    	console.log('found one. Deleting...');
	    	docs.forEach(function(doc){
	    		doc.remove();
	    	});
	    	response.send(200);
	    }
	});
}

exports.removeTask = function (request, response) {
	task.find({ _id:request.body._id },function(err,docs){
	    if(err)
	    {
	    	response.send(404);
	    }
	    else
	    {
	    	console.log('found one. Deleting...');
	    	docs.forEach(function(doc){
	    		doc.remove();
	    	});
	    	response.send(200);
	    }
	});	
};

