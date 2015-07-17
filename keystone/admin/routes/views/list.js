var keystone = require('../../../'),
	_ = require('underscore'),
	async = require('async')

var ListHandle = function(req, res)
{
	var category = null;
	var template = keystone.list(req.query.type) || req.list;
	var pageSize = req.query.pagesize || 10;
	var sort = { by: req.query.sort || template.defaultSort };
	var viewLocals = {
				validationErrors: {},
				showCreateForm: _.has(req.query, 'new')
			};
	var filters = template.processFilters(req.query.q),
		cleanFilters = {},
		queryFilters = template.getSearchFilters(req.query.search, filters),
		columns = (req.query.cols) ? template.expandColumns(req.query.cols) : template.defaultColumns,
		populates = [],
		fields = null;
	function getFields()
	{
		//set table columns prototype,such as label, align, width
		var fieldsList = [{field:"selected", title:"selected", checkbox:true}];
		for (var i = 0 ; i < columns.length; i++)
		{
			var obj = columns[i];
			var item = {field:obj.path, title:obj.label, align:"center"};
			if (obj.path == "name")
			{
				item.align = "left";
			}
			if (obj.width){
				item.width = obj.width;
			}
			if (obj.populate){
				var str = obj.populate.path;
				populates.push(str);
			}
			fieldsList.push(item);
		}
		return fieldsList;
	};
	function loadCa()
	{
		var itemQuery = null;
		if (!req.params.id)
		{
			//find root category when no id was translate to list
			itemQuery = req.list.model.findOne({parent:undefined});
		}
		else
		{
			itemQuery = req.list.model.findById(req.params.id);
		}
		itemQuery.exec(function(err, item) {
			if (!item) {
				req.flash('error', 'Item could not be found.');
				return res.redirect('/ksitecore/err');
			}
			category = item;
			handleCRUD();
		});	
	}
	function loadList(cb)
	{
		if (category)
		{
			var listQuery = template.paginate({page: req.page, perPage:req.pageSize }).where('parent', category._id).sort(sort.by);
			for (var i = 0; i < populates.length; i++){
				listQuery.populate(populates[i], "name");
			}
			listQuery.exec(function (err, list){
				if (err) {
					req.flash('error', 'List ' + req.params.item + ' could not be found.');
					return res.redirect(req.path);
				}
				items = list;
				cb();
	
			});
		}
		else
		{
			cb();
		}
	}
	function renderView() {
				
		// async.parallel(function(err) {
			keystone.render(req, res, 'list', _.extend(viewLocals, {
				page: 'list',
				submitted: req.body || {},
				list: req.list,
				template: template,
				req: req,
				category: category,
				items:items,
				callfrom:res.path,
//				Date2:Date,
				// section: keystone.nav.by.list[req.list.key] || {},
				// title: 'Keystone: ' + colPathsreq.list.plural,
				// page: 'list',
				// link_to: link_to,
				// download_link: download_link,
				// list: req.list,
				sort: sort,
				filters: cleanFilters,
				// search: req.query.search,
				columns: fields,
				colPaths: _.pluck(columns, 'path'),
				query: req.query
			}));
	};
	function startRender()
	{
		async.waterfall([loadList], function(err){
			renderView();
		});
	};
	function checkCSRF() {
		var pass = keystone.security.csrf.validate(req);
		if (!pass) {
			console.error('CSRF failure');
			req.flash('error', 'There was a problem with your request, please try again.');
		}
		return pass;
	};
	function handleCRUD()
	{
		if ('update' in req.query) {
		
			if (!checkCSRF()) return startRender();
			
			(function() {
				var data = null;
				if (req.query.update) {
					try {
						data = JSON.parse(req.query.update);
					} catch(e) {
						req.flash('error', 'There was an error parsing the update data.');
						return startRender();
					}
				}
				sl.updateAll(data, function(err) {
					if (err) {
						console.log('Error updating all ' + template.plural);
						console.log(err);
						req.flash('error', 'There was an error updating all ' + template.plural + ' (logged to console)');
					} else {
						req.flash('success', 'All ' + sl.plural + ' updated successfully.');
					}
					res.redirect('/ksitecore/' + req.list.path + "/list/?type=" + template.path);
				});
			})();
			
		} else if (!template.get('nodelete') && req.query['delete']) {
			
			if (!checkCSRF()) return startRender();
			
			if (req.query['delete'] === req.user.id) {
				req.flash('error', 'You can\'t delete your own ' + template.singular + '.');
				return startRender();
			}
			
			sl.model.findById(req.query['delete']).exec(function (err, item) {
				if (err || !item) return res.redirect('/ksitecore/' + req.list.path + "/list/" + req.params.id + "?type=" + template.path);
				
				item.remove(function (err) {
					if (err) {
						console.log('Error deleting ' + template.singular);
						console.log(err);
						req.flash('error', 'Error deleting the ' + template.singular + ': ' + err.message);
					} else {
						req.flash('success', template.singular + ' deleted successfully.');
					}
					if (req.params.id && req.params.id != "undefined")
					{
						res.redirect('/ksitecore/' + req.list.path + "/list/" + req.params.id + "?type=" + template.path);
					}
					else
					{
						res.redirect('/ksitecore/welcome');
					}
					
				});
			});
			
			return;
			
		} else if (!template.get('nocreate') && template.get('autocreate') && _.has(req.query, 'new')) {
			
			if (!checkCSRF()) return startRender();
			
			var item = new template.model();
			item.save(function(err) {
				
				if (err) {
					console.log('There was an error creating the new ' + template.singular + ':');
					console.log(err);
					req.flash('error', 'There was an error creating the new ' + template.singular + '.');
					startRender();
				} else {
					req.flash('success', 'New ' + template.singular + ' ' + template.getDocumentName(item) + ' created.');
					return res.redirect('/keystone/' + template.path + '/' + item.id);
				}
				
			});
			
		} else if (!template.get('nocreate') && req.method === 'POST' && req.body.action === 'create') {
			
			if (!checkCSRF()) return startRender();
			
			var item = new template.model();
			if( req.body.parent)
			{
				item.parent = req.body.parent
			}
			else 
			{
				item.parent = category.id;
			}
			console.log('log:' + item);
			
			var updateHandler = item.getUpdateHandler(req);
			
			viewLocals.showCreateForm = true; // always show the create form after a create. success will redirect.
			
			if (template.nameIsInitial) {
				if (!template.nameField.validateInput(req.body, true, item)) {
					updateHandler.addValidationError(template.nameField.path, template.nameField.label + ' is required.');
				}
				template.nameField.updateItem(item, req.body);
			}
			
			updateHandler.process(req.body, {
				logErrors: true,
				fields: template.initialFields
			}, function(err) {
				if (err) {
					viewLocals.createErrors = err;
					return startRender();
				}
				req.flash('success', 'New ' + template.singular + ' ' + template.getDocumentName(item) + ' created.');
				return res.redirect('/keystone/' + template.path + '/' + item.id);
			});
			
		} else {
			startRender();
		}
	}
	
	_.each(filters, function(filter, path) {
		cleanFilters[path] = _.omit(filter, 'field');
	});
	fields = getFields();
	loadCa();
	
}

exports = module.exports = ListHandle;
