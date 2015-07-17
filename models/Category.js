var keystone = require('../keystone'),
	Types = keystone.Field.Types;
var config = require('../config/config');
/**
 * Gallery Model
 * =============
 */
var Category = new keystone.List('Category');

Category.add({
	name: { label:"名称", type: String, required: true },
	logo: {  type: Types.CloudinaryImage, folder: 'category/logo', select: true, selectPrefix: 'category/logo', autoCleanup : true},
	parent: {label:"父级", type: Types.Relationship, ref: 'Category', treeMode:true },
	template:{label:"模板", type: Types.Select, options: config.templates},
	author: {label:"作者", type: Types.Relationship, ref: 'User', index: true},
	state:{label:"状态", type: Types.Select, options: config.category_states, default:config.CATEGORY_STATE_NORMAL },
	publishedDate: {label:"发布日期", type: Types.Datetime, default: Date.now }
});

Category.defaultColumns = 'name, state|20%,  publishedDate|15%';
Category.register();