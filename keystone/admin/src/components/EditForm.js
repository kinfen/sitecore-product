var _ = require('underscore'),
	moment = require('moment'),
	React = require('react'),
	Fields = require('FieldTypes'),
	FormHeading = require('./FormHeading'),
	Toolbar = require('./Toolbar'),
	InvalidFieldType = require('./InvalidFieldType');

var EditForm = React.createClass({
	
	displayName: 'EditForm',
	
	getInitialState: function() {
		var obj = _.clone(this.props.data.fields);
		Keystone.formData = obj;
		return {
			values: obj
		};
	},
	getFieldProps: function(field) {
		var props = _.clone(field);
		props.value = this.state.values[field.path];
		props.values = this.state.values;
		props.onChange = this.handleChange;
		props.mode = 'edit';
		return props;
	},
	
	handleChange: function(event) {
		var values = this.state.values;
		values[event.path] = event.value;
		this.setState({
			values: values
		});
		Keystone.formData = values;
	},
	
	renderNameField: function() {
		
		var nameField = this.props.list.nameField,
			nameIsEditable = this.props.list.nameIsEditable;
		
		function wrapNameField(field) {
			return (
				<div className="field item-name">
					<div className="col-sm-12">
						{field}
					</div>
				</div>
			);
		}
		
		if (nameIsEditable) {
			
			var nameFieldProps = this.getFieldProps(nameField);
			nameFieldProps.className = 'item-name-field';
			nameFieldProps.placeholder = nameField.label;
			nameFieldProps.label = false;
			
			return wrapNameField(
				React.createElement(Fields[nameField.type], nameFieldProps)
			);
			
		} else {
			return wrapNameField(
				<h2 className="form-heading name-value">{this.props.data.name || '(no name)'}</h2>
			);
		}
	},
	
	renderTrackingMeta: function() {
		
		if (!this.props.list.tracking) return null;
		
		var elements = {},
			data = {},
			label;
		
		if (this.props.list.tracking.createdAt) {
			data.createdAt = this.props.data.fields[this.props.list.tracking.createdAt];
			if (data.createdAt) {
				elements.createdAt = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">Created</span>
						<span className="item-details-meta-info">{moment(data.createdAt).format('Do MMM YY h:mm:ssa')}</span>
					</div>
				);
			}
		}
		
		if (this.props.list.tracking.createdBy) {
			data.createdBy = this.props.data.fields[this.props.list.tracking.createdBy];
			if (data.createdBy) {
				label = data.createdAt ? 'by' : 'Created by';
				// todo: harden logic around user name
				elements.createdBy = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">{label}</span>
						<span className="item-details-meta-info">{data.createdBy.name.first} {data.createdBy.name.last}</span>
					</div>
				);
			}
		}
		
		if (this.props.list.tracking.updatedAt) {
			data.updatedAt = this.props.data.fields[this.props.list.tracking.updatedAt];
			if (data.updatedAt && (!data.createdAt || data.createdAt !== data.updatedAt)) {
				elements.updatedAt = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">Updated</span>
						<span className="item-details-meta-info">{moment(data.updatedAt).format('Do MMM YY h:mm:ssa')}</span>
					</div>
				);
			}
		}
		
		if (this.props.list.tracking.updatedBy) {
			data.updatedBy = this.props.data.fields[this.props.list.tracking.updatedBy];
			if (data.updatedBy && (!data.createdBy || data.createdBy.id !== data.updatedBy.id || elements.updatedAt)) {
				label = data.updatedAt ? 'by' : 'Created by';
				elements.updatedBy = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">{label}</span>
						<span className="item-details-meta-info">{data.updatedBy.name.first} {data.updatedBy.name.last}</span>
					</div>
				);
			}
		}
		
		return Object.keys(elements).length ? <div className="item-details-meta">{elements}</div> : null;
		
	},
	
	renderFormElements: function() {
		
		var elements = {},
			headings = 0;
		
		_.each(this.props.list.uiElements, function(el) {
			
			if (el.type === 'heading') {
				
				headings++;
				el.options.values = this.state.values;
				elements['h-' + headings] = React.createElement(FormHeading, el);
				
			} else if (el.type === 'field') {
				
				var field = this.props.list.fields[el.field],
					props = this.getFieldProps(field);


				if ('function' !== typeof Fields[field.type]) {
					elements[field.path] = React.createElement(InvalidFieldType, { type: field.type, path: field.path });
					return;
				}

				if (props.dependsOn) {
					props.currentDependencies = {};
					Object.keys(props.dependsOn).forEach(function (dep) {
						props.currentDependencies[dep] = this.state.values[dep];
					}, this);
				}

				elements[field.path] = React.createElement(Fields[field.type], props);
			}
			
		}, this);
		
		return elements;
		
	},
	render: function() {
		return (
			<div>
				{this.renderNameField()}
				{this.renderTrackingMeta()}
				{this.renderFormElements()}
			</div>
		);
	}
	
});

module.exports = EditForm;
