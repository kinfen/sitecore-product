var React = require('react');
var CreateForm = require('../components/CreateForm');

var View = React.createClass({
	
	displayName: 'ListView',
	
	getInitialState: function() {
		return {
			createIsVisible: Keystone.showCreateForm,
			animateCreateForm: false
		};
	},
	
	toggleCreate: function(visible) {
		if (visible)
		{			

     		 parent.$("#item-modal-pre" ).modal({});

		}
		
	},
	renderCreateButton: function() {
		if (Keystone.list.autocreate) {
			return (
				<div className="toolbar">
					<a href={'?new' + Keystone.csrf.query} className="btn btn-default">
						<span className="ion-plus-round mr-5" />
						Create {Keystone.template.singular}
					</a>
				</div>
			);
		}
		return (
			
				<button type="button" className="btn btn-default" onClick={this.toggleCreate.bind(this, true)}>
					<span className="ion-plus-round mr-5" />
					Create {Keystone.template.singular}
				</button>
			
		);
	},
	editCurrentCategory:function(e){
		parent.viewItem(Keystone.list.path, Keystone.category_id);
	},
	editSubCategory:function(e){
		var subcategory_path = "/ksitecore/" + Keystone.list.path + "/list/" + Keystone.category_id + "?type=" + Keystone.list.path;
		window.location = subcategory_path;
	},
	render: function() {
		if (Keystone.template.nocreate) return null;
		
		
		if (this.props.isMobileMode)
		{
			return (
				<ul className="list-group">
					<li className="list-group-item" onClick={this.toggleCreate.bind(this, true)}>
						<span className="ion-plus-round mr-5" />
						Create {Keystone.template.singular}
					</li>
					<li className="list-group-item" onClick={this.editCurrentCategory.bind(this)}>
						
						<span className="glyphicon glyphicon-edit"/>
						<span> &nbsp;Edit</span>

					</li>
					<li className="list-group-item" onClick={this.editSubCategory.bind(this)}>
						
						<span className="glyphicon glyphicon-list-alt"/>
						<span> &nbsp;Edit Sub Categories</span>
						
					</li>
				</ul>
			);
		}
		else{
			return (
				<div className="row">
					<div className="col-xs-6">
						{this.renderCreateButton()}
					</div>
					<div className="col-xs-6">
						<div className="btn-group tableAction pull-right">
							<a className="btn btn-default" role="buttion" onClick={this.editCurrentCategory.bind(this)}>
								<span className="glyphicon glyphicon-edit"/>
								<span> &nbsp;Edit</span>
							</a>
							<a className="btn btn-default" role="buttion" onClick={this.editSubCategory.bind(this)}>
								<span className="glyphicon glyphicon-list-alt"/>
								<span> &nbsp;Edit Sub Categories</span>
							</a>
							<div className="clear"></div>
						</div>
					</div>
				</div>
			);
		}
		
		return (
			<div className="create-item row">
				{this.renderCreateButton()}
			</div>
		);
	}
	
});

React.render(<View isMobileMode={parent.isMobileMode()} />, document.getElementById('list-view'));
if (parent.React)
{
	var b = parent.React.unmountComponentAtNode(parent.$("#item-view-modal")[0]);

}
parent.React = React;
parent.react = React.render(<CreateForm list={Keystone.template} id={Keystone.category_id} values={Keystone.createFormData} err={Keystone.createFormErrors} isMobileMode={parent.isMobileMode()} />, parent.$("#item-view-modal")[0]);