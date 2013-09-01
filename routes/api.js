var list = require('../models/list');
var task = require('../models/task');
var User = require('../models/user');
var LogEntry = require('../models/logentry');
var RecurringTask = require('../models/recurringtask');
var Log = require('../models/log.js');

exports.tasks = function(req, res){
	Log.createLogEntry(req.user.name + " fetching tasks", "debug");
  	process.nextTick(function(){
		var query = task.find({'fbId': req.user.fbId}).populate('completedBy');;
		query.exec(function(err, tasks){
			if(err){
				Log.createLogEntry("tasks: " + err, "error");
				res.send(500);
			}
			res.send(tasks);
		});
	});
};

exports.lists = function(req, res){
	Log.createLogEntry(req.user.name + " fetching lists", "debug");
  	process.nextTick(function(){
		var query = list.find({ 'owners': { $in: [ req.user ] } });
		query.exec(function(err, lists){
			if(err)
			{
				Log.createLogEntry("lists: " + err, "error");
				res.send(404);
			}
			res.send(lists);
		});
	});
};

exports.randomTasks = function(req, res){
	Log.createLogEntry(req.user.name + " fetching random tasks", "debug");
	process.nextTick(function(){
		var query = task.find().sort({createdDate: -1}).limit(3);
		query.exec(function(err, tasks){
			if(err)
			{
				Log.createLogEntry("randomTasks: " + err, "error");
				res.send(404);
			}
 			res.send(tasks);
		});		
	});
}

exports.owners = function(req, res){
	var listId = req.params.id;
	Log.createLogEntry(req.user.name + " fetching owners for list " + listId, "debug");
  	process.nextTick(function(){
		var query = list.findOne({ '_id': listId }).populate('owners');
		query.exec(function(err, list){
			if(err)
			{
				Log.createLogEntry("owners: " + err, "error");
				res.send(404);
			}
			res.send(list.owners);
		});
	});
};

exports.list = function(req, res){
	var listId = req.params.id;
	Log.createLogEntry(req.user.name + " fetching list " + listId, "debug");
  	process.nextTick(function(){
		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				Log.createLogEntry("list: " + err, "error");
				res.send(404);
			}
			res.send(list);
		});
	});
};

exports.tasksByList = function(req, res){
	Log.createLogEntry(req.user.name + " fetching tasks by list " + req.params.id, "debug");
  	process.nextTick(function(){
		var query = list.findOne({ '_id': req.params.id }).populate('tasks');
		query.exec(function(err, list){
			if(err)
			{
				Log.createLogEntry("tasksByList: " + err, "error");
				res.send(404);
			}
			res.send(list.tasks);
		});
	});
};

exports.addList = function (request, response) {

    var listData = request.body;
    Log.createLogEntry(request.user.name + " creating list " + listData.title, "debug");

    var newList = new list();
    newList.title = listData.title || 'Default title';
    newList.text = listData.description || 'Default description';
    newList.createdDate = listData.createdDate || new Date();
    newList.owners.push(request.user);
	
	process.nextTick(function(){
	    newList.save(function(err, savedList){
			if(err){
				Log.createLogEntry("addList: " + err, "error");
				response.send(500, err);
				return;
			}
			Log.createLogEntry("New task " + savedList.title + " was created", "debug");
			response.send(200, savedList);
		});	
	});
};

