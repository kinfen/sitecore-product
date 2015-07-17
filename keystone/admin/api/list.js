var _ = require('underscore');
var async = require('async');
var keystone = require('../../');
var jade = require('jade');




exports = module.exports = function(req, res) {

	var sendResponse = function(status) {
		res.json(status);
	};
	var comcatNotInIDs = function(path, id, no_in_id_lsit, cb)
	{
		var list = keystone.list(path);
		query = list.model.find({"parent": id});
		query.exec(function(err, items) {
			if (err) 
			{
				console.log('database error when comcatNotInIDs');
				cb();
				return;
			}
			if (items.length == 0){
				cb();
			}
			else{
				var waterfall_Fun_list = [];
				items.map(function(i) {
					no_in_id_lsit.push(i.id);
					waterfall_Fun_list.push(function(cb2){
						comcatNotInIDs(path, i.id, no_in_id_lsit, cb2);
					})
					
				});
				async.waterfall(waterfall_Fun_list, function(err){
					cb();
				})
			}
		});
	}
	

	var sendError = function(key, err, msg) {
		msg = msg || 'API Error';
		key = key || 'unknown error';
		msg += ' (' + key + ')';
		console.log(msg + (err ? ':' : ''));
		if (err) {
			console.log(err);
		}
		res.status(500);
		sendResponse({ error: key || 'error', detail: err ? err.message : '' });
	};

	switch (req.params.action){

		case 'autocomplete':
			var limit = req.query.limit || 50;
			var page = req.query.page || 1;
			var skip = limit * (page - 1);
			var filters = req.list.getSearchFilters(req.query.q);
			var no_in_idList = [];
			
			var autocompleteProcess = function ()
			{
				var query = req.list.model.find(filters)
							.where("_id").nin(no_in_idList)
							.limit(limit)
							.skip(skip)
							.sort(req.list.defaultSort);
				var count = req.list.model.count(filters);
				
				if (req.query.context === 'relationship') {
					var srcList = keystone.list(req.query.list);
					if (!srcList) return sendError('invalid list provided');
			
					var field = srcList.fields[req.query.field];
					if (!field) return sendError('invalid field provided');
			
					_.each(req.query.filters, function(value, key) {
						query.where(key).equals(value ? value : null);
						count.where(key).equals(value ? value : null);
					});
				}
				
				count.exec(function(err, total) {
			
					if (err) return sendError('database error', err);
			
					query.exec(function(err, items) {
			
						if (err) return sendError('database error', err);
						
						sendResponse({
							total: total,
							items: items.map(function(i) {
								return {
									name: req.list.getDocumentName(i, false) || '(' + i.id + ')',
									id: i.id
								};
							})
						});
			
					});
			
				});
			}
			//deal
			if(_.has(req.query, "treemode") && req.query.id)
			{
				no_in_idList.push(req.query.id);
				async.waterfall([function(cb){
					comcatNotInIDs(req.list.path, req.query.id, no_in_idList, cb);
					
				}],function(err){
					autocompleteProcess();
				});
			}
			else{
				autocompleteProcess();
				
			}
		break;
		case 'order':

			if (!keystone.security.csrf.validate(req)) {
				return sendError('invalid csrf');
			}

			var order = req.query.order || req.body.order;
			var queue = [];

			if ('string' === typeof order) {
				order = order.split(',');
			}

			_.each(order, function(id, i) {
				queue.push(function(done) {
					req.list.model.update({ _id: id }, { $set: { sortOrder: i } }, done);
				});
			});

			async.parallel(queue, function(err) {

				if (err) return sendError('database error', err);

				return sendResponse({
					success: true
				});

			});
		break;
		case 'create':

			if (!keystone.security.csrf.validate(req)) {
				return sendError('invalid csrf');
			}

			var item = new req.list.model();
			var updateHandler = item.getUpdateHandler(req);
			var data = (req.method === 'POST') ? req.body : req.query;

			if (req.list.nameIsInitial) {
				if (req.list.nameField.validateInput(data)) {
					req.list.nameField.updateItem(item, data);
				} else {
					updateHandler.addValidationError(req.list.nameField.path, 'Name is required.');
				}
			}

			updateHandler.process(data, {
				flashErrors: true,
				logErrors: true,
				fields: req.list.initialFields
			}, function(err) {
				if (err) {
					return sendResponse({
						success: false,
						err: err
					});
				} else {
					return sendResponse({
						success: true,
						name: req.list.getDocumentName(item, false),
						id: item.id
					});
				}
			});

		break;

		case 'fetch':
		
			if (!keystone.security.csrf.validate(req)) {
				return sendError('invalid csrf');
			}
			
			(function() {

				var queryFilters = req.list.getSearchFilters(req.query.search, req.query.filters);
				var skip = parseInt(req.query.items.last) - 1;
				var querystring = require('querystring');
				var link_to = function(params) {
						var p = params.page || '';
						delete params.page;
						var queryParams = _.clone(req.query.q);
						for (var i in params) {
							if (params[i] === undefined) {
								delete params[i];
								delete queryParams[i];
							}
						}
						params = querystring.stringify(_.defaults(params, queryParams));
						return '/keystone/' + req.list.path + (p ? '/' + p : '') + (params ? '?' + params : '');
					};

				var query = req.list.model.find(queryFilters).sort(req.query.sort).skip(skip).limit(1);
				var columns = req.list.expandColumns(req.query.cols);

				req.list.selectColumns(query, columns);

				query.exec(function(err, items) {
					if (err) return sendError('database error', err);
					if (!items) return sendError('not found');

					var locals, row, pagination;

					req.list.getPages(req.query.items, req.list.pagination.maxPages);

					locals = { list: req.list, columns: columns, item: items[0], csrf_query: req.query.csrf_query, _:_ };
					row = jade.renderFile(__dirname + '/../../templates/partials/row.jade', locals);
					pagination = jade.renderFile(__dirname + '/../../templates/partials/pagination.jade', { items: req.query.items, link_to: link_to });

					return sendResponse({
						item: items[0],
						row: row,
						pagination: pagination,
						success: true,
						count: 1
					});
				});
			
			})();

		break;

	}

};
