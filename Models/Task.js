var mongoose = require('mongoose');
var config = require('../config');

console.log(config);

var taskSchema = new mongoose.Schema({
	title: String,
	text: String,
	createdDate: Date,
	dueDate: Date,
	completed: Boolean,
});


module.exports = mongoose.model('Task', taskSchema);