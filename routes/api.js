var list = require('../models/list');
var task = require('../models/task');
var User = require('../models/user');
var RecurringTask = require('../models/recurringtask');

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

exports.randomTasks = function(req, res){
	process.nextTick(function(){
		var query = task.find().sort({createdDate: -1}).limit(3);
		query.exec(function(err, tasks){
			if(err)
			{
				console.log('err trying to find tasks');	
				console.log(err);
				res.send(404);
			}
			console.log(tasks);
 			res.send(tasks);
		});		
	});
}

exports.owners = function(req, res){
	var listId = req.params.id;
  	process.nextTick(function(){
		var query = list.findOne({ '_id': listId }).populate('owners');
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				console.log(err);
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
				console.log(err);
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
				console.log(err);
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
	
	process.nextTick(function(){
	    newList.save(function(err, savedList){
			if(err){
				console.log('could not save list');
				console.log(err);
				response.send(500, err);
				return;
			}
			console.log("New task " + savedList.title + " was created");
			response.send(200, savedList);
		});	
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
	newTask.points = taskData.points || 3;

	process.nextTick(function(){
	    newTask.save(function(err){
			if(err){
				console.log('could not save task');
				console.log(err);
				response.send(500, err);
				return;
			}
			console.log("New task " + newTask.title + " was created");
			
		});	

    
		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				console.log(err);
				response.send(404);
			}
			list.tasks.push(newTask);
			list.save(function(err){
				if(err){
					console.log('could not save list');
					console.log(err);
					response.send(500, err);
					return;
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
	process.nextTick(function(){
		console.log('user = ' + userId);
		console.log(listId);
		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				console.log(err);
				response.send(404);
				return;
			}
			if(list.owners.indexOf(userId) > -1)
			{
				console.log('user: ' + userId + ' is already added to this list ' + list.title);	
				console.log(err);
				response.send(200);	
				return;
			}	
			list.owners.push(userId);
			list.save(function(err){
				if(err){
					console.log('error while trying to save list');
					console.log(err);
					response.send(500);	
					return;
				}
				console.log("list was saved");
				response.send(200);
			});	
		});
	});
};

exports.listConnectToUser = function (request, response) {
	var userId = request.user._id; 
	var listId = request.params.id;
	process.nextTick(function(){
		console.log("connecting user " + userId + " to list " + listId);

		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				console.log('err trying to find list');	
				console.log(err);
				response.send(404);
				return;
			}
			if(list.owners.indexOf(userId) > -1)
			{
				console.log('user: ' + userId + ' is already added to this list ' + list.title);	
				console.log(err);
				response.send(200);	
				return;
			}	
			list.owners.push(userId);
			list.save(function(err){
				if(err){
					console.log('could not save list');
					console.log(err);
					response.send(500, err);
					return;
				}
				console.log("list " + list.title + " was saved");
				response.send(200);
			});	
		});
	});
};

exports.updateTask = function(request, response){
	var data = request.body;
	var user = request.user;
	process.nextTick(function(){
		task.findOne({ _id:data._id },function(err,doc){
		    if(err)
		    {
		    	console.log('could not find task with id ' + data._id);
		    	console.log(err);
		    	response.send(404);
		    	return;
		    }
		    else{
		    	console.log('found one. Updating...');
		    	
		    	doc.completed = data.completed;
		    	doc.dueDate = data.dueDate;
		    	doc.title = data.title;
		    	doc.text = data.text;
		    	doc.points = data.points;

		    	doc.save(function(err){
					if(err){
						console.log('could not save updated task');
						console.log(err);
						response.send(500, err);
						return;
					}
					console.log("Updated task " + doc.title );
					response.send(200, doc);
				});	
		    }
		});
	});
}

exports.completeTask = function(request, response){
	var data = request.body;

	process.nextTick(function(){
		task.findOne({ _id:data._id },function(err,doc){
		    if(err)
		    {
		    	console.log('could not find task with id ' + data._id);
		    	console.log(err);
		    	response.send(404);
		    	return;
		    }
		    else{
		    	console.log('found one. Completing task...');
		    	
		    	doc.completed = data.completed;
	    		doc.completedBy = data.completed? data.completedBy._id: '';
	    		doc.completedDate = Date.now();



		    	doc.save(function(err){
					if(err){
						console.log('could not save complete task');
						console.log(err);
						response.send(500, err);
						return;
					}

					console.log("Updated task " + doc.title );
					User.findOne({ _id:data.completedBy._id },function(err,dbUser){
						if(err){
							console.log('could not find user that completed task');
							console.log(err);
							response.send(404, err);
							return;
						}	
						if(doc.completed)
							dbUser.points += doc.points;
						else
							dbUser.points -= doc.points;
						dbUser.save(function(err){
							if(err){
								console.log('could not save completing user');
								console.log(err);
								response.send(500, err);
								return;
							}	
							response.send(200, doc);					
						});
		    		});
				});	
		    }
		});
	});
}

exports.removeList = function(request, response){
	process.nextTick(function(){		
		list.find({ _id:request.body._id },function(err,docs){
		    if(err)
		    {
		    	console.log('could not find list');
				console.log(err);
				response.send(404, err);
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
	});	
}

exports.removeTask = function (request, response) {
	process.nextTick(function(){
		task.find({ _id:request.body._id },function(err,docs){
		    if(err)
		    {
		    	console.log('could not find task');
				console.log(err);
				response.send(404, err);
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
	});	
};

//param: listId
exports.getRecurringTasksByList = function(req, res){
	process.nextTick(function(){
		var query = RecurringTask.find({ 'list': req.params.id });
		query.exec(function(err, tasks){
			if(err)
			{
				console.log('err trying to find recurring task');	
				console.log(err);
				res.send(404);
			}
			else{
				res.send(tasks);	
			}
		});
	});
}

exports.removeRecurringTasks = function(req, res){
	process.nextTick(function(){
		RecurringTask.find({ _id:req.body._id },function(err,docs){
		    if(err)
		    {
		    	console.log('could not find recurring task');
				console.log(err);
				res.send(404, err);
		    }
		    else
		    {
		    	console.log('found one. Deleting...');
		    	docs.forEach(function(doc){
		    		doc.remove();
		    	});
		    	res.send(200);
		    }
		});	
	});	
}

exports.createRecurringTask = function(req, res){
	var recurringTaskData = req.body.recurringTask;
    var listId = req.body.listId;

    if(!listId){
    	console.log('Error!: no list id');
    	res.send(404, err);
		return;
    }

    process.nextTick(function(){

	    var newRecurringTask = new RecurringTask();
	    newRecurringTask.title = recurringTaskData.title || 'Default title';
	    newRecurringTask.text = recurringTaskData.description || 'Default description';
	    newRecurringTask.createdDate = recurringTaskData.createdDate || new Date();
	    newRecurringTask.interval = recurringTaskData.interval || 7;
		
		newRecurringTask.list = listId;
		newRecurringTask.points = recurringTaskData.points || 3;

	    newRecurringTask.save(function(err){
			if(err){
				console.log('could not save recurring task');
				console.log(err);
				res.send(500, err);
				return;
			}
			console.log("New recurring task " + newRecurringTask.title + " was created");
			res.send(200, newRecurringTask);
		});	
	});	
}

exports.triggerRecurring = function(){
	process.nextTick(function(){
		var query = RecurringTask.find({});
		query.exec(function(err, recurringTasks){
			if(err)
			{
				console.log('err trying to find recurring tasks');	
				console.log(err);
			}
			else{
				recurringTasks.forEach(function(recurringTask){
					var now = new Date();
					var nowDay = now.getDate() + now.getMonth() * 30 + now.getYear() * 12 * 30;
					var taskDay = recurringTask.createdDate.getDate() + recurringTask.createdDate.getMonth() * 30 + recurringTask.createdDate.getYear() * 12 * 30;
					
					console.log(nowDay + " "+ taskDay +" "+((nowDay - taskDay) % recurringTask.interval));

					if (nowDay !== taskDay && ((nowDay - taskDay) % recurringTask.interval) === 0){
						var newTask = new task();
					    newTask.title = recurringTask.title;
					    newTask.text = recurringTask.description;
					    newTask.createdDate = recurringTask.createdDate;

						var today = new Date();
						var nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

					    newTask.dueDate =  nextWeek;
						newTask.completed = false;
						newTask.points = recurringTask.points;

						newTask.save(function(err){
							if(err){
								console.log('could not save task');
								console.log(err);
								
								return;
							}
							console.log("New task " + newTask.title + " was created");
							
						});	

						var query = list.findOne({ '_id': recurringTask.list });
						query.exec(function(err, list){
							if(err)
							{
								console.log('err trying to find list');	
								console.log(err);
								
							}
							list.tasks.push(newTask);
							list.save(function(err){
								if(err){
									console.log('could not save list');
									console.log(err);
									
									return;
								}
								console.log("list was saved");
							});	
						});
					}
					else if(nowDay === taskDay){
						console.log("task was created today. skipping...");
					}
					else{
						console.log(((nowDay - taskDay) % recurringTask.interval) + " is not 0, Skipping.");
					}
					
				});
			}
		});
	});
}