var keystone = require('../../../'),
	_ = require('underscore'),
	async = require('async'),
	Category = keystone.list('Category');


exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	console.log("ho");

	var itemQuery = Category.model.find()
    .exec(function(err, categorys) {
        if (err)
        {
        		req.flash('error', err);
        }
        else
        {
        	var hashData = {};
        	for (var i = 0; i < categorys.length; i++)
        	{
        		var obj = categorys[i];
			var tmp = {};
			tmp._id = obj._id;
    			tmp.text = obj.name;
			tmp.template  = obj.template || "categories";
        		var tag = obj.parent ? obj.parent + '' : 'root';
        		tmp.parent = tag;
        		if (hashData[tag] == null)
        		{
        			hashData[tag] = [];
        		}
        		hashData[tag].push(tmp);
        		// console.log('create array ' + hashData[tag].length);
        	}
        	function reformData(tag, res)
			{
				var list = null;
				if (res[tag])
				{
					list = res[tag];
				}
				if (!list) return null;

				for (var i = 0; i < list.length; i++)
				{
					var obj = list[i];

					obj.nodes = reformData(obj._id, res);
					
				}

				// console.log(list);
				return list;
			}

			var menuData = reformData('root', hashData);
			// console.log(menuData);

        	keystone.render(req, res, 'contentManager', {
        		list: Category,
				items:JSON.stringify(menuData)}
			);
        }
    });


	// // Render the view
	// view.render('contentManager', {categoryName:'kinfen'});
	// // view.render('sitecore');
	
};
