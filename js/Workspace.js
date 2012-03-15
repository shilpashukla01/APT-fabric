/* Workspace object is the overall container object. Fabric canvas is kept inside it, 
so are all Items and functions for loading/saving */
function Workspace() {
  this.items = [];
  this.permGroups = [];
  this.loadedItems = 0;
  this.numItems = 0;
  this.initialized = false;
  this.id = 1;
  this.lastMouseDown = {};

  this.uiElements = [];

  var boundLoadSVGFromURLCallback = createBoundedWrapper(this, loadFromSVGFromURLCallback);

/* This function processes the workspace JSON returned from our request to the server.
  Run using a bounded wrapper. */
  this.processJSON = function(data) {

    // If the data is uninitialized, meaning there has been no interaction with
    // the workspace and no previously saved states, we need to calculate
    // layout and size of items.
    // *** CURRENTLY NOT USED ***
    if(data.initialized == false) {
      var totalArea = this.canvas.width*this.canvas.height;
      var fullItemArea = totalArea/data.items.length;
      var totalItemSideLength = fullItemArea/2;

      var itemsPerRow = Math.floor(this.canvas.width/totalItemSideLength);
      var rowsPerCanvas = Math.floor(this.canvas.height/totalItemSideLength);

      // Currently when laying out uninitialized workspaces we give each
      // item a square area allotment (with 5% taken out for padding). 
      // The var below is the length of that square.
      var actualItemSideLength = (fullItemArea-(fullItemArea*.05))/2;

    }

    for (i in data.items) {
      var item = new Item(this, data.items[i]);
      this.items.push(item);
    }
  }

  // If top & left are not included, item is just loaded, it does not display
  this.loadSVGFile = function(name, scale, width, height, top, left) {

    fabric.loadSVGFromURL('img/' + name + '.svg', function(svg) {
      boundLoadSVGFromURLCallback(svg, {
        name: name,
        width: width,
        scale: scale,
        height: height,
        top: top,
        left: left
      });
    });
  }

  // This loads and renders our UI
  this.loadUI = function() {
    this.loadUIElements();
    this.renderUI();
  }

  // This creates and renders the state feedback box in the lower right corner
  this.loadStateFeedback = function() {
    var offsetLeft = this.canvas.width - 85;
    var offsetTop = this.canvas.height - 40;

    this.stateDiv = document.createElement('div');
    this.stateDiv.appendChild(document.createElement('span'));
    this.stateDiv.setAttribute('id', 'state');
    this.stateDiv.setAttribute('style', 'left:' + offsetLeft + 'px;top:' + offsetTop + 'px;');
    $('#body').append(this.stateDiv);
    $(this.stateDiv).show();

  }

  // This function changes the state
  this.changeState = function(state) {
    this.state = state;

    switch (this.state) {
    case 'init':
      displayState = "Initializing...";
      break;
    case 'saved':
      displayState = "Saved";
      break;
    case 'saving':
      displayState = "Saving...";
      break;
    case 'modified':
      displayState = "Modified";
      break;
    case 'saveError':
      displayState = "Save error!";
      break;
    case 'ready':
      displayState = "Ready";
    }

    // Populate and display the box
    $("#state span").hide().html(displayState).show();
  }

  /* Load our interface elements from SVG files. */
  this.loadUIElements = function() {
    //this.loadSVGFile('folder', 1, 40, 40, 110, 1000);
    //this.loadSVGFile( 'rotate', .6, 20, 20 );
    this.loadSVGFile('plus', .7, 40, 40, 98, 1200);
    this.loadStateFeedback();
  }

  // Render all the UI elements in the workspace
  this.renderUI = function() {
    for (key in this.uiElements) {
      this.canvas.add(this.uiElements[key]);
    }

    this.canvas.renderAll();
  }

  this.renderDialog = function(event) {
    var dialogType = event.currentTarget.id;
    var itemId = event.data.id;


    // Close the menu that was used to call the dialog
    $(event.currentTarget).parent().slideUp().remove();

    switch(dialogType) {
      case 'edit':
        var title = this.items[itemId].title;
        var description = this.items[itemId].description;
        var clonedDialog = $(".dialog#edit").clone();
        $(clonedDialog).find("input#title").attr('value', title);
        $(clonedDialog).find("input#description").attr('value', description);
/*
        var submitButton = $(clonedDialog).find('button#submit');
        $(submitButton).click(function() )
*/
        // The context of the submit button is the dialog div. We use this wrapper
        // to make it the workspace.
        var boundSubmitMetadata = createBoundedWrapper(this, this.submitMetadata);

        $(clonedDialog).dialog({
          buttons: { 
            "Submit": function() { 
              boundSubmitMetadata(itemId, this);
              $(this).slideUp().remove();
            }
          },
          close: function(event, ui) {
            $(this).remove();
          }
        });
        break;
    }

    var dialogSelector = ".dialog#"+dialogType;
    var clonedDialog = $(dialogSelector).clone();
    console.log(clonedDialog);
  }

  this.submitMetadata = function(itemId, dialog) {
    var updated = false;
    var title = $(dialog).find("input#title").attr('value')
    var description = $(dialog).find("input#description").attr('value');

    if(title !== this.items[itemId].title) {
      this.items[itemId].title = title;
      updated = true;
    }

    if(description !== this.items[itemId].description) {
      this.items[itemId].description = description;
      updated = true;
    }

    // If there are changes to metadata, 
    // change the state to modified so they'll be saved
    if(updated === true) {
      this.changeState('modified');
      this.saveRemotely();
    }
  }

  // This function fires whenever an object is scaled in the workspace
  this.objectScalingEvent = function(e) {
    // The object that was scaled
    var target = e.memo.target;

    // If it's a perm group things are more complicated
    // Currently perm groups do not scale correctly.
    if(target.type == "perm-group") {
      var group = new fabric.Group(target.objects, {
        scaleable: true,
        hasBorders: false,
        hasCorners: false
      });

      this.canvas.setActiveGroup(group);
      var diff = target.scaleX/target.previousScaleX;

      group.scale(group.scaleX*diff);

      target.previousScaleX = target.scaleX;
      this.canvas.calcOffset();
//      this.canvas.renderAll();    
    }
  }

  // This function fires while an object is being moved
  this.objectMovingEvent = function(e) {
    // The object being moved
    var target = e.memo.target;

    // Mouse/touch position
    var pointer = fabric.util.getPointer(e),
        x = pointer.x,
        y = pointer.y;

    // if target is perm group, move all objects inside with it
    if (target.type == "perm-group") {
      target.moveChildren();
    }

    // If the target has been moved inside a perm group, change the
    // perm group's opacity as feedback
    var permGroup = this.canvas.isInsidePermGroup(target);
    if (permGroup) {
      permGroup.set({
        opacity: .9
      });

    } else {
      // The object is not in a perm group, so make sure 
      // no perm group is highlighted
      this.canvas.forEachObject(function(object) {
        if(object.type == "perm-group") {
          object.set({ opacity: .5 });
        }
      });
    }

   if(target.type == "perm-group") {
      target.set({ opacity: .5 });
    }

    this.canvas.calcOffset();
    this.canvas.renderAll();

/*
    if(target.isContainedWithinObject(this.canvas.item(0))) {
      this.canvas.item(0).set({opacity: .5});

    } else {
      this.canvas.item(0).set({opacity: 1});
    }
*/
  }

  // This event fires whenever an object is selected
  this.objectSelectedEvent = function(e) {
    var target = e.memo.target;

    // Bring selected object to the front of the canvas
    // unless it's a perm-group because we don't want the
    // group to get in front of its items.
    if(e.memo.target.type == "perm-group") {
    console.log("bring to front");
    //this.canvas.bringToFront(target);
    }
  }

  // Callback function used when loading an SVG file from a URL
  function loadFromSVGFromURLCallback(objects, options) {

    // SVGs are stored as fabric.PathGroup objects
    var group = new fabric.PathGroup(objects, {
      left: options.left,
      top: options.top,
      width: options.width * 1.1,
      height: options.height * 1.1,
    });
    group.id = options.name;
    group.hasBorders = false;
    group.hasControls = false;
    group.selectable = true;
    group.scale(options.scale);
    this.uiElements[options.name] = group;
    if (options.top && options.left) {
      this.canvas.add(group);
    }
  }

  // Add a new perm group to the workspace
  this.addPermGroup = function() {
    var group = new fabric.PermGroup(this, {
      // This is the default size & position
      width: 100,
      height: 100,
      left: 1150,
      top: 250,
      // Give it a random color
      fill: fabric.util.generateRGB(),
      opacity: .5
    });
    group.hasCorners = false;
    group.hasBorders = false;
    group.scaleable = true;
//    group.lockRotation = true;

    this.canvas.add(group);
  }

  // This function fires whenever an object is modified (moved/scaled/rotated/etc).
  // Triggers remote saving of workspace.
  this.objectModifiedEvent = function(e) {
    this.changeState('modified');
    this.saveRemotely();
  }

  this.mouseDownEvent = function(e) {
    var object = e.memo.target;
    console.log("mousedown");
 
    if(typeof object == "undefined") {
      this.canvas.discardActiveGroup();

    }
    if(object.type != "perm-group" || object.objects.length === 0) {
      this.canvas.bringToFront(object);
      console.log("mousedown bringto front");
    }

    var rightNow = new Date();

    if (typeof this.lastMouseDown.time != 'undefined' && typeof this.lastMouseDown.object != 'undefined') {
      if (parseInt(rightNow.getTime() - this.lastMouseDown.time.getTime()) <= 800) {
        // if we get here it's a double click.
        object.item.renderMenu(e);
      }
    }

    var permGroup = this.canvas.isInsidePermGroup(object);
    if (permGroup) {
      permGroup.set({
        opacity: .5
      });
    }

    this.lastMouseDown.time = rightNow;
    this.lastMouseDown.object = e.memo.target;
  }

  this.mouseUpEvent = function(e) {

    var target = e.memo.target;

    // If there's an object being clicked on
    if (typeof target !== "undefined") {
      if(target.id == "plus") {
        this.addPermGroup();
      }

      // Get the perm group the target is currently in
      var currentPermGroup = this.canvas.isInsidePermGroup(target);

      // If the object is in the perm group
      if (currentPermGroup) {

        // If the object is now in a different perm group than the one
        // it's currently linked to.
        if( typeof target.permGroup !== "undefined" && currentPermGroup.id !== target.permGroup.id ) {
          target.permGroup.remove(target);
          target.permGroup = currentPermGroup;

        }

        // If an object is over a perm group it hasn't been added to,
        // add it! And change the opacity back to neutral.
        if (!currentPermGroup.contains(target)) {
          currentPermGroup.add(target);
          currentPermGroup.set({ opacity: .5 });

          // Change the focus from the object back to the perm group
          this.canvas.setActiveObject(currentPermGroup);
        }
      }

      if (target.permGroup != null && !target.isContainedWithinObject(target.permGroup)) {
        console.log("remove from permgroup.");
        target.permGroup.remove(target);
        target.permGroup.set({ opacity: .5 });
      }

      this.canvas.renderAll();

      if (this.state == "modified") {
        this.saveRemotely();
      }
    }
  }

  this.saveSuccessCallback = function(data) {
    this.changeState('saved');
  }

}

