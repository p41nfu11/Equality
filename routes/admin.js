var list = require('../models/list');
var task = require('../models/task');
var User = require('../models/user');

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

exports.adminIndex = function(req, res){
  	res.render('adminIndex');
};