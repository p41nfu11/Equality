var mongoose = require('mongoose');
var config = require('../config');

var logEntrySchema = new mongoose.Schema({
	text: String,
	date: Date,
	level: String
});


module.exports = mongoose.model('LogEntry', logEntrySchema);

var LogEntry = require('../models/logentry');

