var keystone = require('../../../');
var async = require("async");
var _ = require("underscore");
module.exports = function(req, res) {

	
	function checkCSRF() {
		var pass = keystone.security.csrf.validate(req);
		if (!pass) {
			console.error('CSRF failure');

		}
		return pass;
	};
	function ERRORJSON(msg)
	{
		var msgstr;
		msgstr = typeof(msg) == "object" ? msg.message : msg;
		
		return res.json({
			state:0,
			msg:msgstr
		})
	}
	var destList = req.list;
	if (!destList.get('nocreate') && req.method === 'POST' && req.params.action === 'create') {
		if (!checkCSRF()) return ERRORJSON("CSRF failure");
		
		var item = new req.list.model();
		if( req.body.parent)
		{
			item.parent = req.body.parent
		}
		var updateHandler = item.getUpdateHandler(req);	
		if (destList.nameIsInitial) {
			if (!destList.nameField.validateInput(req.body, true, item)) {
				updateHandler.addValidationError(destList.nameField.path, destList.nameField.label + ' is required.');
			}
			destList.nameField.updateItem(item, req.body);
		}
		
		updateHandler.process(req.body, {
			logErrors: true,
			fields: destList.initialFields
		}, function(err) {
			if (err) {
				 return ERRORJSON( err);
			}
			return res.json({
				state:1,
				msg:'success!' + ' New ' + destList.singular + ' ' + destList.getDocumentName(item) + ' created.',
				item:item,
				path:destList.path
			});
		});
		
	}
	else if( req.method === 'POST' && req.params.action === 'update' && !req.list.get('noedit'))
	{
		if (!checkCSRF()) return ERRORJSON("CSRF failure");
		var itemQuery = req.list.model.findById(req.body.id).select();

		itemQuery.exec(function(err, item) {
			item.getUpdateHandler(req).process(req.body, { logErrors: true }, function(err) {
				if (err) {
					return ERRORJSON(err);
				}
				return res.json({
					state : 1,
					msg : 'success! Your changes have been saved.',
					item : item,
					path:destList.path
				});
			});
		});
	}
	else if (req.method === "POST" && req.params.action === "delete" && !destList.get("nodelete"))
	{
		if (!checkCSRF()) return ERRORJSON("CSRF failure");
		
		var id = req.body.id;
		if (typeof(id) == "string")
		{
			if (id === req.user.id) return ERRORJSON('error! You can\'t delete your own ' + destList.singular + '.');
		
			destList.model.findById(id).exec(function (err, item) {
				if (err) {
					return ERRORJSON(err);
				}
				if (!item) {
					return ERRORJSON("can not find item");
				}
				item.remove(function (err) {
					if (err) ERRORJSON('database error', err);
					return res.json({
						state:1,
						msg : "Success remove Item",
						item : item,
						path : destList.path
					});
				});
			});
		}
		else if (typeof(id) == "object")
		{
			if (id.indexOf(req.user.id) != -1)
			{
				id = ids.slice(id.indexOf(req.user.id), 1);	
			}
			destList.model.find().where("_id").in(id).exec(function (err, items) {
				if (err) {
					return ERRORJSON(err);
				}
				console.log("ready for items");
				console.log(items);
				var fun_list = [];
				
				_.each(items, function (item){
					
					fun_list.push(function(cb){
						item.remove(function (err) {
							if (err) ERRORJSON('database error', err);
							cb();
						});
					});
				})
				console.log("ready for waterfall")
				async.waterfall(fun_list, function(err){
					return res.json({
						state:1,
						msg:"succcess remove Items",
						path : destList.path
					});
				});
				
			});
		}
	}
	else
	{
		return ERRORJSON("unknow request");
	}

//	if (req.method === 'POST' && req.body.action === 'updateItem' && !req.list.get('noedit')) {
//
//		if (!keystone.security.csrf.validate(req)) {
//			console.error('CSRF failure', req.method, req.body);
//			
//			req.flash('error', 'There was a problem with your request, please try again.');
//		}
//
//		item.getUpdateHandler(req).process(req.body, { flashErrors: true, logErrors: true }, function(err) {
//			if (err) {
//				return renderView();
//			}
//			req.flash('success', 'Your changes have been saved.');
//			return res.redirect('/keystone/' + req.list.path + '/' + item.id);
//		});
//
//
//	} else {
//		renderView();
//	}
	
//	if ('update' in req.query) {
//	
//		if (!checkCSRF()) return startRender();
//		
//		(function() {
//			var data = null;
//			if (req.query.update) {
//				try {
//					data = JSON.parse(req.query.update);
//				} catch(e) {
//					req.flash('error', 'There was an error parsing the update data.');
//					return startRender();
//				}
//			}
//			sl.updateAll(data, function(err) {
//				if (err) {
//					console.log('Error updating all ' + template.plural);
//					console.log(err);
//					req.flash('error', 'There was an error updating all ' + template.plural + ' (logged to console)');
//				} else {
//					req.flash('success', 'All ' + sl.plural + ' updated successfully.');
//				}
//				res.redirect('/ksitecore/' + req.list.path + "/list/?type=" + template.path);
//			});
//		})();
//		
//	} else if (!template.get('nodelete') && req.query['delete']) {
//		
//		if (!checkCSRF()) return startRender();
//		
//		if (req.query['delete'] === req.user.id) {
//			req.flash('error', 'You can\'t delete your own ' + template.singular + '.');
//			return startRender();
//		}
//		
//		sl.model.findById(req.query['delete']).exec(function (err, item) {
//			if (err || !item) return res.redirect('/ksitecore/' + req.list.path + "/list/" + req.params.id + "?type=" + template.path);
//			
//			item.remove(function (err) {
//				if (err) {
//					console.log('Error deleting ' + template.singular);
//					console.log(err);
//					req.flash('error', 'Error deleting the ' + template.singular + ': ' + err.message);
//				} else {
//					req.flash('success', template.singular + ' deleted successfully.');
//				}
//				if (req.params.id && req.params.id != "undefined")
//				{
//					res.redirect('/ksitecore/' + req.list.path + "/list/" + req.params.id + "?type=" + template.path);
//				}
//				else
//				{
//					res.redirect('/ksitecore/welcome');
//				}
//				
//			});
//		});
//		
//		return;
//		
//	} else if (!template.get('nocreate') && template.get('autocreate') && _.has(req.query, 'new')) {
//		
//		if (!checkCSRF()) return startRender();
//		
//		var item = new template.model();
//		item.save(function(err) {
//			
//			if (err) {
//				console.log('There was an error creating the new ' + template.singular + ':');
//				console.log(err);
//				req.flash('error', 'There was an error creating the new ' + template.singular + '.');
//				startRender();
//			} else {
//				req.flash('success', 'New ' + template.singular + ' ' + template.getDocumentName(item) + ' created.');
//				return res.redirect('/keystone/' + template.path + '/' + item.id);
//			}
//			
//		});
//		
//	} else if (!template.get('nocreate') && req.method === 'POST' && req.body.action === 'create') {
//		
//		if (!checkCSRF()) return startRender();
//		
//		var item = new template.model();
//		if( req.body.parent)
//		{
//			item.parent = req.body.parent
//		}
//		else 
//		{
//			item.parent = category.id;
//		}
//		console.log('log:' + item);
//		
//		var updateHandler = item.getUpdateHandler(req);
//		
//		viewLocals.showCreateForm = true; // always show the create form after a create. success will redirect.
//		
//		if (template.nameIsInitial) {
//			if (!template.nameField.validateInput(req.body, true, item)) {
//				updateHandler.addValidationError(template.nameField.path, template.nameField.label + ' is required.');
//			}
//			template.nameField.updateItem(item, req.body);
//		}
//		
//		updateHandler.process(req.body, {
//			logErrors: true,
//			fields: template.initialFields
//		}, function(err) {
//			if (err) {
//				viewLocals.createErrors = err;
//				return startRender();
//			}
//			req.flash('success', 'New ' + template.singular + ' ' + template.getDocumentName(item) + ' created.');
//			return res.redirect('/keystone/' + template.path + '/' + item.id);
//		});
//		
//	} else {
//		startRender();
//	}
//	
//	
//	
//	
//	query.exec(function(err, item) {
//
//		if (err) return res.status(500).json({ err: 'database error', detail: err });
//		if (!item) return res.status(404).json({ err: 'not found', id: req.params.id });
//
//		var tasks = [];
//		var drilldown;
//		var relationships;
//
//		/* Drilldown (optional, provided if ?drilldown=true in querystring) */
//		if (req.query.drilldown === 'true' && req.list.get('drilldown')) {
//			drilldown = {
//				def: req.list.get('drilldown'),
//				items: []
//			};
//
//			tasks.push(function(cb) {
//
//				// TODO: proper support for nested relationships in drilldown
//				
//				// step back through the drilldown list and load in reverse order to support nested relationships
//				drilldown.def = drilldown.def.split(' ').reverse();
//
//				async.eachSeries(drilldown.def, function(path, done) {
//
//					var field = req.list.fields[path];
//
//					if (!field || field.type !== 'relationship') {
//						throw new Error('Drilldown for ' + req.list.key + ' is invalid: field at path ' + path + ' is not a relationship.');
//					}
//
//					var refList = field.refList;
//
//					if (field.many) {
//						if (!item.get(field.path).length) {
//							return done();
//						}
//						refList.model.find().where('_id').in(item.get(field.path)).limit(4).exec(function(err, results) {
//							if (err || !results) {
//								done(err);
//							}
//							var more = (results.length === 4) ? results.pop() : false;
//							if (results.length) {
//								// drilldown.data[path] = results;
//								drilldown.items.push({
//									list: refList.getOptions(),
//									items: _.map(results, function(i) {
//										return {
//											label: refList.getDocumentName(i),
//											href: '/keystone/' + refList.path + '/' + i.id
//										};
//									}),
//									more: (more) ? true : false
//								});
//							}
//							done();
//						});
//					} else {
//						if (!item.get(field.path)) {
//							return done();
//						}
//						refList.model.findById(item.get(field.path)).exec(function(err, result) {
//							if (result) {
//								// drilldown.data[path] = result;
//								drilldown.items.push({
//									list: refList.getOptions(),
//									items: [{
//										label: refList.getDocumentName(result),
//										href: '/keystone/' + refList.path + '/' + result.id
//									}]
//								});
//							}
//							done(err);
//						});
//					}
//
//				}, function(err) {
//					// put the drilldown list back in the right order
//					drilldown.def.reverse();
//					drilldown.items.reverse();
//					cb(err);
//				});
//
//			});
//		}
//
//		/* Relationships (optional, provided if ?relationships=true in querystring) */
//
//		if (req.query.relationships === 'true') {
//			tasks.push(function(cb) {
//
//				relationships = _.values(_.compact(_.map(req.list.relationships, function(i) {
//					if (i.isValid) {
//						return _.clone(i);
//					} else {
//						keystone.console.err('Relationship Configuration Error', 'Relationship: ' + i.path + ' on list: ' + req.list.key + ' links to an invalid list: ' + i.ref);
//						return null;
//					}
//				})));
//
//				async.each(relationships, function(rel, done) {
//
//					// TODO: Handle invalid relationship config
//					rel.list = keystone.list(rel.ref);
//					rel.sortable = (rel.list.get('sortable') && rel.list.get('sortContext') === req.list.key + ':' + rel.path);
//
//					// TODO: Handle relationships with more than 1 page of results
//					var q = rel.list.paginate({ page: 1, perPage: 100 })
//						.where(rel.refPath).equals(item.id)
//						.sort(rel.list.defaultSort);
//
//					// rel.columns = _.reject(rel.list.defaultColumns, function(col) { return (col.type == 'relationship' && col.refList == req.list) });
//					rel.columns = rel.list.defaultColumns;
//					rel.list.selectColumns(q, rel.columns);
//
//					q.exec(function(err, results) {
//						rel.items = results;
//						done(err);
//					});
//
//				}, cb);
//			});
//		}
//
//		/* Process tasks & return */
//		async.parallel(tasks, function(err) {
//			if (err) {
//				return res.status(500).json({
//					err: 'database error',
//					detail: err
//				});
//			}
//			res.json(_.assign(req.list.getData(item, fields), {
//				drilldown: drilldown,
//				relationships: relationships
//			}));
//		});
//	});
};
