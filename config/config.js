var Config = function()
{
	
}

Config.prototype.CATEGORY_STATE_NORMAL = 'normal';
Config.prototype.CATEGORY_STATE_DISABLED = 'disabled';
Config.prototype.templates = ['Archive', 'Category'];
Config.prototype.category_states = [Config.prototype.CATEGORY_STATE_NORMAL, Config.prototype.CATEGORY_STATE_DISABLED];

Config.prototype.Archive_STATE_NORMAL = 'normal';
Config.prototype.Archive_STATE_DISABLED = 'disabled';
Config.prototype.templates = ['Archive', 'Category'];
Config.prototype.archive_states = [Config.prototype.Archive_STATE_NORMAL, Config.prototype.Archive_STATE_DISABLED];

exports = module.exports = new Config();
