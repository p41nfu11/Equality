
/*
 * GET home page.
 */

exports.index = function(req, res){
  	res.render('index');
};

exports.lists = function(req, res){
	res.render('lists');
}

exports.showList = function(req, res) {
    var reqList = req.params.id;

    res.render('list', {
        listId: reqList,
        userId: req.user._id
    })
}
