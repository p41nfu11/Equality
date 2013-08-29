var mongoose = require('mongoose');
var config = require('../config');

console.log(config);

var userSchema = new mongoose.Schema({
	fbId: String,
	name: String,
	email: {type: String, lowercase: true }
});

module.exports = mongoose.model('User', userSchema);