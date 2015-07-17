var keystone = require('../../../');

exports = module.exports = function(req, res) {

	keystone.render(req, res, 'welcome', {
		section: 'home',
		page: 'home',
		title: keystone.get('name') || 'Keystone',
		orphanedLists: keystone.getOrphanedLists()
	});

};
