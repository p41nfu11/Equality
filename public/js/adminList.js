function AdminViewModel() {
    self = this;

    self.lists = ko.observableArray();

    $.get('/admin/lists/', function(listsData) {
        listsData.forEach(function (list){
            self.lists.push(list);
        });
    });   
};

ko.applyBindings(new AdminViewModel());