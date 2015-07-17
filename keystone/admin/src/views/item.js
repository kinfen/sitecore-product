var React = require('react');
var request = require('superagent');

var CreateForm = require('../components/CreateForm');
var EditForm = require('../components/EditForm');
var Header = require('../components/ItemViewHeader');

var View = React.createClass({
	
	displayName: 'ItemView',
	
	getInitialState: function() {
		return {
			createIsVisible: false,
			list: Keystone.list,
			itemData: null
		};
	},

	componentDidMount: function() {
		this.loadItemData();
	},

	loadItemData: function() {
		request.get('/keystone/api/' + Keystone.list.path + '/' + this.props.item_id + '?drilldown=true')
			.set('Accept', 'application/json')
			.end((err, res) => {
				if (err || !res.ok) {
					// TODO: nicer error handling
					console.log('Error loading item data:', res ? res.text : err);
					alert('Error loading data (details logged to console)');
					return;
				}
				this.setState({
					itemData: res.body
				});
			});
	},
	
	toggleCreate: function(visible) {
		this.setState({
			createIsVisible: visible
		});
	},
//	renderCreateForm: function() {
//		if (!this.state.createIsVisible) return null;
//		return <CreateForm list={Keystone.list} id={Keystone.category_id} animate onCancel={this.toggleCreate.bind(this, false) data-bind={formData}} />;
//	},
//	
	render: function() {
		if (!this.state.itemData) return <div />;
		return (
			<div>
				<Header list={this.state.list} data={this.state.itemData} toggleCreate={this.toggleCreate} req_from={Keystone.req_from} />
				<EditForm list={this.state.list} data={this.state.itemData} />

			</div>
		);
	}
	
});

React.render(<View item_id={Keystone.item_id} />, document.getElementById('item-view'));
