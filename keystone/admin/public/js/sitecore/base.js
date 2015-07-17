// 对Date的扩展，将 Date 转化为指定格式的String   
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
// 例子：   
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18  
function resizeLayout()
{
	if (isMobileMode())
	{
		$('#site-content .static-content').width($(window).width());
		$('#menu-content #tree-view0').width($(window).width() * .8);
		$('#menu-content #tree-view0').height(Math.max($(window).height(), $($("#content-frame")[0].contentWindow).height()));
	}
}


function isMobileMode(){
	return $(window).width() < 768;
}

var leftMenuFold = true;
function toggleLeftMenu()
{
	if (leftMenuFold)
	{
		$("#menu-content").transit({width:"80%"});
		$("#site-content").transit({width:"20%"});
	}
	else{
		$("#menu-content").transit({width:"0"});
		$("#site-content").transit({width:"100%"});
	}
	
	leftMenuFold = !leftMenuFold;
	
	
}

function viewItem(path, id)
{
	console.log('hihi');
	$("#item-form-frame").attr("height", $(window).height() - 180);
	$("#item-form-frame").attr("src", "/keystone/" + path + "/" + id);
	$('#item-modal').modal();
}
function showMsgWithModal(sector, state, msg)
{
	$($(sector)[0].contentDocument.body.querySelector("#item-view")).prepend('<div class="alert alert-' + state + '" role="alert">' + msg + '</div>');
}
function deleteItem(btnRef, path, id, csrfObj, callback)
{
	//delete function can appear anywhere, so I pick it out from createform.js
	var l;
	if (!confirm('do you want to remove items you selected?'))
	{
		return;
	}
	if (btnRef)
	{
		l = Ladda.create(btnRef);
		l.start();
	}
	else{
		$("#content-frame")[0].contentWindow.showLoading();
	}
	
	var extendData = {action:"delete", id:id};
	_.extend(extendData, csrfObj);
	extendData = JSON.stringify(extendData) 
	
    $.ajax({ 
    		contentType: "application/json; charset=utf-8",
		type: "POST", 
		url: "/ksitecore/api/" + path + "/delete/", 
		data: extendData, 
		dataType: "json", 
		success: function (data) { 
			if (btnRef)
			{
				l.stop();
			}
			else{
				$("#content-frame")[0].contentWindow.hideLoading();
			}
			if (data.state === 1)
			{
				react.didAction = true;
			}
			callback(data.state === 1)
		}, 
		error: function (message) { 
			callback(false)
			if (btnRef)
			{
				l.stop();
			}
			else{
				$("#content-frame")[0].contentWindow.hideLoading();
			}
		} 
    });
}







