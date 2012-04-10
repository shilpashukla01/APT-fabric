(function(global) {

    "use strict";

    var extend = fabric.util.object.extend;

    if (!global.fabric) {
        global.fabric = {};
    }

    if (global.fabric.Item) {
        fabric.warn('fabric.Item is already defined.');
        return;
    };

    if (!fabric.Object) {
        fabric.warn('fabric.Object is required for fabric.Item initialization');
        return;
    }

    /**
     * @class Image
     * @extends fabric.Object
     */
    fabric.Item = fabric.util.createClass(fabric.Object, /** @scope fabric.Item.prototype */ {

        /**
         * @property
         * @type Boolean
         */
        active: false,

        /**
         * @property
         * @type Boolean
         */
        bordervisibility: false,

        /**
         * @property
         * @type Boolean
         */
        cornervisibility: false,

        /**
         * @property
         * @type String
         */
        type: 'item',

        /**
         * Filters to be applied to an image (when calling `applyFilters`)
         * @property
         * @type Array
         */
        filters: [],

        /**
         * Constructor
         * @param {HTMLImageElement | String} element Image element
         * @param {Object} options optional
         */
        initialize: function(element, options) {
            options || (options = {});

            this.callSuper('initialize', options);
            this._initElement(element);
            this._originalImage = this.getElement();
            this._initConfig(options);

            if (options.filters) {
                this.filters = options.filters;
                //this.applyFilters();
            }
        },

        /**
         * Returns image element which this instance if based on
         * @method getElement
         * @return {HTMLImageElement} image element
         */
        getElement: fabric.Image.prototype.getElement,

        /**
         * Sets image element for this instance to a specified one
         * @method setElement
         * @param {HTMLImageElement} element
         * @return {fabric.Image} thisArg
         * @chainable
         */
        setElement: fabric.Image.prototype.setElement,

        /**
         * Returns original size of an image
         * @method getOriginalSize
         * @return {Object} object with "width" and "height" properties
         */
        getOriginalSize: fabric.Image.prototype.getOriginalSize,

        /**
         * Sets border visibility
         * @method setBorderVisibility
         * @param {Boolean} visible When true, border is set to be visible
         */
        setBorderVisibility: fabric.Image.prototype.setBorderVisibility,

        /**
         * Sets corner visibility
         * @method setCornersVisibility
         * @param {Boolean} visible When true, corners are set to be visible
         */
        setCornersVisibility: fabric.Image.prototype.setCornersVisibility,

        /**
         * Renders image on a specified context
         * @method render
         * @param {CanvasRenderingContext2D} ctx Context to render on
         */
        render: fabric.Image.prototype.render,

        /**
         * Returns object representation of an instance
         * @method toObject
         * @return {Object} Object representation of an instance
         */
        toObject: fabric.Image.prototype.toObject,

        /**
         * Returns svg representation of an instance
         * @method toSVG
         * @return {string} svg representation of an instance
         */
/*
        toSVG: function() {
            return '<g transform="' + this.getSvgTransform() + '">' + '<image xlink:href="' + this.getSvgSrc() + '" ' + 'style="' + this.getSvgStyles() + '" ' +
            // we're essentially moving origin of transformation from top/left corner to the center of the shape
            // by wrapping it in container <g> element with actual transformation, then offsetting object to the top/left
            // so that object's center aligns with container's left/top
            'transform="translate(' + (-this.width / 2) + ' ' + (-this.height / 2) + ')" ' + 'width="' + this.width + '" ' + 'height="' + this.height + '"' + '/>' + '</g>';
        },
*/
        /**
         * Returns source of an image
         * @method getSrc
         * @return {String} Source of an image
         */
        getSrc: fabric.Image.prototype.getSrc,

        /**
         * Returns string representation of an instance
         * @method toString
         * @return {String} String representation of an instance
         */
/*
        toString: function() {
            return '#<fabric.Image: { src: "' + this.getSrc() + '" }>';
        },
*/
        /**
         * Returns a clone of an instance
         * @mthod clone
         * @param {Function} callback Callback is invoked with a clone as a first argument
         */
        clone: fabric.Image.prototype.clone,

        /**
         * Returns true if object is fully contained within area of another object
        * @method isContainedWithinObject
        * @param {Object} other Object to test
        * @return {Boolean}
        */
        isContainedWithinObject: function(other) {
            return this.isContainedWithinRect(other.oCoords.tl, other.oCoords.br);
        },

        /**
         * Returns true if object is fully contained within area formed by 2 points
         * @method isContainedWithinRect
         * @param {Object} selectionTL
         * @param {Object} selectionBR
         * @return {Boolean}
         */
        isContainedWithinRect: function(selectionTL, selectionBR) {
             var scaledTargetWidth = this.width * this.scaleX;
            var scaledTargetHeight = this.height * this.scaleY;

            var tl = new fabric.Point(this.left - (scaledTargetWidth / 2), this.top - (scaledTargetHeight / 2)),
                tr = new fabric.Point(this.left + (scaledTargetWidth / 2), this.top - (scaledTargetHeight / 2)),
                bl = new fabric.Point(this.left - (scaledTargetWidth / 2), this.top + (scaledTargetHeight / 2)),
                br = new fabric.Point(this.left + (scaledTargetWidth / 2), this.top + (scaledTargetHeight / 2));
            return tl.x > selectionTL.x && tr.x < selectionBR.x && tl.y > selectionTL.y && bl.y < selectionBR.y;
        },

        /**
         * @private
         */
        _render: fabric.Image.prototype._render,

        /**
         * @private
         */
        _adjustWidthHeightToBorders: fabric.Image.prototype._adjustWidthHeightToBorders,

        /**
         * @private
         */
        _resetWidthHeight: fabric.Image.prototype._resetWidthHeight,

        /**
         * The Item class's initialization method. This method is automatically
         * called by the constructor.
         * @method _initElement
         * @param {HTMLImageElement|String} el The element representing the image
         */
        _initElement: function(element) {
            this.setElement(fabric.util.getById(element));
            fabric.util.addClass(this.getElement(), fabric.Item.CSS_CANVAS);
        },

        /**
         * @method _initConfig
         * @param {Object} options Options object
         */
        _initConfig: fabric.Image.prototype._initConfig,

        /**
         * @method _initFilters
         * @param {Object} object Object with filters property
         */
/*
        _initFilters: function(object) {
            if (object.filters && object.filters.length) {
                this.filters = object.filters.map(function(filterObj) {
                    return fabric.Image.filters[filterObj.type].fromObject(filterObj);
                });
            }
        },
*/
        /**
         * @private
         */
        _setBorder: fabric.Image.prototype._setBorder,

        /**
         * @private
         */
        _setWidthHeight: fabric.Image.prototype._setWidthHeight,

        /**
         * Returns complexity of an instance
         * @method complexity
         * @return {Number} complexity
         */
        complexity: fabric.Image.prototype.complexity,

    });

    /**
     * Default CSS class name for canvas
     * @static
     * @type String
     */
    fabric.Item.CSS_CANVAS = "canvas-img";

    fabric.Item.prototype.getSvgSrc = fabric.Image.prototype.getSrc;

    /**
     * Creates an instance of fabric.Item from its object representation
     * @static
     * @method fromObject
     * @param object {Object}
     * @param callback {Function} optional
     */
    fabric.Item.fromObject = function(object, callback) {
        var img = fabric.document.createElement('img'),
            src = object.src;

        if (object.width) {
            img.width = object.width;
        }
        if (object.height) {
            img.height = object.height;
        }

        /** @ignore */
        img.onload = function() {
            fabric.Image.prototype._initFilters.call(object, object);

            var instance = new fabric.Item(img, object);
            callback && callback(instance);
            img = img.onload = null;
        };
        img.src = src;
    };

    /**
     * Creates an instance of fabric.Item from an URL string
     * @static
     * @method fromURL
     * @param {String} url URL to create an image from
     * @param {Function} [callback] Callback to invoke when image is created (newly created image is passed as a first argument)
     * @param {Object} [imgOptions] Options object
     */
    fabric.Item.fromURL = function(url, callback, imgOptions) {
        var img = fabric.document.createElement('img');

        /** @ignore */
        img.onload = function() {
            if (callback) {
                callback(new fabric.Item(img, imgOptions));
            }
            img = img.onload = null;
        };
        img.src = url;
    };

    /**
     * List of attribute names to account for when parsing SVG element (used by {@link fabric.Item.fromElement})
     * @static
     * @see http://www.w3.org/TR/SVG/struct.html#ImageElement
     */
    fabric.Item.ATTRIBUTE_NAMES = 'x y width height fill fill-opacity opacity stroke stroke-width transform xlink:href'.split(' ');

    fabric.Item.async = true;

})(typeof exports != 'undefined' ? exports : this);