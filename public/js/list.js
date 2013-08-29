// Here's my data model
function ListViewModel() {
    self = this;

    self.listId = ko.observable();
    self.owners = ko.observableArray();
    self.users = ko.observableArray();
    self.tasks = ko.observableArray();
    self.completedTasks = ko.observableArray();
    self.edit = ko.observable(false);
    self.title = ko.observable('');

    //edit
    self.editTaskTitle = ko.observable('');


    self.init = function(){

        console.log(parameter);
        self.listId(parameter.id);

    	$.get('/api/user/', function(data) {
    		data.forEach(function (e){
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

    self.removeTaskFromList = function(task, fromCompletedList)
    {
        if (fromCompletedList)
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
        var today = new Date();
        var tomorrow = new Date(Date.parse(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)));
        
        var newTask = {title: self.title, createdDate: new Date(), completed: false, dueDate: tomorrow};
        $.post('/api/task', {task:newTask, listId: parameter.id}, function(data) {
            
            self.addTaskToList(data);
            self.title('');
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
        $.post('/api/updateTask/', data, function(updatedTask) {
            self.removeTaskFromList(data, !data.completed);
            self.addTaskToList(data);
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
};

ko.applyBindings(new ListViewModel());