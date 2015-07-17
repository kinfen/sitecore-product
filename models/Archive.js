var keystone = require('../keystone'),
	Types = keystone.Field.Types,
	config = require('../config/config');

/**
 * Gallery Model
 * =============
 */

var Archive = new keystone.List('Archive');

Archive.add({
	name: { label:"标题", type: String, required: true },
	subName : { label:"副标题",  type: String, default:''},
	parent: {label:"栏目", type: Types.Relationship, ref: 'Category',default:'', treeMode:true },
	author: {label:"作者", type: String, default:''},
	content : {label:"内容", type: Types.Textarea},
	state : {label:"状态", type: Types.Select, options: config.category_states, default:config.CATEGORY_STATE_NORMAL},
	publishedDate: {label:"发布日期", type: Date, default: Date.now },
});
Archive.defaultColumns = 'name, author|20%, publishedDate|20%';
Archive.register();