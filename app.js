
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , api = require('./routes/api')
  , admin = require('./routes/admin')
  , userApi = require('./routes/userApi')
  , http = require('http')
  , path = require('path');

var app = express();

var mongoose = require('mongoose');

var config = require('./config');

var user = require('./models/user');
var Log = require('./models/log.js');

var passport = require('passport'),
	facebookStrategy = require('passport-facebook').Strategy;

var mandrill = require('node-mandrill')(config.dev.mandrill.apiKey);

process.on('uncaughtException',function(err){  
	Log.createLogEntry("uncaught exception: " + err, "error");
});

Log.createLogEntry("STARTING EQUALITY SERVER", "debug");

//setting for passport
passport.serializeUser(function(user,done)
{
	done(null, user.id);
});

passport.deserializeUser(function(id, done){
	user.findOne({_id : id}, function(err, user){
		done(err,user);
	});
});

mongoose.connect(config.dev.dbUrl);

passport.use(new facebookStrategy({
	clientID: config.dev.fb.appId,
	clientSecret: config.dev.fb.appSecret,
	callbackURL: config.dev.fb.url + 'fbauthed',
}, function(accessToken, refreshToken, profile, done)
	{
		process.nextTick(function(){
			var query = user.findOne({'fbId': profile.id});
			query.exec(function(err, oldUser){
				
				if(oldUser)
				{
					Log.createLogEntry("found old user: " + oldUser.name + ": Logged in!", "debug");
					done(null, oldUser);
				}
				else{
					var newUser = new user();
					newUser.fbId = profile.id;
					newUser.name = profile.displayName;
					newUser.email = profile.emails[0].value;
					newUser.fbUserName = profile.username;
					newUser.points = 0;
					console.log(newUser);
					newUser.save(function(err){
						if(err){
							throw err;
						}
						Log.createLogEntry("New user " + newUser.name + " was created", "debug");
						done(null, newUser);
					});
				}
			});
			
		});
	}
));

// all environments
app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret:'kjhsa312398sadck23h08'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//ROUTING
app.get('/', routes.index);

app.get('/lists', ensureAuthenticated, routes.lists);

app.get('/admin', ensureAdmin, admin.adminIndex);
app.get('/admin/lists/', ensureAdmin, admin.lists);
app.get('/admin/log/', ensureAdmin, admin.log);
app.get('/admin/recurringtasks/', ensureAdmin, admin.recurringTasks);



app.post('/api/list/', ensureAuthenticated, api.addList);
app.post('/api/listAddOwner/', ensureAuthenticated, api.listAddOwner);
app.get('/api/connectToList/:id', ensureAuthenticated, api.listConnectToUser);
app.get('/api/list/:id', ensureAuthenticated, api.list);
app.get('/api/owners/:id', ensureAuthenticated, api.owners);
app.get('/list/:id', ensureAuthenticated, routes.showList);

app.get('/api/lists/', api.lists);

// app.post('/api/updateList/', ensureAuthentication, api.updateList);

 app.post('/api/removeTask/', ensureAuthenticated, api.removeTask);

// app.post('/api/addTaskToList/', ensureAuthentication, api.addTaskToList);

app.get('/api/user/', ensureAuthenticated, userApi.users);

app.get('/api/task/', ensureAuthenticated, api.tasks);
app.post('/api/task', ensureAuthenticated, api.addTask);
app.post('/api/updateTask/', ensureAuthenticated, api.updateTask);
app.post('/api/completeTask/', ensureAuthenticated, api.completeTask);

app.post('/api/recurringTask/', ensureAuthenticated, api.createRecurringTask);
app.post('/api/removeRecurringTask/', ensureAuthenticated, api.removeRecurringTasks);
app.get('/api/recurringTasks/:id', ensureAuthenticated, api.getRecurringTasksByList);


app.get('/api/randomTasks/', ensureAuthenticated, api.randomTasks);

app.post('/api/sendInvite/', ensureAuthenticated, function(request, response) {
	console.log(request.body);
	mandrill('/messages/send', {
    message: {
        to: [{email: request.body.mailTo, name: ''}],
        from_email: config.dev.mandrill.fromMail,
        subject: "Get Equal!",
        text: request.body.mailContent
    }
}, function(error, response)
{
    //uh oh, there was an error
    if (error) {
    	Log.createLogEntry(JSON.stringify(error), "error");
    }
    //everything's good, lets see what mandrill said
    else {
    	Log.createLogEntry("sent mail: " + response, "debug");
    } 
});
	response.send(200);
});


app.get('/api/tasks/:id', api.tasksByList);

app.post('/api/removeList/', ensureAuthenticated, api.removeList);

app.get('/fbauth', passport.authenticate('facebook', {scope:'email'}));

app.get('/fbauthed', passport.authenticate('facebook', {failureRedirect: '/'}), function(req,res){
	console.log(req.session);
	if (req.session.goto && req.session.goto.length > 1){
		var goto = req.session.goto;
		req.session.goto = '';
		res.redirect(goto);
		}
	else{
		res.redirect('/lists');
		}
});

app.get('/logout', function(req, res){
	req.logOut();
	res.redirect('/');
});

app.get('/error', function(req,res){
	res.send(401,'{err: bad login}');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Equality listening on port ' + app.get('port'));
});

function getMillisecondsUntilTen(){
	var now = new Date();
	var millisTillTen = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0) - now;
	if (millisTillTen <= 0) {
	     millisTillTen += 86400000; // it's after 10am, try 10am tomorrow.
	}
	return millisTillTen;
}

function setupTimeout(){
	setTimeout(function(){
		Log.createLogEntry("running recurring tasks", "debug");
		api.triggerRecurring();
		setupTimeout();
	}, getMillisecondsUntilTen()); 
};
setupTimeout();

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { 
    	return next(); 
    }
    if (req.url.length > 1)
    	req.session.goto = req.url;
    	
    res.redirect('/');
};

function ensureAdmin(req, res, next) {
    if (req.isAuthenticated()) { 
    	if (req.user.email === config.dev.adminMail){
    		return next(); 	
    	}
    }
    if (req.url.length > 1)
    	req.session.goto = req.url;
    res.redirect('/');
};

