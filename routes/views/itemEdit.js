var keystone = require('../../keystone'),



exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	var Item = req.list;
	
	var itemQuery = Item.model.findById(req.params.id);
    itemQuery.exec(function(err, item) {
        if (err)
        {
        	req.flash('error', err);
        }
        else
        {
        	view.render('list', {categoryName:item.name, id:item._id});
        }
    });
};
