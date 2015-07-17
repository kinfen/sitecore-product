var _ = require('underscore'),
	React = require('react'),
	Fields = require('FieldTypes'),
	InvalidFieldType = require('./InvalidFieldType');

var Form = React.createClass({
	
	displayName: 'CreateForm',
	createSuccess : false,
	didAction : false,
	getDefaultProps: function() {
		return {
			err: null,
			values: {},
			animate: false,
			type: null
		};
	},
	getInitialState: function() {
		
		var values = this.props.values;
		
		_.each(this.props.list.fields, function(field) {
			if (!values[field.path]) {
				values[field.path] = field.defaultValue;
			}
		});
		
		return {
			values: values
		};
		
	},
	
	handleChange: function(event) {
		var values = this.state.values;
		values[event.path] = event.value;
		this.setState({
			values: values
		});
	},

	componentWillMount: function() {
		this._bodyStyleOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	},
	
	componentDidMount: function() {
		if (this.refs.focusTarget) {
			this.refs.focusTarget.focus();
		}
		var self = this;
		parent.$('#item-modal-pre').on('hidden.bs.modal', function (e) {
		  // do something...
			if (self.createSuccess)
			{
				parent.$('#item-modal').modal();
			}
			self.setState({
				values:self.getInitialState()
			})
		});
		parent.$('#item-modal').on('hidden.bs.modal', function(e){
			self.createSuccess = false;
	        parent.$("#item-form-frame").attr("src", "");

	        if (self.didAction)
	        {
		        	if (Keystone.template.path === "categories")
				{
					parent.window.location.reload();
				}
				else
				{
					window.location.reload();
				}
	        }
	        
	        
		});
		
	},
	
	componentWillUnmount: function() {
		document.body.style.overflow = this._bodyStyleOverflow;
		parent.$('#item-modal-pre').on('hidden.bs.modal', null);
		parent.$('#item-modal').on('hidden.bs.modal', null);
	},
	
	getFieldProps: function(field) {
		var props = _.clone(field);
		props.value = this.state.values[field.path];
		props.values = this.state.values;
		props.onChange = this.handleChange;
		props.mode = 'create';
		return props;
	},
	refreshFormFrame:function(e)
	{
		parent.$('#item-form-frame')[0].contentWindow.location.reload();
	},
	createItem:function(e){
		var self = this;
		var data = this.props.values;
		var extendData = {};
		extendData[Keystone.csrf.key] = Keystone.csrf.value;
		extendData.parent = Keystone.category_id;
		_.extend(data, extendData);
		var l = parent.Ladda.create(e.currentTarget);
		l.start();
	    $.ajax({ 
	      type: "POST", 
	      url: "/ksitecore/api/" + Keystone.template.path + "/create", 
	      data: data, 
	      dataType: "json", 
	      success: function (data) { 
	        l.stop();
	        if (data.state === 1)
	        {
	        		self.createSuccess = true;
	        		self.didAction = true;
	        		//parent.$("#item-modal-pre .modal-footer").prepend('<div class="alert alert-danger pull-left" role="alert">' + data.msg + '</div>');
	          	parent.$("#item-modal-pre").modal('hide');
	          	parent.$("#item-form-frame").attr("height", parent.$(window).height() - 180);
	          	parent.$("#item-form-frame").attr("src", "/keystone/" + data.path + "/" + data.item._id);
	         	
	        }
	        else
	        {
	        		self.createSuccess = false;
	        		parent.showMsgWithModal('#item-modal-pre', 'danger', data.msg);
	        		
	        }
	      }, 
	      error: function (message) {
	      	parent.showMsgWithModal('#item-modal-pre', 'danger', data.msg);
	      } 
	    });

	},
	saveItem(e)
	{
		var self = this;
		var data = parent.$("#item-form-frame")[0].contentWindow.Keystone.formData;
		var csrfKey = parent.$("#item-form-frame")[0].contentWindow.Keystone.csrf.key;
		var csrfValue = parent.$("#item-form-frame")[0].contentWindow.Keystone.csrf.value;
		var id = parent.$("#item-form-frame")[0].contentWindow.Keystone.item_id;
		var list = parent.$("#item-form-frame")[0].contentWindow.Keystone.list;
		var extendData = {action:"update", id:id};
		extendData[csrfKey] = csrfValue;
		_.extend(data, extendData);
		data = JSON.stringify(data) 
		var l = parent.Ladda.create(e.currentTarget);
		l.start();
	    $.ajax({
	    	  contentType: "application/json; charset=utf-8",
	      type: "POST", 
	      url: "/ksitecore/api/" + list.path + "/update", 
	      data: data, 
	      dataType: "json", 
	      success: function (data) { 
	        l.stop();
	        if (data.state === 1)
	        {
	        		self.didAction = true;
	        		var form_obj = parent.$("#item-form-frame")[0].contentWindow.Keystone.req_from;
	        		if (_.has(form_obj, "req_from_path") && _.has(form_obj, "req_from_id"))
	        		{
	        			parent.showMsgWithModal("#item-form-frame", 'success', data.msg + ' <a href="javascript:parent.$(\'#item-form-frame\')[0].contentWindow.history.back()" class="btn btn-link">Go Back</a>');
	        			parent.$("#item-form-frame")[0].contentWindow.scrollTo(0, 0);
	        		}
	        		else
	        		{
	        			parent.$("#item-modal").modal('hide');
	        		}
	        }
	        else{

	        		parent.showMsgWithModal('#item-form-frame', 'danger', data.msg);

	        }
	      }, 
	      error: function (message) { 
	      	parent.showMsgWithModal('#item-form-frame', 'danger', data.msg);

	      } 
	    });
		
		
	},
	deleteItem:function(e)
	{
		
		var csrfKey = parent.$("#item-form-frame")[0].contentWindow.Keystone.csrf.key;
		var csrfValue = parent.$("#item-form-frame")[0].contentWindow.Keystone.csrf.value;
		var id = parent.$("#item-form-frame")[0].contentWindow.Keystone.item_id;
		var list = parent.$("#item-form-frame")[0].contentWindow.Keystone.list;
		var csrfObj = {};
		csrfObj[csrfKey] = csrfValue;
		parent.deleteItem(e.currentTarget, list.path, id, csrfObj, function(result){
			if (result)
			{
				parent.$("#item-modal").modal('hide');
			}
			else{
				parent.showMsgWithModal("#item-form-frame", "danger", "提交数据失败！");
			}
		});
	},
	closeModalWithID:function(id){
		parent.$(id).modal('hide');
	},
	renderToolbar: function() {
		
		var toolbar = {};
		
		if (this.props.isMobileMode)
		{
			if (!this.props.list.noedit) {
				toolbar.save = <li className="list-group-item list-group-item-success ladda-button" data-style="expand-right" onClick={this.saveItem.bind(this)}>Save</li>;
				// TODO: Confirm: Use React & Modal
				toolbar.reset = <li className="list-group-item list-group-item-warning" onClick={this.refreshFormFrame.bind(this)}>reset changes</li>;
			}
			if (!this.props.list.noedit && !this.props.list.nodelete) {
				// TODO: Confirm: Use React & Modal
				toolbar.del = <li className="list-group-item list-group-item-danger ladda-button" data-style="expand-right" onClick={this.deleteItem.bind(this)}>delete {this.props.list.singular.toLowerCase()}</li>;
			}
	
			return (
				<ul className="list-group">
					{toolbar}
				</ul>
			);
		}
		else{
			if (!this.props.list.noedit) {
				toolbar.save = <button type="submit" className="btn btn-primary ladda-button" data-style="expand-right" onClick={this.saveItem.bind(this)}>Save</button>;
				// TODO: Confirm: Use React & Modal
				toolbar.reset = <a onClick={this.refreshFormFrame.bind(this)} className="btn btn-warning" data-confirm="Are you sure you want to reset your changes?">reset changes</a>;
			}
			if (!this.props.list.noedit && !this.props.list.nodelete) {
				// TODO: Confirm: Use React & Modal
				toolbar.del = <a className="btn btn-danger ladda-button" data-style="expand-right" onClick={this.deleteItem.bind(this)}>delete {this.props.list.singular.toLowerCase()}</a>;
			}
	
			return (
				<div>
					{toolbar}
				</div>
			);
		}
		
		
		
	},
	render: function() {
		
		var errors = null,
			form = {},
			list = this.props.list,
			formAction = '/ksitecore/categories/list/' + this.props.id + '?type=' + list.path,
			nameField = this.props.list.nameField,
			focusRef;
		
		var modalClass = 'modal fade';
		
		if (this.props.err && this.props.err.errors) {
			var msgs = {};
			_.each(this.props.err.errors, function(err, path) {
				msgs[path] = <li>{err.message}</li>;
			});
			errors = (
				<div className="alert alert-danger">
					<h4>There was an error creating the new {list.singular}:</h4>
					<ul>{msgs}</ul>
				</div>
			);
		}
		
		if (list.nameIsInitial) {
			var nameFieldProps = this.getFieldProps(nameField);
			nameFieldProps.ref = focusRef = 'focusTarget';
			if (nameField.type === 'text') {
				nameFieldProps.className = 'item-name-field';
				nameFieldProps.placeholder = nameField.label;
				nameFieldProps.label = false;
			}
			form[nameField.path] = React.createElement(Fields[nameField.type], nameFieldProps);
		}
		
		_.each(list.initialFields, function(path) {
				
			var field = list.fields[path];
			
			if ('function' !== typeof Fields[field.type]) {
				form[field.path] = React.createElement(InvalidFieldType, { type: field.type, path: field.path });
				return;
			}
			
			var fieldProps = this.getFieldProps(field);
			
			if (!focusRef) {
				fieldProps.ref = focusRef = 'focusTarget';
			}
			
			form[field.path] = React.createElement(Fields[field.type], fieldProps);
			
		}, this);
		
		return (
			<div>
				<div className={modalClass} id="item-modal-pre">
					<div className="modal-dialog modal-lg">
						<div className="modal-content">
							<div className="modal-header">
								<button type="button" className="modal-close" onClick={this.closeModalWithID.bind(this, '#item-modal-pre')}></button>
								<div className="modal-title">Create a new {list.singular}</div>
							</div>
							<div className="modal-body">
								{errors}
								{form}
							</div>
							<div className="modal-footer">
								<button type="submit" className="btn btn-primary ladda-button" data-style="expand-right" onClick={this.createItem.bind(this)}>Create</button>
								<button type="button" className="btn btn-default" onClick={this.closeModalWithID.bind(this, '#item-modal-pre')}>cancel</button>
							</div>
						</div>
					</div>
				</div>
				<div className={modalClass} id="item-modal">
					<div className="modal-dialog modal-lg">
						<div className="modal-content">
							<div className="modal-header">
								<button type="button" className="modal-close" onClick={this.closeModalWithID.bind(this, '#item-modal')}></button>
								<div className="modal-title">Modify Item</div>
							</div>
							<div className="modal-body">
								<iframe id="item-form-frame"  src=""  width="100%" frameborder="0"></iframe>
							</div>
							<div className="modal-footer">
								{this.renderToolbar()}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
	
});

module.exports = Form;
