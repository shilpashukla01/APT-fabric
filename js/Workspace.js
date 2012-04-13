/* Workspace object is the overall container object. Fabric canvas is kept inside it, 
so are all Items and functions for loading/saving */
function Workspace( config ) {
  this.config = config;
  this.currentTouches = [];
  this.items = [];
  this.permGroups = [];
  this.loadedItems = 0;
  this.numItems = 0;
  this.initialized = false;
  this.id = 1;
  this.lastMouseDown = {};
  this.loadCurrent = true;

  this.uiElements = [];

  var boundLoadSVGFromURLCallback = createBoundedWrapper(this, loadFromSVGFromURLCallback);

/* This function processes the workspace JSON returned from our request to the server.
  Run using a bounded wrapper. */
  this.processJSON = function(data) {
    log.action("system", "Processing JSON retrieved from server.");

    // If the data is uninitialized, meaning there has been no interaction with
    // the workspace and no previously saved states, we need to calculate
    // layout and size of items.
    if(data.initialized === false && this.loadCurrent === false) {
      var offsetTop = 80;
      var offsetLeft = 80;
      var itemHeight = (this.canvas.height*.90)/(.15*(data.items.length+7));

      for(i in data.items) {

        // add width/height/top/left to item constructor
        var item = new Item(this, data.items[i], {
          top: offsetTop,
          left: offsetLeft,
          height: itemHeight
        });
        this.items.push(item);

        offsetTop = offsetTop+(itemHeight*.15);
        offsetLeft = offsetLeft+(itemHeight*.15);
      }

    } else {

      for (i in data.items) {
        var item = new Item(this, data.items[i]);
        this.items.push(item);
      }

      for( i in data.permGroups) {
        var permgroup = new PermGroup(this, data.permGroups[i]);
        this.permGroups.push(permgroup);
      }
    }
  }

  // If top & left are not included, item is just loaded, it does not display
  this.loadSVGFile = function(name, scale, width, height, top, left, selectable) {

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
    log.action("system", "Change state to: "+state);
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
      this.saveRemotely();
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
    this.loadSVGFile('plus', 1.2, 40, 40, 98, 1200);
    this.loadStateFeedback();
  }

  // Render all the UI elements in the workspace
  this.renderUI = function() {
    log.action("system", "Rendering UI elements");
    for (key in this.uiElements) {
      this.canvas.add(this.uiElements[key]);
    }

    this.canvas.renderAll();
  }

  this.renderDialog = function(event) {
    log.action("system", "Rendering dialog");
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
  }

  // This function fires whenever an object is scaled in the workspace
  this.objectScalingEvent = function(e) {

    // The object that was scaled
    var target = e.memo.target;

    var aptObjects = [];
    var ids = [];

    if( typeof target === "undefined" ) {
      aptObjects = undefined;
    } else if( typeof target.aptObject !== "undefined" ) {
      aptObjects.push( target.aptObject );
      ids.push(target.aptObject.id);
    } else if(target.type === "group") {

      // if its a group, there could be more than one apt objects selected
      for(i in target.objects) {
        if(typeof target.objects[i].aptObject === "undefined" ) {
          log.error("system", "Object in fabric group does not have aptObject pointer");
        } else {
          aptObjects.push( target.objects[i].aptObject );
          ids.push(target.objects[i].aptObject.id);
        }
      }
    }

    log.action("fabric", "Object scaling event (id="+ids.join(',')+")");

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

    }
  }

  // This function fires while an object is being moved
  this.objectMovingEvent = function(e) {
    // The object being moved
    var target = e.memo.target;
    console.log(target);
    var aptObjects = [];
    var ids = [];

    if( typeof target === "undefined" ) {
      aptObjects = undefined;
    } else if( typeof target.aptObject !== "undefined" ) {
      aptObjects.push( target.aptObject );
      ids.push(target.aptObject.id);
    } else if( target.type === "apt-group" ) {
      // handle apt-group case
      aptObjects.push(target);
    
    // This handles selection groups
    } else if( target.type === "group") {
      // if its a group, there could be more than one apt objects selected
      for(i in target.objects) {
        // If the target isn't our background rect and doesn't have a corresponding APT object
        if(target.objects[i].type !== "rect") {
          if( typeof target.objects[i].aptObject === "undefined" ) {
            log.error("system", "Object in fabric group does not have aptObject pointer");
          } else {
            aptObjects.push( target.objects[i].aptObject );
            ids.push(target.objects[i].aptObject.id);
          }
        }
      }
    }

    log.action("fabric", "Object moving event (id="+ids.join(',')+")");

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
    var permGroup = this.isInsidePermGroup(aptObjects);
    if (permGroup) {
      console.log(permGroup);
      permGroup.makeOpaque();

    } else {
      // The object is not in a perm group, so make sure 
      // no perm group is highlighted
      this.canvas.forEachObject(function(object) {
        if(object.type == "perm-group") {
          object.makeSemiTransparent();
        }
      });
    }

   if(target.type == "perm-group") {
      target.set({ opacity: .5 });
    }

    this.canvas.calcOffset();
    this.canvas.renderAll();

  }

  // This event fires whenever an object is selected
  this.objectSelectedEvent = function(e) {
    log.action("fabric", "Object selected event");

    var target = e.memo.target;

    // Bring selected object to the front of the canvas
    // unless it's a perm-group because we don't want the
    // group to get in front of its items.
    if(e.memo.target.type == "perm-group") {
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
    log.action("user", "Add new PermGroup");

    var group = new PermGroup(this);
    this.permGroups.push(group);

  }

  // This function fires whenever an object is modified (moved/scaled/rotated/etc).
  // Triggers remote saving of workspace.
  this.objectModifiedEvent = function(e) {
    log.action("system", "Object modified event");

    this.changeState('modified');
    //this.saveRemotely();
  }

  this.mouseDownEvent = function(e) {
    this.renderClickFeedback(e.memo.e.clientX, e.memo.e.clientY);
    log.action("user", "Mousedown event");
    var targets = [];
    var aptObjects = [];
    var eventTarget = e.memo.target;
    if(typeof eventTarget === "undefined") {
      this.canvas.discardActiveGroup();
    // Here we control for both the background rectangle in perm groups and the plus SVG pathgroup icon used to add permgroups
    // If we add any more exceptions we probably need a better method for filtering them out of this.
    } else if( typeof eventTarget.objects === "undefined" && eventTarget.type !== "rect" && eventTarget.type !== "plus" ) {
      targets.push(eventTarget);
      aptObjects.push(eventTarget.aptObject);
      this.canvas.bringToFront(eventTarget);
    } else {
      var objects = eventTarget.objects;
      for(var i in objects) {
        if(objects[i].type !== "rect") {
          targets.push(objects[i]);
          aptObjects.push(objects[i].aptObject);
        }
      }
    }

    this.canvas.renderAll();


/*
    if( eventTarget.type != "perm-group" || target.objects.length === 0) {
      this.canvas.bringToFront(eventTarget);
    }
*/
    var rightNow = new Date();

    if (typeof this.lastMouseDown.time != 'undefined' && typeof this.lastMouseDown.object != 'undefined') {
      if (parseInt(rightNow.getTime() - this.lastMouseDown.time.getTime()) <= 500) {
        log.action("user", "Double click");

        if(eventTarget.type != "perm-group") {
          // if we get here it's a double click.
          eventTarget.item.renderMenu(e);
        } else {
          eventTarget.group.renderMenu(e);
        }
      }
    }

    var permGroup = this.isInsidePermGroup(aptObjects);
    if (permGroup) {
      permGroup.fabric.set({
        opacity: .5
      });
    }

    this.lastMouseDown.time = rightNow;
    this.lastMouseDown.object = eventTarget;
    
  }

  this.mouseUpEvent = function(e) {
    log.action("user", "Mouse up event");
 
    var targets = [];
    var aptObjects = [];
    var eventTarget = e.memo.target;

    if( typeof eventTarget === "undefined" ) {
      return false;
    }

    if( eventTarget.id == "plus" ) {
      this.addPermGroup();
    }

    // If it is a single object...
    if( typeof eventTarget.type !== "rect" && typeof eventTarget.objects === "undefined" && typeof eventTarget.aptObject !== "undefined") {
      targets.push(eventTarget);
      aptObjects.push(eventTarget.aptObject);
      this.canvas.bringToFront(eventTarget);

    // If it's multiple objects (a selection group)
    } else {
      var objects = eventTarget.objects;
      for(var i in objects) {
        if(objects[i].type !== "rect") {
          targets.push(objects[i]);
          aptObjects.push(objects[i].aptObject);
        }
      }
    }

    // Get the perm group the target is currently in
    var currentPermGroup = this.isInsidePermGroup(aptObjects);

    // Any of the objects are in a perm group
    if (currentPermGroup) {
      // If the object is now in a different perm group than the one
      // it's currently linked to.
      for( var i in aptObjects ) {
        if( typeof aptObjects[i].permGroup !== "undefined" && currentPermGroup.id !== aptObjects[i].permGroup.id ) {
          aptObjects[i].permGroup.remove(aptObject[i]);
          aptObjects[i].permGroup = currentPermGroup;
        }

        // If objects are over a perm group it hasn't been added to,
        // add it! And change the opacity back to neutral.
        if (!currentPermGroup.contains(aptObjects[i])) {
          var currentFabricPermGroup = currentPermGroup.getFabricObject();
          currentPermGroup.add(aptObjects[i]);
          currentFabricPermGroup.set({ opacity: .5 });

          // Change the focus from the object back to the perm group
          this.canvas.setActiveObject(currentFabricPermGroup);
        }
      }
    } else {

      for( var i in aptObjects ) {
        if( aptObjects[i].permGroup !== undefined ) {
          //aptObjects[i].permGroup.remove(aptObjects[i]);
        }
      }
    }

    this.canvas.renderAll();
/*
    if (this.state == "modified") {
      this.saveRemotely();
    }
*/
  }

  this.saveSuccessCallback = function(data) {
    this.changeState('saved');
  }

}

