
var data = Keystone.items;
data = _.map(data, function(obj){
	return _.mapObject(obj, function(value,key){
			if (typeof(value) == "object" && value.name)
			{
				return value.name;
			}
			else if (key == "publishedDate")
			{
				return moment(value).format('YYYY-MM-DD');
			}
			return value;
		})
});
$('#table').bootstrapTable({
	columns: columns,
	classes : "table table-hover table-no-bordered",
	striped : true,
	clickToSelect : true,
	minimumCountColumns: 1,
	showColumns: true,
	toolbar : "#tool-bar",
	data: data
}).on('click-row.bs.table', function (e, row, $element) {
		//- console.log(this);
		//- console.log($(this).bootstrapTable("getSelections"));
		//- console.log(e);
		//- console.log(row);
		//- console.log($element);
});
$("#table").on("pre-body.bs.table check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table", function(row){
	console.log("hoho");
	var selections = $("#table").bootstrapTable("getSelections");
	if (selections.length == 1){
		$('#tool-bar li.edit').removeClass("disabled");
		$('#tool-bar li.edit a').css("pointer-events", "");
		
	}
	else{
		$('#tool-bar li.edit').addClass("disabled");
		$('#tool-bar li.edit a').css("pointer-events", "none");

	}
})
$('#tool-bar li.edit').on("click", editItemHandler);
$('#tool-bar li.delete').on("click", removeItemHandler);

function editItemHandler(e)
{
	var selections = $("#table").bootstrapTable("getSelections");
	if (selections.length == 1){
		//- $('.action-sheet').dropdown('toggle');
		var obj = selections[0];
		parent.viewItem(Keystone.template.path, obj._id);
	}
}
function removeItemHandler(e)
{
	var selections = $("#table").bootstrapTable("getSelections");
	var ids = _.pluck(selections, "_id");
	var csrfObj = {};
	csrfObj[Keystone.csrf.key] = Keystone.csrf.value;
	
	parent.deleteItem(null, Keystone.template.path, ids, csrfObj, function(result){
		if (result)
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
		else{
			$("div#msg").append('<div class="alert alert-danger">删除数据失败</div>');
		}
	});
}
