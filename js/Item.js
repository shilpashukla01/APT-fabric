/* Our Item object. Represents individual documents. */
Item.prototype = APTObject.prototype;
Item.prototype.constructor = APTObject;
function Item(workspace, jsonObject, options) {
  this.imageURL = jsonObject.fabric.src;
  this.workspace = workspace;
  this.id = "item."+this.workspace.numItems++;
  this.permGroup = undefined;
  this.title = "a letter";
  this.description = "a letter...";

  log.action("system", "Load item (id="+this.id+")");

/* This is called once fabric creates a new Image object. 
  It's called using wrapper 'boundFabricImageCallback' to change scope. */
  function fabricItemCallback(item) {

    this.workspace.canvas.add(item);

    item.lockUniScaling = true;

    // This saves it to our object.
    this.fabric = item;
    this.fabric.aptObject = this;

    // If all the items are loaded, render the canvas and change state
    if (++this.workspace.loadedItems >= this.workspace.numItems) {
      log.action("system", "Finished loading items, render workspace");
      this.workspace.canvas.renderAll();
      this.workspace.changeState('ready');
    }

  }

  // Bound wrapper for private method fabricImageCallback
  var boundFabricItemCallback = createBoundedWrapper(this, fabricItemCallback);

  if(typeof options != "undefined") {
  jsonObject.fabric.top = options.top;
  jsonObject.fabric.left = options.left;
  var newScale = options.height/jsonObject.fabric.height;

  jsonObject.fabric.scaleX = newScale;
  jsonObject.fabric.scaleY = newScale;
  }

  // Create new fabric Image object for our item.
  fabric.Item.fromObject(jsonObject.fabric, boundFabricItemCallback)
}

Item.prototype.equals = function(x)
{
  var p;
  for(p in this) {
      if(typeof(x[p])=='undefined') {return false;}
  }

  for(p in this) {
      if (this[p]) {
          switch(typeof(this[p])) {
              case 'object':
                  if (!this[p].equals(x[p])) { return false; } break;
              case 'function':
                  if (typeof(x[p])=='undefined' ||
                      (p != 'equals' && this[p].toString() != x[p].toString()))
                      return false;
                  break;
              default:
                  if (this[p] != x[p]) { return false; }
          }
      } else {
          if (x[p])
              return false;
      }
  }

  for(p in x) {
      if(typeof(this[p])=='undefined') {return false;}
  }

  return true;
}

Item.prototype.getFabricObject = function() {
  return this.fabric;
}

Item.prototype.renderMenu = function(e) {
  log.action("system", "Render menu for item (id="+this.id+")");
  // Make sure any other menus are closed before opening a new one
  $(".vmenu").not("#original").slideUp('fast').remove();

  // Clone the menu HTML
  var vmenu = $("#original.vmenu.item").clone().attr('id', this.id);

  // The click function's parent is the menu div, so we need to change the scope to the workspace
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

Item.prototype.submitMetadata = function(itemId, dialog) {
  log.action("user", "Submit metadata for item (id="+this.id+")");

  var updated = false;
  var title = $(dialog).find("input#title").attr('value')
  var description = $(dialog).find("input#description").attr('value');

  if(title !== this.title) {
    this.title = title;
    updated = true;
  }

  if(description !== this.description) {
    this.description = description;
    updated = true;
  }

  // If there are changes to metadata, 
  // change the state to modified so they'll be saved
  if(updated === true) {
    this.workspace.changeState('modified');
    this.workspace.saveRemotely();
  }
}

Item.prototype.renderDialog = function(event) {
  log.action("system", "Render dialog for item (id="+this.id+")");
  var dialogType = event.currentTarget.id;
  var itemId = event.data.id;

  // Close the menu that was used to call the dialog
  $(event.currentTarget).parent().slideUp().remove();

  var dialogSelector = ".dialog.item#"+dialogType;

  switch(dialogType) {
    case 'edit':
      var clonedDialog = $(".dialog.item#"+dialogType).clone();
      $(clonedDialog).find("input#title").attr('value', this.title);
      $(clonedDialog).find("input#description").attr('value', this.description);

      // The context of the submit button is the dialog div. We use this wrapper
      // to make it the item.
      var boundSubmitMetadata = createBoundedWrapper(this, this.submitMetadata);

      $(clonedDialog).dialog({
        buttons: {
          "Submit": function() { 
            boundSubmitMetadata(itemId, this);
            $(this).slideUp().remove();
          }
        },
        close: function(event, ui) {
          log.action("user", "Close metadata dialog for item (id="+itemId+")");
          $(this).remove();
        }
      });
      break;
  }
}

/* Return a JSON object for sending to the server for saving.
   Set returnString to true if you want a JSON string instead of an object. */
Item.prototype.toJSON = function(returnString) {
  returnString = typeof returnString !== 'undefined' ? returnString : false;

  var jsonItem = {};
  jsonItem.id = this.id;
  jsonItem.title = this.title;
  jsonItem.description = this.description;
  jsonItem.imageURL = this.imageURL;
  jsonItem.fabric = this.fabric;

  if (returnString) {
    return JSON.stringify(jsonItem);
  } else {
    return jsonItem;
  }
}