exports.addTask = function (request, response) {
    var taskData = request.body.task;
    var listId = request.body.listId;
    Log.createLogEntry(request.user.name + " creating task " + taskData.title, "debug");

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
				Log.createLogEntry("addTask: " + err, "error");
				response.send(500, err);
				return;
			}
		});	
		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				Log.createLogEntry("addTask: " + err, "error");
				response.send(404);
			}
			list.tasks.push(newTask);
			list.save(function(err){
				if(err){
					Log.createLogEntry("addTask: " + err, "error");
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
		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				Log.createLogEntry("listAddOwner: " + err, "error");
				response.send(404);
				return;
			}
			if(list.owners.indexOf(userId) > -1)
			{
				Log.createLogEntry('user: ' + userId + ' is already added to this list ' + list.title);	
				response.send(200);	
				return;
			}	
			list.owners.push(userId);
			list.save(function(err){
				if(err){
					Log.createLogEntry("listAddOwner: " + err, "error");
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
		Log.createLogEntry("connecting user " + userId + " to list " + listId, "debug");

		var query = list.findOne({ '_id': listId });
		query.exec(function(err, list){
			if(err)
			{
				Log.createLogEntry("listConnectToUser: " + err, "error");
				response.send(404);
				return;
			}
			if(list.owners.indexOf(userId) > -1)
			{
				Log.createLogEntry('user: ' + userId + ' is already added to this list ' + list.title, "debug");	
				response.send(200);	
				return;
			}	
			list.owners.push(userId);
			list.save(function(err){
				if(err){
					Log.createLogEntry("listConnectToUser: " + err, "error");
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

	Log.createLogEntry(request.user.name + " updating task " + data.title, "debug");

	process.nextTick(function(){
		task.findOne({ _id:data._id },function(err,doc){
		    if(err)
		    {
		    	Log.createLogEntry("updateTask: " + err, "error");
		    	response.send(404);
		    	return;
		    }
		    else{
		    	
		    	doc.completed = data.completed;
		    	doc.dueDate = data.dueDate;
		    	doc.title = data.title;
		    	doc.text = data.text;
		    	doc.points = data.points;

		    	doc.save(function(err){
					if(err){
						Log.createLogEntry("updateTask: " + err, "error");
						response.send(500, err);
						return;
					}
					response.send(200, doc);
				});	
		    }
		});
	});
}

exports.completeTask = function(request, response){
	var data = request.body;
	Log.createLogEntry(request.user.name + " completing task " + data.title, "debug");

	process.nextTick(function(){
		task.findOne({ _id:data._id },function(err,doc){
		    if(err)
		    {
		    	Log.createLogEntry("completeTask: " + err, "error");
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
						Log.createLogEntry("completeTask: " + err, "error");
						response.send(500, err);
						return;
					}

					console.log("Updated task " + doc.title );
					User.findOne({ _id:data.completedBy._id },function(err,dbUser){
						if(err){
							Log.createLogEntry("completeTask: " + err, "error");
							response.send(404, err);
							return;
						}	
						if(doc.completed)
							dbUser.points += doc.points;
						else
							dbUser.points -= doc.points;
						dbUser.save(function(err){
							if(err){
								Log.createLogEntry("completeTask: " + err, "error");
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
	Log.createLogEntry(request.user.name + " removing list", "debug");
	process.nextTick(function(){		
		list.find({ _id:request.body._id },function(err,docs){
		    if(err)
		    {
		    	Log.createLogEntry("removeList: " + err, "error");
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
	Log.createLogEntry(request.user.name + " removing task", "debug");
	process.nextTick(function(){
		task.find({ _id:request.body._id },function(err,docs){
		    if(err)
		    {
		    	Log.createLogEntry("removeTask: " + err, "error");
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
				Log.createLogEntry("getRecurringTasksByList: " + err, "error");
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
		    	Log.createLogEntry("removeRecurringTasks: " + err, "error");
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
	Log.createLogEntry(req.user.name + " creating recurring task", "debug");
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
				Log.createLogEntry("createRecurringTask: " + err, "error");
				res.send(500, err);
				return;
			}
			console.log("New recurring task " + newRecurringTask.title + " was created");
			res.send(200, newRecurringTask);
		});	
	});	
}

exports.triggerRecurring = function(){
	Log.createLogEntry("triggering recurring tasks", "debug");
	process.nextTick(function(){
		var query = RecurringTask.find({});
		query.exec(function(err, recurringTasks){
			if(err)
			{
				Log.createLogEntry("triggerRecurring: " + err, "error");
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
								Log.createLogEntry("triggerRecurring: " + err, "error");
								return;
							}
							console.log("New task " + newTask.title + " was created");
							
						});	

						var query = list.findOne({ '_id': recurringTask.list });
						query.exec(function(err, list){
							if(err)
							{
								Log.createLogEntry("triggerRecurring: " + err, "error");
								
							}
							list.tasks.push(newTask);
							list.save(function(err){
								if(err){
									Log.createLogEntry("triggerRecurring: " + err, "error");
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