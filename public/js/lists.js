function ListsViewModel() {
    self = this;

    self.lists = ko.observableArray();
    self.title = ko.observable();
    self.listToJoin = ko.observable();
    self.edit = ko.observable(false);

    self.mailTo = ko.observable();
    self.listToShare = ko.observable();
    self.mailContent = ko.computed(function() {
        if (self.listToShare())
             return "Dear whatsyourname\n\nSomeone wants to equal out your relationship by sharing this EquallyDo list with you. Show that someone that you takes care of things by subscribing to this list: \n" + window.location.hostname +"/api/connectToList/" + self.listToShare()._id + "\n\nNow go show that someone who is the real household hero!";
        else
            return "";
    }, this);

    self.init = function(){
    	$.get('/api/lists/', function(data) {
    		data.forEach(function (e){
                e.removingList = ko.observable(false);
    			self.lists.push(e);	
    		});
    	});
    }

	self.addListWasClicked = function(){
    	var newList = {title: self.title, createdDate: new Date()};
    	$.post('/api/list/', newList, function(res, err) {
            res.removingList = ko.observable(false);
    		self.lists.push(res);
    		self.title('');
		});	
    };

    self.joinList = function(){
        $.post('/api/listAddOwner/', {listId: self.listToJoin()}, function(res, err) {
            self.listToJoin('');
        });
    };

    self.removeListFirstClick = function(rList){
        rList.removingList(true);
    };

    self.cancelRemoveList = function(rList){
        rList.removingList(false);
    };

    self.removeList = function(rList){
        rList.removingList(false);
        $.post('/api/removeList/', rList, function(removedList, err) {
                var index = self.lists.indexOf(rList);
                self.lists.splice(index, 1);
        
        });
    };

    self.sendInvite = function(){
        var share = {'listToShare': self.listToShare()._id, 'mailTo': self.mailTo(), 'mailContent': ''};
        $.post('/api/sendInvite/', share, function(response) {
            self.listToShare(undefined);
        });
    };

    self.share = function(clickedList){
        self.listToShare(clickedList);
    };

    self.init();

}

ko.applyBindings(new ListsViewModel());