// Here's my data model
function ListViewModel() {
    self = this;

    self.listId = ko.observable();
    //self.owners = ko.observableArray();
    self.users = ko.observableArray();
    self.tasks = ko.observableArray();
    self.completedTasks = ko.observableArray();
    self.edit = ko.observable(false);
    self.title = ko.observable('');
    self.points = ko.observable('');

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


    self.init = function(){

        console.log(parameter);
        self.listId(parameter.id);

    	$.get('/api/owners/' + parameter.id, function(data) {
    		data.forEach(function (e){
                e.avatar = "https://graph.facebook.com/"+ e.fbUserName + "/picture";
                e.points = ko.observable(e.points);
    			self.users.push(e);	
    		});
    	});

        $.get('/api/tasks/' + parameter.id, function(data) {
            data.forEach(function (e){
                e.editActive = ko.observable(false);
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
        var nextWeek = new Date(Date.parse(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)));
        
        var newTask = {title: self.title, createdDate: new Date(), completed: false, dueDate: nextWeek, points: self.points};
        $.post('/api/task', {task:newTask, listId: parameter.id}, function(data) {
            data.editActive = ko.observable(false);    
            self.addTaskToList(data);
            self.title('');
            self.points('');
        }); 
        

    };

    self.snoozeTaskWasClicked = function(task)
    {   
        var today = new Date();
        var threeDays = new Date(Date.parse(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)));

        task.dueDate = threeDays;

        $.post('/api/updateTask/', task, function(updatedTask) {
            self.removeTaskFromList(task);
            self.addTaskToList(task);
        });
    }

    self.checkboxClicked = function(data){
        $.post('/api/completeTask/', data, function(completedTask) {
            self.removeTaskFromList(data);
            completedTask.editActive = ko.observable(false);
            self.addTaskToList(completedTask);
            var index = -1;
            for (var i = 0; i < self.users().length; i ++)
            {
                if (self.users()[i]._id === completedTask.completedBy){
                    index = i;
                    break;
                }
            }
            if (index > -1){
                var updatingUser = self.users()[index]; 
                if (completedTask.completed)
                    updatingUser.points(updatingUser.points() + completedTask.points);
                else
                    updatingUser.points(updatingUser.points() - completedTask.points);
            }
        }); 
        //returns true so as to notify the checkbox to mark/unmark itself (can not be done in callback)
        return true;
    };

    self.editButtonWasClicked = function(task){
        if (!task.editActive()){
            task.editActive(true);
            self.editTaskTitle(task.title);
        }
        else{
            self.editActive(false);
            self.editTaskTitle('');
        }
    };

    self.editTask = function(task){
        //task.title = self.editTaskTitle();

        $.post('/api/updateTask/', task, function() {
            //self.removeTaskFromList(task);
            //self.addTaskToList(task);
        }); 

        //self.editTaskTitle('');
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