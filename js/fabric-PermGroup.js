(function(global) {
  
  "use strict";
  
  var fabric = global.fabric || (global.fabric = { });
  
  if (fabric.PermGroup) {
    console.warn('fabric.PermGroup is already defined');
    return;
  }
  
  /** 
   * @class PermGroup
   * @extends fabric.Object
   */
  fabric.PermGroup = fabric.util.createClass(fabric.Object, /** @scope fabric.PermGroup.prototype */ {
    
    /**
     * @property
     * @type String
     */
    type: 'perm-group',
    
    /**
     * @property
     * @type Object
     */
    options: {
      rx: 0,
      ry: 0
    },
    
    /**
     * Constructor
     * @method initialize
     * @param options {Object} options object
     * @return {Object} thisArg
     */
    initialize: function(options) {
      // fabric.Group var
//      this.objects = objects || [];
      this.objects = [];
      this._initStateProperties();
      this.callSuper('initialize', options);
      this._initRxRy();

      // fabric.Group funct
      this._updateObjectsCoords();

    },
    
    /**
     * @private
     * @method _updateObjectsCoords
     */
    _updateObjectsCoords: function() {
      var groupDeltaX = this.left,
          groupDeltaY = this.top;
      
      this.forEachObject(function(object) {
        
        var objectLeft = object.get('left'),
            objectTop = object.get('top');
        
        object.set('originalLeft', objectLeft);
        object.set('originalTop', objectTop);
        
        object.set('left', objectLeft - groupDeltaX);
        object.set('top', objectTop - groupDeltaY);
        
        object.setCoords();
        
        // do not display corners of objects enclosed in a group
        object.hideCorners = true;

      }, this);
    },

    /**
     * Creates `stateProperties` list on an instance, and adds `fabric.PermGroup` -specific ones to it 
     * (such as "rx", "ry", etc.)
     * @private
     * @method _initStateProperties
     */
    _initStateProperties: function() {
      this.stateProperties = this.stateProperties.concat(['rx', 'ry']);
    },
    
    /**
     * @private
     * @method _initRxRy
     */
    _initRxRy: function() {
      if (this.rx && !this.ry) {
        this.ry = this.rx;
      }
      else if (this.ry && !this.rx) {
        this.rx = this.ry;
      }
    },
    
    /**
     * Returns an array of all objects in this group
     * @method getObjects
     * @return {Array} group objects
     */
    getObjects: function() {
      return this.objects;
    },

    /**
     * @private
     * @method _render
     * @param ctx {CanvasRenderingContext2D} context to render on
     */
   _render: function(ctx) {
      var rx = this.rx || 0,
          ry = this.ry || 0,
          x = -this.width / 2,
          y = -this.height / 2,
          w = this.width,
          h = this.height;

    this._updateObjectsCoords();

     for (var i = 0, len = this.objects.length, object; object = this.objects[i]; i++) {
        var originalScaleFactor = object.borderScaleFactor;
        object.borderScaleFactor = groupScaleFactor;
        object.render(ctx);
        object.borderScaleFactor = originalScaleFactor;
      }

      ctx.moveTo(x+rx, y);
      ctx.lineTo(x+w-rx, y);
      ctx.bezierCurveTo(x+w, y, x+w, y+ry, x+w, y+ry);
      ctx.lineTo(x+w, y+h-ry);
      ctx.bezierCurveTo(x+w,y+h,x+w-rx,y+h,x+w-rx,y+h);
      ctx.lineTo(x+rx,y+h);
      ctx.bezierCurveTo(x,y+h,x,y+h-ry,x,y+h-ry);
      ctx.lineTo(x,y+ry);
      ctx.bezierCurveTo(x,y,x+rx,y,x+rx,y);
      ctx.closePath();
      
      if (this.fill) {
        ctx.fill();
      }
      if (this.stroke) {
        ctx.stroke();
      }
    },

    // since our coordinate system differs from that of SVG
    _normalizeLeftTopProperties: function(parsedAttributes) {
      if (parsedAttributes.left) {
        this.set('left', parsedAttributes.left + this.getWidth() / 2);
      }
      this.set('x', parsedAttributes.left || 0);
      if (parsedAttributes.top) {
        this.set('top', parsedAttributes.top + this.getHeight() / 2);
      }
      this.set('y', parsedAttributes.top || 0);
      return this;
    },
    
    /**
     * @method complexity
     * @return {Number} complexity
     */
    complexity: function() {
      return 1;
    },
    
   /**
     * Executes given function for each object in this group
     * @method forEachObject
     * @param {Function} callback 
     *                   Callback invoked with current object as first argument, 
     *                   index - as second and an array of all objects - as third.
     *                   Iteration happens in reverse order (for performance reasons).
     *                   Callback is invoked in a context of Global Object (e.g. `window`) 
     *                   when no `context` argument is given
     *
     * @param {Object} context Context (aka thisObject)
     *
     * @return {fabric.PermGroup} thisArg
     * @chainable
     */
    forEachObject: fabric.StaticCanvas.prototype.forEachObject,

  });
  

  // TODO (kangax): implement rounded rectangles (both parsing and rendering)
  
  /**
   * List of attribute names to account for when parsing SVG element (used by `fabric.PermGroup.fromElement`)
   * @static
   */
  fabric.PermGroup.ATTRIBUTE_NAMES = 'x y width height rx ry fill fill-opacity opacity stroke stroke-width transform'.split(' ');
  
  /**
   * @private
   */
  function _setDefaultLeftTopValues(attributes) {
    attributes.left = attributes.left || 0;
    attributes.top  = attributes.top  || 0;
    return attributes;
  }
  

  
})(typeof exports != 'undefined' ? exports : this);