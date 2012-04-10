/* This object is the higher level APT representation of groups, which
   contains  */
//PermGroup.prototype = APTObject.prototype;
//PermGroup.prototype.constructor = APTObject;
function PermGroup(workspace, existingObject) {
	this.workspace = workspace;

	this.id = "group."+this.workspace.permGroups.length;
	this.groupObjects = [];
	this.groupType = "file";


	if(typeof existingObject == "undefined") {
		log.action("system", "Creating new PermGroup");
		this.fabric = new fabric.PermGroup(this, {
	      // This is the default size & position
	      width: 100,
	      height: 100,
	      left: 1150,
	      top: 250,
	      // Give it a random color
	      fill: fabric.util.generateRGB(),
	      opacity: .5
	    });
	} else {
		log.action("Loading existing PermGroup");
	  	var group = fabric.PermGroup.fromObject(existingObject.fabric);

		this.fabric = group;
	}
    this.workspace.canvas.add(this.fabric);
    this.workspace.canvas.renderAll();
}

PermGroup.prototype.add = function( item ) {
	log.action("user", "Added item (id="+item.id+") to group (id="+this.id+")");
	this.groupObjects.push( item );
	item.permGroup = this;
	this.fabric.add( item.fabric );
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