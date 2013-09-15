var mongoose = require('mongoose');
var config = require('../config');


var userSchema = new mongoose.Schema({
	fbId: String,
	name: String,
	fbUserName: String,
	email: {type: String, lowercase: true },
	points: Number,
	completedTasks: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
});

module.exports = mongoose.model('User', userSchema);
