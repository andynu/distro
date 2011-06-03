/**
 * Support for EditRowPlugin
 * 
 * Copyright (c) 2009-2011 Foswiki Contributors
 * Copyright (C) 2007 WindRiver Inc. and TWiki Contributors.
 * All Rights Reserved. Foswiki Contributors are listed in the
 * AUTHORS file in the root of this distribution.
 * NOTE: Please extend that file, not this notice.
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version. For
 * more details read LICENSE in the root of this distribution.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * 
 * Do not remove this copyright notice.
 */
(function($) {
    // Date editable
    $.editable.addInputType('datepicker', {
	element : function(settings, original) {
	    var input = $('<input>');
	    if (settings.width  != 'none')
		input.width(settings.width);
	    if (settings.height != 'none')
		input.height(settings.height);
	    input.attr('autocomplete', 'off');
	    $(this).append(input);
	    return(input);
	},
	plugin : function(settings, original) {
	    /* Workaround for missing parentNode in IE */
	    var form = this;
	    settings.onblur = 'ignore';
	    $(this).find('input').datepicker({
		firstDay: 1,
		dateFormat: $.datepicker.W3C,
		closeText: 'X',
		onSelect: function(dateText) {
		    $(this).hide();
		    $(form).trigger("submit");
		},
		onClose: function(dateText) {
		    original.reset.apply(original, [ form ]);
		    $(original).addClass(settings.cssdecoration);
		}
	    });
	}});

    // Radio button editable
    $.editable.addInputType('radio', {
        element : function(settings, original) {
	    // 'this' is the form
	    var hinput = $('<input type="hidden" id="' + settings.name
			   + '" name="' + settings.name + '" value="" />');
	    // *Must* be first
	    $(this).append(hinput);
	    var key, input, checked, id, cnt = 1;
	    for (key in settings.data) {
		id = settings.name + "_button" + cnt;
		$(this).append('<label for="' + id + '">' +
			       settings.data[key] + '</label>');
		checked = (key === settings.text) ? ' checked="checked"' : "";
		input = $('<input type="radio" name="' + settings.name +
			  '_buttons" id="' + id + '"' + checked + ' value="'
			  + key + '" />');
		$(this).append(input);
		input.click(function() {
		    $('#' + settings.name).val($(this).val());
		});
		cnt++;
	    }
            return hinput;
        }
    });

    // The default JEditable select does not retain the sorting of the selection options,
    // so we need a sorted version. Assumes three keys in the json data: 'order', 'keys'
    // and 'selected'. 'order' is an array containing the sort order of the keys; 'keys'
    // contains the key mapped to the string title of the key; and 'selected' contains
    // the string value of the currently selected key.
    $.editable.addInputType('erpselect', {
        element : function(settings, original) {
            var select = $('<select />');
            $(this).append(select);
            return(select);
        },
        content: function(data, settings, original) {
            /* If it is string assume it is json. */
            if (String == data.constructor) {      
                eval ('var json = ' + data);
            } else {
                /* Otherwise assume it is a hash already. */
                var json = data;
            }

	    for (var i in json.order) {
		var key = json.order[i];
                if (json.keys[key] == null)
		    continue;
                var option = $('<option />').val(key).append(json.keys[key]);
                $('select', this).append(option);    
	    }
	    /* Loop option again to set selected. IE needed this... */ 
	    $('select', this).children().each(function() {
                if ($(this).val() == json.selected || 
		    $(this).text() == $.trim(original.revert)) {
		    $(this).attr('selected', 'selected');
                }
	    });
        }
    });

    // Checkbox editable
    $.editable.addInputType('checkbox', {
        element : function(settings, original) {
	    // 'this' is the form
	    // data is CSV list
	    var hinput = $('<input type="hidden" id="' + settings.name
			   + '" name="' + settings.name + '" value="" />');
	    // *Must* be first
	    $(this).append(hinput);
	    var key, input, checked, id, cnt = 1;
	    var picked = new RegExp(
		"\\b(" + settings.text.replace(/\s*,\s*/, "|") + ")\\b");
	    for (key in settings.data) {
		id = settings.name + "_button" + cnt;
		checked = picked.test(key) ? ' checked="checked"' : '';
		input = $('<input type="checkbox" name="' + settings.name +
			  '_buttons" id="' + id + '"' + checked + ' value="'
			  + key + '" />');
		$(this).append(input);
		$(this).append('<label for="' + id + '">' +
			       settings.data[key] + '</label>');
		input.change(function() {
		    // The :checked selector doesn't work :-(
		    var vs = 'input[name="' + settings.name + '_buttons"]';
		    var vals = [];
		    $(vs).each(function(i, e) {
			if ($(e).attr("checked"))
			    vals.push($(e).val());
		    });
		    $('#' + settings.name).val(vals.join(','));
		});
		cnt++;
	    }
            return hinput;
	}
    });

    var my_metadata = function(el) {
	var c = el.attr("class"), m;
	if (m = /({.*})/.exec(el.attr("class"))) {
	    return eval('(' + m[1] + ')');
	}
	return null;
    };

    var makeRowDraggable = function(tr) {
	var dragee, container, rows;

	var onDrop = function( event, ui ) {
	    var target = $(this);
	    var edge;
	    // A drop outside the table
	    // is triggered on the drag helper instead of the
	    // droppable at the end of the table.
	    if (target.hasClass("drag-helper")) {
		var top = rows.first().offset().top;
		var posY = event.pageY - top;
		edge = (posY < (rows.last().offset().top() +
				rows.last().height() - top) / 2)
		    ? 'top' :'bottom';
		if (edge == 'top')
		    target = rows.first();
		else
		    target = rows.last();
	    } else {
		var posY = event.pageY - target.offset().top;
		edge = (posY < target.height() / 2)
		    ? 'top' :'bottom';
	    }
	    var old_pos = my_metadata(dragee).erp_data.erp_active_row;
	    var new_pos = my_metadata(target).erp_data.erp_active_row;
	    if (edge == 'bottom')
		new_pos++;
	    
	    if (new_pos == old_pos)
		return;

	    // Send the good news to the server
	    dragee.fadeTo("slow", 0.0); // to show it's being moved
	    container.css("cursor", "wait");
	    var p = my_metadata($(this));
	    p.erp_data.erp_action = 'moveRow';
	    p.erp_data.old_pos = old_pos;
	    p.erp_data.new_pos = new_pos;
	    if (edge == 'top')
		dragee.insertBefore(target);
	    else
		dragee.insertAfter(target);
	    // The request will update the entire container. Make sure
	    // it has the right id.
	    $.ajax({
		url: p.url,
		type: "POST",
		data: p.erp_data,
		success: function(response) {
		    if (response.indexOf("RESPONSE") != 0) {
			// We got something other than a REST response -
			// probably an auth prompt. Need to edit the
			// login form and clear noredirect so that the
			// save knows to complete in an unRESTful way.
			// Note that this should really prompt in a
			// pop-up dialog.
			container.replaceWith($(response).find(
			    "form[name='loginform']"));
			$("form[name='loginform'] input[name='noredirect']")
			    .remove();
		    } else {
			response = response.replace(/^RESPONSE/, '');
			container.replaceWith(response);
		    }
		},
		error: function() {
		    dragee.fadeTo("fast", 1.0);
		    container.css("cursor", "auto");
		}
	    });
	};

	// Add a "drag handle" element to the first cell
	var handle = $("<a href='#' class='erp_drag_button ui-icon ui-icon-arrowthick-2-n-s' title='Click and drag to move row'>move</a>");
	tr.find("td").first().find("div.editRowPluginContainer").append(handle);
	tr.addClass("ui-draggable");
	handle.draggable({
	    // constrain to the container
	    containment: tr.closest("tbody,thead,table"),
	    axis: 'y',
	    appendTo: 'body',
	    helper: function(event) {
		var tr = $(event.target).closest('tr');
		var helper = tr.clone();
		var dv = $('<div><table></table></div>')
		    .find('table')
		    .append(helper.addClass("drag-helper"))
		    .end();
		dv.css("margin-left", tr.offset().left + "px");
		return dv;
	    },
	    start: function(event, ui) {
		dragee = tr;
		dragee.fadeTo("fast", 0.3); // to show it's moving
		container = dragee.closest("table");
		rows = container.find(".editRowPluginRow");
		rows.not(dragee).not('.drag-helper').droppable({
		    drop: onDrop
		});
	    },
	    stop: function() {
		dragee.fadeTo("fast", 1.0);
	    }
	});
    };

    $(document).ready(function() {
	var erp_rowDirty = false;
	var erp_dirtyVeto = false;

	$('.editRowPluginInput').livequery("change", function() {
	    erp_rowDirty = true;
	});

	$('.erp_edit_button').livequery("click", function() {
	    // Send the event to the span
	    $(this).prev().triggerHandler("erp_edit");
	});

	// Action on select row and + row. Check if the current row is
	// dirty, and if it is, prompt for save
	$('.editRowPlugin_willDiscard').livequery(function() {
	    $(this).click(function(event) {
		if (erp_rowDirty) {
		    if (!confirm("This action will discard your changes.")) {
			erp_dirtyVeto = true;
			return false;
		    }
		}
		return true;
	    });
	});

	$('.erp_submit').livequery(function() {
	    if (!$.browser.msie || parseInt($.browser.version) >= 8)
		// No button support in IE 7 and below
		$(this).button();
	    $(this).click(function() {
		var cont = true;
		if (erp_dirtyVeto) {
		    erp_dirtyVeto = false;
		    cont = false;
		} else {
		    var form = $(this).closest("form");
		    if (form && form.length > 0) {
			form[0].erp_action.value = $(this).attr('href');
			form.submit();
			cont = false;
		    }
		}
		return cont;
	    });
	});

	$('.editRowPluginSort').livequery("click", function() {
	    var m = /{(.*)}/.exec($(this).attr("class"));
	    var md = {};
	    if (m)
		md = eval('({' + m[1] + '})');
	    return sortTable(this, false, md.headrows, md.footrows);
	});

	$(".editRowPluginCell").livequery(function() {
	    // WARNING: this was a complete PITA to get right! Meddle
	    // at your own peril!

	    // Make the containing row draggable
	    var tr = $(this).closest("tr");
	    if (!tr.hasClass('ui-draggable'))
		makeRowDraggable(tr);

	    var p = my_metadata($(this));

	    if (!p.type || p.type == 'label')
		return;

	    // We can't row-number when generating the table because it's
	    // done by the core table rendering. So we have to promote
	    // the cell information up to the row when we have it.
	    if (!tr.hasClass('editRowPluginRow') && p.erp_data
		&& p.erp_data.erp_active_row) {
		var m = /({.*})/.exec($(this).attr("class"));
		var metadata = m[1];
		tr.addClass("editRowPluginRow " + metadata);
	    }

	    // use a function to get the submit data from the class
	    // attribute, because
	    // the row index may change if rows are moved/added/deleted
	    p.submitdata = function(value, settings) {
		var sd = my_metadata($(this)).erp_data;
		sd.erp_action = 'saveCell';
		return sd;
	    }

	    p.onedit = function(settings, self) {
		// Hide the edit button
 		$(self).next().hide();
	    };

	    p.onblur = 'cancel';

	    // submit and reset must restore the edit button
	    p.onreset = function(settings, self) {
		$(self).next().show();
		return true;
	    };

	    p.onsubmit = function(settings, self) {
		// For some reason we get a double-submit, that we have to defend
		if (self.isSubmitting)
		    return false;
		self.isSubmitting = true;
		// Add a clock to feedback on the save
		$("<div class='erp_clock_button'></div>").insertAfter($(self).next());
		return true;
	    };

	    p.onerror = function(settings, self, xhr) {
		self.isSubmitting = false;
		$(self).parent().find('.erp_clock_button').remove();
		$(self).next().show();
	    };

	    p.callback = function(value, settings) {
		if (value.indexOf("RESPONSE") != 0) {
		    // We got something other than a REST response -
		    // probably an auth prompt. Need to edit the
		    // login form and clear noredirect so that the
		    // save knows to complete in an unRESTful way.
		    // Note that this should really prompt in a pop-up dialog.
                    $(this).replaceWith($(value).find(
			"form[name='loginform']"));
		    $("form[name='loginform'] input[name='noredirect']")
			.remove();
		} else {
		    value = value.replace(/^RESPONSE/, '');
                    $(this).html(value);
		    if (p.type == "text" || p.type == "textarea")
			// Add changed text (unexpanded) to settings
			settings.data = value;
		    this.isSubmitting = false;
		    $(this).parent().find('.erp_clock_button').remove();
		    $(this).next().show();
		}
	    };

	    $(this).editable(p.url, p);
 	});
    });
})(jQuery);
