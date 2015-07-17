var debug = require('debug')('keystone:core:routes');
/**
 * Adds bindings for the keystone routes
 *
 * ####Example:
 *
 *     var app = express();
 *     app.use(...); // middleware, routes, etc. should come before keystone is initialised
 *     keystone.routes(app);
 *
 * @param {Express()} app
 * @api public
 */

function routes(app) {
	this.app = app;
	var keystone = this;

	// ensure keystone nav has been initialised
	if (!this.nav) {
		debug('setting up nav');
		this.nav = this.initNav();
	}

	// Cache compiled view templates if we are in Production mode
	this.set('view cache', this.get('env') === 'production');

	// Bind auth middleware (generic or custom) to /keystone* routes, allowing
	// access to the generic signin page if generic auth is used

	if (this.get('auth') === true) {
		debug('setting up auth');

		if (!this.get('signout url')) {
			this.set('signout url', '/ksitecore/signout');
		}
		if (!this.get('signin url')) {
			this.set('signin url', '/ksitecore/signin');
		}

		if (!this.nativeApp || !this.get('session')) {
			app.all('/ksitecore*', this.session.persist);
		}
		//set route to ksitecore views
		app.all('/ksitecore/signin', require('../../admin/routes/views/signin'));
		app.all('/ksitecore/signout', require('../../admin/routes/views/signout'));
		app.all('/ksitecore*', this.session.keystoneAuth);
		app.all('/keystone*', this.session.keystoneAuth);

	} else if ('function' === typeof this.get('auth')) {
		debug('setting up auth');
		app.all('/ksitecore*', this.get('auth'));
	}

	function initList(respectHiddenOption) {
		return function(req, res, next) {
			req.list = keystone.list(req.params.list);

			if (!req.list || (respectHiddenOption && req.list.get('hidden'))) {
				debug('could not find list ', req.params.list);
				req.flash('error', 'List ' + req.params.list + ' could not be found.');
				return res.redirect('/keystone');
			}

			debug('getting list ', req.params.list);
			next();
		};
	}

	debug('setting keystone Admin Route');

	// Email test routes
	if (this.get('email tests')) {
		debug('setting email test routes');
		this.bindEmailTestRoutes(app, this.get('email tests'));
	}

	// Cloudinary API for selecting an existing image / upload a new image
	if (keystone.get('cloudinary config')) {
		debug('setting cloudinary api');
		app.get('/keystone/api/cloudinary/get', require('../../admin/api/cloudinary').get);
		app.get('/keystone/api/cloudinary/autocomplete', require('../../admin/api/cloudinary').autocomplete);
		app.post('/keystone/api/cloudinary/upload', require('../../admin/api/cloudinary').upload);
	}

	// Init API request helpers
	app.use('/keystone/api', function(req, res, next) {
		res.apiError = function(key, err) {
			var statusCode = 500;
			if (key === 404) {
				statusCode = 404;
				key = null;
				key = 'not found';
			}
			if (!key) {
				key = 'unknown error';
			}
			if (!err) {
				err = 'API Error';
			}
			if (typeof err === 'object' && err.message) {
				err = err.message;
			}
			res.status(statusCode);
			res.json({ err: err, key: key });
		};
		next();
	});

	// Generic Lists API
	debug('setting generic list api');
	app.all('/keystone/api/:list/:action(autocomplete|order|create|fetch)', initList(), require('../../admin/api/list'));
	app.post('/keystone/api/:list/delete', initList(), require('../../admin/api/list/delete'));
	app.get('/keystone/api/:list/:id', initList(), require('../../admin/api/item/get'));
	app.post('/keystone/api/:list/:id/delete', initList(), require('../../admin/api/item/delete'));
	app.all('/ksitecore/api/:list/:action(create|delete|update)', initList(), require('../../admin/api/item/CRUD'));
	debug('setting generic Lists download route');
	app.all('/keystone/download/:list', initList(), require('../../admin/api/download'));

	// Admin-UI API
	debug('setting list and item details admin routes');
	app.all('/keystone/:list/:page([0-9]{1,5})?', initList(true), require('../../admin/routes/views/list'));
	app.all('/keystone/:list/:item', initList(true), require('../../admin/routes/views/item'));
	
	app.get('/ksitecore', require('../../admin/routes/views/contentManager'));
//	app.get('/ksitecore/err', require('../../admin/routes/views/err'));
	app.get('/ksitecore/welcome', require('../../admin/routes/views/welcome'));
	app.all('/ksitecore/:list/list', initList(true), require('../../admin/routes/views/list'));
	app.all('/ksitecore/:list/list/:id', initList(true), require('../../admin/routes/views/list'));
	
	return this;
}

module.exports = routes;
