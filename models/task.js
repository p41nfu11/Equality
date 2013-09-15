var mongoose = require('mongoose');
var config = require('../config');


var taskSchema = new mongoose.Schema({
	title: String,
	text: String,
	createdDate: Date,
	dueDate: Date,
	completedDate: Date,
	completed: Boolean,
	completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	points: Number
});


module.exports = mongoose.model('Task', taskSchema);
