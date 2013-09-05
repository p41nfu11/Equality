function AdminViewModel() {
    self = this;

    self.lists = ko.observableArray();
    self.logEntries = ko.observableArray();
    self.recurringTasks = ko.observableArray();

    $.get('/admin/lists/', function(listsData) {
        listsData.forEach(function (list){
            self.lists.push(list);
        });
    });   

    $.get('/admin/log/', function(log) {
        log.forEach(function (entry){
            self.logEntries.push(entry);
        });
    }); 

    $.get('/admin/recurringtasks/', function(rtasks) {
        rtasks.forEach(function (task){
            self.recurringTasks.push(task);
        });
    }); 
};

ko.applyBindings(new AdminViewModel());