var mongoose = require('mongoose');
var config = require('../config');


var recurringTaskSchema = new mongoose.Schema({
	title: String,
	text: String,
	createdDate: Date,
	interval: Number,
	points: Number,
	list: { type: mongoose.Schema.Types.ObjectId, ref: 'List' }
});


module.exports = mongoose.model('RecurringTask', recurringTaskSchema);
