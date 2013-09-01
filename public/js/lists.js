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
             return "Dear whatsyourname\n\nSomeone wants to equal out your relationship by sharing this equality list with you. Show that someone that you are the one that takes care of things by subscribing to this list: \n" + window.location.hostname +"/api/connectToList/" + self.listToShare()._id + "\n\nIf the link does nothing for you try loggin in to http://kaizen.menmo.se first and click the link again.\n\nNow go show that someone who is the real household hero!";
        else
            return "";
    }, this);

    self.init = function(){
    	$.get('/api/lists/', function(data) {
    		data.forEach(function (e){
    			self.lists.push(e);	
    		});
    	});
    }

	self.addListWasClicked = function(){
    	var newList = {title: self.title, createdDate: new Date()};
    	$.post('/api/list/', newList, function(res, err) {
    		self.lists.push(res);
    		self.title('');
		});	
    };

    self.joinList = function(){
        $.post('/api/listAddOwner/', {listId: self.listToJoin()}, function(res, err) {
            self.listToJoin('');
        });
    }

    self.removeList = function(rList){
        $.post('/api/removeList/', rList, function(removedList, err) {
            
                var index = self.lists.indexOf(rList);
                self.lists.splice(index, 1);
        
        });
    }

    self.sendInvite = function(){
        var share = {'listToShare': self.listToShare()._id, 'mailTo': self.mailTo(), 'mailContent': self.mailContent()};
        $.post('/api/sendInvite/', share, function(response) {
            self.listToShare(undefined);
        });
    }

    self.share = function(clickedList){
        self.listToShare(clickedList);
    }

    self.init();

}

ko.applyBindings(new ListsViewModel());