/* Send current workspace state to server for saving. */
Workspace.prototype.saveRemotely = function() {
  this.changeState('saving');

  var boundSaveSuccessCallback = createBoundedWrapper(this, this.saveSuccessCallback);
  var tempWorkspace = {};

  tempWorkspace.id = this.id;
  tempWorkspace.initialized = this.initialized;
  tempWorkspace.title = "";
  tempWorkspace.items = [];
  for (var i = 0; i < this.numItems; i++) {
    tempWorkspace.items[i] = this.items[i].toJSON();
  }
  var jsonString = JSON.stringify(tempWorkspace);

  var jsonws = this.canvas.toJSON();

  // Error handling for this request is non-existent currently.
  $.post('http://everest.ischool.utexas.edu/~jeff/apt-refactored/json.php', {
    id: this.id,
    content: jsonString
  }, boundSaveSuccessCallback);


}

Workspace.prototype.init = function() {

  // Bounded wrappers for Workspace functions
  var boundZoom = createBoundedWrapper(this, this.zoom);
  var boundLoadUI = createBoundedWrapper(this, this.loadUI);
  var boundProcessJSON = createBoundedWrapper(this, this.processJSON);
  var boundMouseDownEvent = createBoundedWrapper(this, this.mouseDownEvent);
  var boundMouseUpEvent = createBoundedWrapper(this, this.mouseUpEvent);
  var boundObjectModifiedEvent = createBoundedWrapper(this, this.objectModifiedEvent);
  var boundObjectMovingEvent = createBoundedWrapper(this, this.objectMovingEvent);
  var boundObjectSelectedEvent = createBoundedWrapper(this, this.objectSelectedEvent);
  var boundObjectScalingEvent = createBoundedWrapper(this, this.objectScalingEvent);

  // This is our main canvas element. Create and append it.
  var canvasElem = document.createElement('canvas');
  canvasElem.setAttribute('id', 'c');
  canvasElem.setAttribute('width', window.innerWidth);
  canvasElem.setAttribute('height', window.innerHeight);
  canvasElem.setAttribute('style', "border:1px solid #ccc");
  document.getElementById('body').appendChild(canvasElem);

  // This is our FabricJS object for the canvas.
  this.canvas = new fabric.Canvas('c', {
    renderOnAddition: false
  });

  // These are fabric.js specific events. They cover the various transformations
  // that can be done to objects.
  this.canvas.observe('object:modified', boundObjectModifiedEvent);
  this.canvas.observe('object:moving', boundObjectMovingEvent);
  this.canvas.observe('object:selected', boundObjectSelectedEvent);
  this.canvas.observe('object:scaling', boundObjectScalingEvent);

  // fabric.js mouse events
  this.canvas.observe('mouse:up', boundMouseUpEvent);
  this.canvas.observe('mouse:down', boundMouseDownEvent);

  // Default zoom scale
  this.zoomScale = 1;

  this.loadUI();
  this.changeState('init');

  // Event listener for zoom.
  //document.addEventListener('DOMMouseScroll', boundZoom, false);

  var apiURL = "http://localhost/apt/json.php";

  $.getJSON("initial.json", {
    workspace: '1'
  }, boundProcessJSON);

}

// Function for zooming the entire workspace. Not working reliably.
// Currently disabled.
Workspace.prototype.zoom = function(event) {
  var group = new fabric.Group(this.canvas.getObjects());
  group.selectable = false;
  group.hasBorders = false;
  group.hasControls = false;

  var groupObjects = group.getObjects();
  for (i in groupObjects) {
    groupObjects[i].hasBorders = false;
  }

  if (event.detail > 0) {
    this.zoomScale = this.zoomScale - .05;
  } else if (event.detail < 0) {

    this.zoomScale = this.zoomScale + .05;
  }

  this.canvas.setActiveGroup(group);
  group.scale(this.zoomScale);

  this.canvas.renderAll();
  this.canvas.discardActiveGroup();

  var groupObjects = group.getObjects();
  for (i in groupObjects) {
    groupObjects[i].hasBorders = true;
  }

}