/* Send current workspace state to server for saving. */
Workspace.prototype.saveRemotely = function() {
  this.changeState('saving');
  log.action("system", "Saving workspace");

  var boundSaveSuccessCallback = createBoundedWrapper(this, this.saveSuccessCallback);
  var tempWorkspace = {};

  tempWorkspace.id = this.id;
  tempWorkspace.initialized = this.initialized;
  tempWorkspace.title = "";
  tempWorkspace.items = [];
  tempWorkspace.permGroups = [];
  for (var i = 0; i < this.numItems; i++) {
    tempWorkspace.items[i] = this.items[i].toJSON();
  }

  for( var i=0;i<this.permGroups.length;i++) {
    tempWorkspace.permGroups[i] = this.permGroups[i].toJSON();
  }

  var jsonString = JSON.stringify(tempWorkspace);
  var jsonws = this.canvas.toJSON();

  // Error handling for this request is non-existent currently.
  $.post(this.config.apiURL, {
    id: this.id,
    content: jsonString
  }, boundSaveSuccessCallback);

}

Workspace.prototype.renderClickFeedback = function(left, top) {
  log.action("system", "Render click feedback");
  var innerCircle = new fabric.Circle({ 
    radius: 8, 
    left: left,
    top: top,
    fill: 'rgb(255,255,255)', 
    opacity: 0.6
  });

  var outerCircle = new fabric.Circle({ 
    radius: 12, 
    left: left,
    top: top,
    fill: 'rgb(0,255,0)', 
    opacity: 0.6
  });

  outerCircle.selectable = false, innerCircle.selectable = false;

  this.canvas.add(outerCircle, innerCircle);
  this.canvas.renderAll();

  function fade() {
    var newOpacity = outerCircle.get('opacity')-.05;
    if( newOpacity <= 0 ) {
      outerCircle.set({opacity: 0});
      innerCircle.set({opacity: 0});
      this.canvas.remove(outerCircle);
      this.canvas.remove(innerCircle);
      return;
    } else {
      outerCircle.set({opacity: outerCircle.get('opacity')-.05});
      this.canvas.renderAll();
      setTimeout(boundedFade, 5);
    }
  }

  var boundedFade = createBoundedWrapper(this, fade);

  setTimeout(boundedFade, 5);
}

Workspace.prototype.init = function() {
  log.action("system", "Begin system initialization");

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
  canvasElem.setAttribute('style', "border:1px solid #ccc;");
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
/*
  // temp function
  if(this.loadCurrent === false) {
    var fileName = "loadedeval.json";
  } else {
    var fileName = this.config.apiURL;
  }
*/
  // Need error handling for this
  // including timeouts
  $.getJSON(this.config.apiURL, {
    workspace: '1'
//  }, boundProcessJSON);
  }, boundProcessJSON );
}

/**
 * Returns PermGroup if object is contained within it, otherwise false
 * @method isInsidePermGroup
 * @return {Object|Boolean}
 */
Workspace.prototype.isInsidePermGroup = function( objArray ) {
  if( this.permGroups.length > 0 ) {

    for( var i in this.permGroups ) {
      for( var k=0;k<objArray.length;k++ ) {
        var fabricObject = objArray[k].fabric;
        var permGroupFabricObj = this.permGroups[i].fabric;
        if( !fabricObject.isContainedWithinObject( permGroupFabricObj ) ) {
          return false;
        } 
      }
      return this.permGroups[i];
    }
  }

  return false;
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
