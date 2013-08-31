// Here's my data model
function ListViewModel() {
    self = this;

    self.listId = ko.observable();
    self.userId = ko.observable();
    //self.owners = ko.observableArray();
    self.users = ko.observableArray();
    self.tasks = ko.observableArray();
    self.randomTasks = ko.observableArray();
    self.recurringTasks = ko.observableArray();
    self.completedTasks = ko.observableArray();
    self.edit = ko.observable(false);
    self.title = ko.observable('');
    self.points = ko.observable();

    self.addTaskViewActive = ko.observable(true);
    self.addRecurringTaskViewActive = ko.observable(false);

    self.recurringTaskTitle = ko.observable('');
    self.recurringTaskPoints = ko.observable();
    self.recurringTaskInterval = ko.observable();

    self.completedTasksMatrix = ko.computed(function() {
        var perUser = [];
        for(var i = 0; i < self.users().length; i ++){
            var usersTasks = [];
            self.completedTasks().forEach(function(task){
                if (task.completedBy === self.users()[i]._id)
                    usersTasks.push(task);
            });
            perUser.push(usersTasks);
        }
        return perUser;
    }, this);

    //edit
    self.editTaskTitle = ko.observable('');
    self.editTaskPoints = ko.observable('');

    //completing
    self.completedBy = ko.observable('');


    self.init = function(){
        self.listId(parameter.listId);
        self.userId(parameter.userId);

    	$.get('/api/owners/' + parameter.listId, function(data) {
    		data.forEach(function (e){
                e.avatar = "https://graph.facebook.com/"+ e.fbUserName + "/picture";
                e.points = ko.observable(e.points);
    			self.users.push(e);	
    		});
    	});

        $.get('/api/recurringTasks/' + parameter.listId, function(data) {
            data.forEach(function (t){
                self.recurringTasks.push(t);
            });
        });       

        $.get('/api/tasks/' + parameter.listId, function(data) {
            data.forEach(function (e){
                e.editActive = ko.observable(false);
                e.completingActive = ko.observable(false);
                if (!e.completed)
                    e.completed = false;

                self.addTaskToList(e);
            });
        });        
    };

    self.init();

    self.removeTaskFromList = function(task)
    {

        if (self.completedTasks.indexOf(task) >= 0)
        {
            var index = self.completedTasks.indexOf(task);
            self.completedTasks.splice(index, 1);
        }
        else
        {
            var index = self.tasks.indexOf(task);
            self.tasks.splice(index, 1);
        }
    }

    self.addTaskToList = function(task)
    {
        if (task.completed) 
        {
            self.completedTasks.push(task);
        }
        else
        {
            self.tasks.push(task);   
        }
    }

    self.addTaskWasClicked = function(){
        if (isNaN(self.points())){
            console.log("NaN");
            return;
        }

        var today = new Date();
        var nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
        
        var newTask = {title: self.title, createdDate: new Date(), completed: false, dueDate: nextWeek, points: self.points};
        $.post('/api/task', {task:newTask, listId: parameter.listId}, function(data) {
            data.editActive = ko.observable(false);    
            data.completingActive = ko.observable(false);   
            self.addTaskToList(data);
            self.title('');
            self.points('');
        }); 
    };

    self.addRecurringTaskWasClicked = function(){
        var newRecurringTask = {title: self.recurringTaskTitle, createdDate: new Date(), interval: self.recurringTaskInterval, points: self.recurringTaskPoints};
        $.post('/api/recurringTask/', {recurringTask:newRecurringTask, listId: parameter.listId}, function(data) {
            self.recurringTasks.push(data);
            self.recurringTaskTitle('');
            self.recurringTaskPoints('');
            self.recurringTaskInterval('');
        }); 
    };

    self.reAddTask = function(task){
        var today = new Date();
        var nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
        
        var newTask = {title: task.title, createdDate: new Date(), completed: false, dueDate: nextWeek, points: task.points};
        $.post('/api/task', {task:newTask, listId: parameter.listId}, function(data) {
            data.editActive = ko.observable(false);   
            data.completingActive = ko.observable(false);   
            
            self.addTaskToList(data);
            self.title('');
            self.points('');
        }); 
    }

    self.snoozeTaskWasClicked = function(task)
    {   
        var today = new Date();
        var threeDays = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);

        task.dueDate = threeDays;

        $.post('/api/updateTask/', task, function(updatedTask) {
            self.removeTaskFromList(task);
            self.addTaskToList(task);
        });
    }

    self.checkboxClicked = function(data){
        data.completingActive(data.completed);
        //returns true so as to notify the checkbox to mark/unmark itself (can not be done in callback)
        return true;
    };

    self.completedTaskCheckboxClicked = function(task, user){
        task.completedBy = user;
        $.post('/api/completeTask/', task, function(completedTask) {
            self.removeTaskFromList(task);
            user.points(user.points() + completedTask.points);

            completedTask.editActive = ko.observable(false);    
            completedTask.completingActive = ko.observable(false);   
            self.addTaskToList(completedTask);


        }); 
        //returns true so as to notify the checkbox to mark/unmark itself (can not be done in callback)
        return true;
    };    

    self.completeTaskWithUser = function(task, user){
        task.completedBy = user;
        $.post('/api/completeTask/', task, function(completedTask) {
            self.removeTaskFromList(task);
            user.points(user.points() + completedTask.points);
            self.addTaskToList(completedTask);

            task.completingActive(false);
        }); 
    }

    self.editButtonWasClicked = function(task){
        if (!task.editActive()){
            task.editActive(true);
            self.editTaskTitle(task.title);
            self.editTaskPoints(task.points);
        }
        else{
            task.editActive(false);
            self.editTaskTitle('');
            self.editTaskPoints('');
        }
    };

    self.editTask = function(task){
        task.title = self.editTaskTitle();
        task.points = self.editTaskPoints();
        $.post('/api/updateTask/', task, function() {
            // self.removeTaskFromList(task);
            // self.addTaskToList(task);
        }); 

        self.editTaskTitle('');
        self.editTaskPoints('');
        task.editActive(false);
    }

    self.isDue = function(task)
    {
        if (new Date() > new Date(task.dueDate))
            return true;
        else
            return false;
    }


    self.removeTask = function(task)
    {
        $.post('/api/removeTask/', task, function() {
            self.removeTaskFromList(task);
        });
    }

    self.removeRecurringTask = function(task)
    {
        $.post('/api/removeRecurringTask/', task, function() {
            var index = self.recurringTasks.indexOf(task);
            self.recurringTasks.splice(index, 1);
        });
    }

    self.getPointsForUser = function(user){
        var points = 0;
        self.completedTasks().forEach(function(task){
            if (task.completedBy === user._id){
                points += task.points;
            }
        });
        return points;
    }
};

ko.applyBindings(new ListViewModel());