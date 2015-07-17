$("#body").css("visibility", "visible");
$("#loading .modal").modal('hide');
parent.$("iframe#content-frame").height(document.body.scrollHeight);
parent.resizeLayout();

function showLoading()
{
	$("#loading .modal").modal();
}
function hideLoading(){
	$("#loading .modal").modal('hide');
}


