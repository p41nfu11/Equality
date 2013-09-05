var list = require('../models/list');
var task = require('../models/task');
var User = require('../models/user');
var RecurringTask = require('../models/recurringtask');
var LogEntry = require('../models/logentry');

exports.adminIndex = function(req, res){
  	res.render('adminIndex');
};

exports.lists = function(req, res){
  	process.nextTick(function(){
		var query = list.find({}).sort({createdDate: -1}).limit(20).populate('owners').populate('tasks');
		query.exec(function(err, lists){
			if(err)
				console.log(err);
			res.send(lists);
		});
	});
};

exports.recurringTasks = function(req, res){
  	process.nextTick(function(){
		var query = RecurringTask.find({}).sort({createdDate: -1}).limit(20).populate('list');
		query.exec(function(err, recurringTasks){
			if(err)
				console.log(err);
			res.send(recurringTasks);
		});
	});
};

exports.log = function(req, res){
  	process.nextTick(function(){
		var query = LogEntry.find({}).sort({date: -1}).limit(200);
		query.exec(function(err, logEntries){
			if(err)
			{
				console.log('err trying to find log');	
				res.send(404);
			}
			res.send(logEntries);
		});
	});
};