/* This object is the higher level APT representation of groups, which
   contains  */
//PermGroup.prototype = APTObject.prototype;
//PermGroup.prototype.constructor = APTObject;
function PermGroup(workspace, existingObject) {
	this.workspace = workspace;

	this.id = "group."+this.workspace.permGroups.length;
	this.groupObjects = [];
	this.groupType = "file";
	this.backgroundFill = "yellow";

	if(typeof existingObject == "undefined") {
		log.action("system", "Creating new PermGroup (id="+this.id+")");

		this.id = "group."+this.workspace.permGroups.length;

		this.fabric = new fabric.APTGroup(this, [], {
	      // This is the default size & position
	      width: 100,
	      height: 100,
	      left: 1150,
	      top: 250,
	      // Give it a random color
//	      fill: fabric.util.generateRGB(),
		  fill: 'yellow'
	    });

        this.workspace.canvas.add(this.fabric);
	} else {

		this.id = existingObject.id;
		var boundFromObjectCallback = createBoundedWrapper(this, this.fromObjectCallback);

	  	var group = fabric.APTGroup.fromObject(existingObject.fabric, boundFromObjectCallback );

		log.action("system", "Loading existing PermGroup (id="+this.id+")");
	}

    this.workspace.canvas.renderAll();
}

PermGroup.prototype.fromObjectCallback = function( permGroup ) {
	this.fabric = permGroup;
	for(var i in this.fabric.objects) {
		if(this.fabric.objects[i].type === "rect") {
			this.fabric.backgroundRect = this.fabric.objects[i];
		}
	}
  	//this.fabric.backgroundRect = new fabric.Rect({ width: this.fabric.get('width'), height: this.fabric.get('height'), fill: this.backgroundFill, opacity: .5 });
  	//this.fabric.add(this.fabric.backgroundRect);
	this.fabric.aptObject = this;
	this.workspace.canvas.add(this.fabric);
}

PermGroup.prototype.makeOpaque = function() {
	console.log("make opaque");
	this.fabric.backgroundRect.set({ opacity: .9 });
}

PermGroup.prototype.makeSemiTransparent = function() {
	this.fabric.backgroundRect.set({ opacity: .5 });
}

PermGroup.prototype.add = function( objArray ) {
	// need to get obj ids in an array
	// need to write snap to grid function
	if( typeof objArray === "object" ) {
		var tempObj = objArray;
		objArray = [];
		objArray.push(tempObj);
	}

	var ids = [];
	for( var i in objArray ) {
		ids.push(objArray[i].id);
		objArray[i].permGroup = this;
		this.groupObjects.push(objArray[i]);

		var newFabricObject = fabric.util.object.clone(objArray[i].fabric);

		this.workspace.canvas.remove(objArray[i].fabric);
		objArray[i].fabric = newFabricObject;

		newFabricObject.set({ top: undefined, left: undefined });
		newFabricObject.hasBorders = false;
		newFabricObject.hasControls = false;

		this.fabric.add(newFabricObject);
	}

	log.action("user", "Added item(s) (id="+ids.join(',')+") to group (id="+this.id+")");

	this.makeSemiTransparent();

	this.workspace.canvas.renderAll();

}

PermGroup.prototype.remove = function ( item ) {
	log.action("user", "Item (id="+item.id+") removed from group (id="+this.id+")");

	item.permGroup = undefined;

	this.fabric.remove(item.fabric);

	for(i in this.groupObjects) {
		if( item.id === this.groupObjects[i].id ) {
			this.groupObjects.splice(i, 1);
			break;
		}
	}
}

PermGroup.prototype.changeType = function( newType ) {
	this.groupType = newType;
}

PermGroup.prototype.contains = function ( object ) {
	if( this.groupObjects.indexOf( object ) > -1 ) {
		return true;
	} else {
		return false;
	}
}

PermGroup.prototype.renderMenu = function(e) {
  // Make sure any other menus are closed before opening a new one
  $(".vmenu").not("#original").slideUp('fast').remove();

  // Clone the menu HTML
  var vmenu = $("#original.vmenu.permgroup").clone();
  $(vmenu).attr('id', this.id);

  // The click function's parent is the menu div, so we need to change the scope to the permgroup
  var boundRenderDialog = createBoundedWrapper(this, this.renderDialog);

  // Click handlers for menu options
  $(vmenu).children().click({id: this.id}, boundRenderDialog);

  // Display the menu
  $(vmenu).css({
    left: e.memo.e.pageX,
    top: e.memo.e.pageY,
    zIndex: '101'
  }).appendTo('#body').show();
}

PermGroup.prototype.submitMetadata = function(groupId, dialog) {
  var updated = false;
  var title = $(dialog).find("input#title").attr('value')
  var description = $(dialog).find("input#description").attr('value');
  var groupType = $(dialog).find("select").val();

  if(title !== this.title) {
    this.title = title;
    updated = true;
  }

  if(description !== this.description) {
    this.description = description;
    updated = true;
  }

  if(groupType !== this.groupType) {
  	this.groupType = groupType;
  	updated = true;
  }

  // If there are changes to metadata, 
  // change the state to modified so they'll be saved
  if(updated === true) {
    this.workspace.changeState('modified');
    this.workspace.saveRemotely();
  }
}

PermGroup.prototype.renderDialog = function(event) {
  var dialogType = event.currentTarget.id;
  var groupId = event.data.id;

  // Close the menu that was used to call the dialog
  $(event.currentTarget).parent().slideUp().remove();

  var dialogSelector = ".dialog.group#"+dialogType;
  var clonedDialog = $(".dialog.group#"+dialogType).clone();

  switch(dialogType) {
  	case 'edit':
	  $(clonedDialog).find("input#title").attr('value', this.title);
  	  $(clonedDialog).find("input#description").attr('value', this.description);

	  var groupTypeSelect = $(clonedDialog).find("select").val(this.groupType);

	  // The context of the submit button is the dialog div. We use this wrapper
	  // to make it the group.
	  var boundSubmitMetadata = createBoundedWrapper(this, this.submitMetadata);

	  $(clonedDialog).dialog({
	    buttons: { 
	      "Submit": function() { 
	        boundSubmitMetadata(groupId, this);
	        $(this).slideUp().remove();
	      }
		},
		close: function(event, ui) {
      	  $(this).remove();
	    }
	  });
	  break;
	case 'ungroup':
	  var boundUngroup = createBoundedWrapper(this, this.ungroup);

	  $(clonedDialog).dialog({
	  	buttons: {
	  		"Yes": function() {
	  			boundUngroup();
	  			$(this).slideUp().remove();
	  		},
	  		"No": function() {
	  			$(this).slideUp().remove();
	  		}
	  	},
	  	close: function(event, ui) {
	  		$(this).remove();
	  	}
	  });
	  break;
	default:
		return false;
  }
}

PermGroup.prototype.getFabricObject = function() {
	return this.fabric;
}

PermGroup.prototype.ungroup = function() {
	this.workspace.canvas.remove(this.fabric);
}

PermGroup.prototype.toJSON = function(returnString) {
  returnString = typeof returnString !== 'undefined' ? returnString : false;

  var jsonItem = {};
  jsonItem.id = this.id;
  jsonItem.title = this.title;
  jsonItem.description = this.description;
  //jsonItem.imageURL = this.imageURL;
  jsonItem.groupObjects = this.groupObjects;
  jsonItem.fabric = this.fabric;

  if (returnString) {
    return JSON.stringify(jsonItem);
  } else {
    return jsonItem;
  }
}