
/*
 * get API
 */

var list = require('../models/list');
var task = require('../models/task');

exports.tasks = function(req, res){
	console.log(req.body);
  	process.nextTick(function(){
		var query = task.find({'fbId': req.user.fbId});
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

    newList.save(function(err){
		if(err){
			throw err;
		}
		console.log("New task " + newList.title + " was created");
		response.send(200, newList);
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

exports.updateTask = function(request, response){
	var data = request.body;
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

exports.removeList = function(request, response){
	list.find({ _id:request.body._id },function(err,docs){
	    if(err)
	    {
	    	response.send(404);
	    }
	    else{
	    	console.log('found one. Deleting...');
	    	docs.forEach(function(doc){
	    		doc.remove();
	    	});
	    	response.send(200);
	    }
	});
}


//OBS
//currently only updated dueDate and completed
// exports.updateTask = function(request, response){
// 	var data = request.body;§
// 	task.findOne({ _id:data._id },function(err,doc){
// 	    if(err)
// 	    {
// 	    	response.send(404);
// 	    }
// 	    else{
// 	    	console.log('found one. Updating...');
	    	
// 	    	doc.completed = data.completed;
// 	    	doc.dueDate = data.dueDate;

// 	    	doc.save(function(err){
// 				if(err){
// 					throw err;
// 				}

// 				console.log("Updated task " + doc.title );
// 				response.send(200, doc);
// 			});	
// 	    }
// 	});
// }

exports.removeTask = function (request, response) {
	task.find({ _id:request.body._id },function(err,docs){
	    if(err)
	    {
	    	response.send(404);
	    }
	    else{
	    	console.log('found one. Deleting...');
	    	docs.forEach(function(doc){
	    		doc.remove();
	    	});
	    	response.send(200);
	    }
	});	
};
