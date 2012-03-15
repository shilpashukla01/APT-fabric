/* Our Item object. Represents individual documents. */
function Item(workspace, jsonObject) {
//  this.imageURL = jsonObject.fabric.src;
  this.workspace = workspace;
  this.id = ++this.workspace.numItems;
  this.title = "a letter";
  this.description = "a letter...";

/* This is called once fabric creates a new Image object. 
  It's called using wrapper 'boundFabricImageCallback' to change scope. */
  function fabricImageCallback(image) {

    this.workspace.canvas.add(image);

    image.lockUniScaling = true;

    // This saves it to our object.
    this.fabric = image;
    this.fabric.item = this;

    // If all the items are loaded, render the canvas and change state
    if (++this.workspace.loadedItems >= this.workspace.numItems) {
      this.workspace.canvas.renderAll();
      this.workspace.changeState('ready');
    }

  }

  // Bound wrapper for private method fabricImageCallback
  var boundFabricImageCallback = createBoundedWrapper(this, fabricImageCallback);

  // Create new fabric Image object for our item.
  fabric.Image.fromObject(jsonObject.fabric, boundFabricImageCallback)
}

Item.prototype.renderMenu = function(e) {

  // Make sure any other menus are closed before opening a new one
  $(".vmenu").not("#original").slideUp('fast').remove();

  // Clone the menu HTML
  var vmenu = $("#original.vmenu").clone().attr('id', this.id);

  // The click function's parent is the menu div, so we need to change the scope to the workspace
  var workspaceBoundRenderDialog = createBoundedWrapper(this.workspace, this.workspace.renderDialog);

  // Click handlers for menu options
  $(vmenu).children().click({id: this.id}, workspaceBoundRenderDialog);

  // Display the menu
  $(vmenu).css({
    left: e.memo.e.pageX,
    top: e.memo.e.pageY,
    zIndex: '101'
  }).appendTo('#body').show();

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
