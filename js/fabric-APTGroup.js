fabric.APTGroup = function(aptObject, el, options) {
  options || (options = { });
  this.initialize(el, options);

  this.type = "apt-group";
  this.aptObject = aptObject;

  this.backgroundRect = new fabric.Rect({ width: this.get('width'), height: this.get('height'), fill: this.fill, opacity: .6 });
  this.backgroundRect.selectable = true;
  this.backgroundRect.hasControls = false;
  this.backgroundRect.hasBorders = false;

  this.add(this.backgroundRect);
  console.log(this);
};

function ProtoProxy(){ }
ProtoProxy.prototype = fabric.Group.prototype;
fabric.APTGroup.prototype = new ProtoProxy;

/**
* Returns fabric.Group instance from an object representation
* @static
* @method fabric.Group.fromObject
* @param object {Object} object to create a group from
* @param options {Object} options object
* @return {fabric.Group} an instance of fabric.Group
*/
fabric.APTGroup.fromObject = function(object, callback) {
    fabric.util.enlivenObjects(object.objects, function(enlivenedObjects) {
      delete object.objects;
      callback(new fabric.Group(enlivenedObjects, object));
    });
  };
  
fabric.APTGroup.async = true;