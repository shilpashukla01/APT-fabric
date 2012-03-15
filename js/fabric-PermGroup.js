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

    previousLeft: 0,
    previousTop: 0,
    previousScaleX: 1,
    previousScaleY: 1,

    /**
     * Constructor
     * @method initialize
     * @param options {Object} options object
     * @return {Object} thisArg
     */
    initialize: function(workspace, options) {
      this.workspace = workspace;
      this.objects = [];
      this._initStateProperties();
      this.callSuper('initialize', options);
      this._initRxRy();

      this.id = options.id;

      //this.loadSVGFile('plus', .7, 40, 40, 98, 1200);

      this._updateObjectsCoords();

    },

    /**
     * Constructor
     * @method add
     * @param object {Object} Fabric object
     * @return {Object} thisArg
     */
    add: function(object) {
      this.objects.push(object);
      console.log("added");
      console.log(this.objects);
      object.permGroup = this;

    },

    /**
     * Removes an object from a group; Then recalculates group's dimension, position.
     * @param {Object} object
     * @return {fabric.Group} thisArg
     * @chainable
     */
    remove: function(object) {
      fabric.util.removeFromArray(this.objects, object);
//      this._calcBounds();
//      this._updateObjectsCoords();
//      return this;
    },

    /**
     * @private
     * @method _calcBounds
     */
    _calcBounds: fabric.Group.prototype._calcBounds,

    /**
     * @private
     * @method _updateObjectsCoords
     */
     _updateObjectsCoords: fabric.Group.prototype._updateObjectsCoords,

    /**
     * Creates `stateProperties` list on an instance, and adds `fabric.PermGroup` -specific ones to it 
     * (such as "rx", "ry", etc.)
     * @private
     * @method _initStateProperties
     */
    _initStateProperties: fabric.Rect.prototype._initStateProperties,
    
    /**
     * @private
     * @method _initRxRy
     */
  _initRxRy: fabric.Rect.prototype._initRxRy,
    
    /**
     * Returns an array of all objects in this group
     * @method getObjects
     * @return {Array} group objects
     */
  getObjects: fabric.Group.prototype.getObjects,

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
      
      ctx.beginPath();
      ctx.globalAlpha *= this.opacity;
      
      if (this.group) {
        ctx.translate(this.x || 0, this.y || 0);
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
    _normalizeLeftTopProperties: fabric.Rect._normalizeLeftTopProperties,
    
    /**
     * @method complexity
     * @return {Number} complexity
     */
    complexity: fabric.Rect.complexity,
    
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

    contains: fabric.Group.prototype.contains

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