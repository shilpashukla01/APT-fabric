// Array.indexOf crutch for older browsers that don't support it
if (!Array.prototype.indexOf) {  
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {  
        "use strict";  
        if (this == null) {  
            throw new TypeError();  
        }  
        var t = Object(this);  
        var len = t.length >>> 0;  
        if (len === 0) {  
            return -1;  
        }  
        var n = 0;  
        if (arguments.length > 0) {  
            n = Number(arguments[1]);  
            if (n != n) { // shortcut for verifying if it's NaN  
                n = 0;  
            } else if (n != 0 && n != Infinity && n != -Infinity) {  
                n = (n > 0 || -1) * Math.floor(Math.abs(n));  
            }  
        }  
        if (n >= len) {  
            return -1;  
        }  
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
        for (; k < len; k++) {  
            if (k in t && t[k] === searchElement) {  
                return k;  
            }  
        }  
        return -1;  
    }  
}  

/* Logging object.
 * Usage: log.entryType( creator, msg );
 *  -entryType: error, warning, action (debug covered below)
 *  -creator: fabric, system, user
 *  -msg: whatever message you want to record
 * Usage: log.debug( msg );
 * Mimics console.log() function
 */
var log = new function() {
  this.suppressErrors = false;
  this.suppressWarnings = false;
  this.suppressActions = false;
  this.supressDebug = false;

  this.error = function( creator, msg ) {
    if ( !this.suppressErrors ) {
      console.log("["+creator+"][error] " + msg);
    }
  },

  this.warning = function( creator, msg ) {
    if ( !this.suppressWarnings ) {
      console.log("["+creator+"][warning] " + msg);
    }
  },

  this.action = function( creator, msg ) {
    if ( !this.suppressActions ) {
      console.log("["+creator+"][action] " + msg);
    }
  },

  this.debug = function( msg ) {
    if ( !this.suppressDebug ) {
      console.log("[debug]["+msg+"]");
    }
  }

};

/* Takes in a function method, returns a duplicate scoped to object.
   So 'this' will point to object. Helpful for things like event
   handler functions that are scoped to DOMWindow or document despite
   being called inside an object. */
function createBoundedWrapper(object, method) {
  return function() {
    return method.apply(object, arguments);
  };
}

fabric.util.generateRGB = function() {
  var rgbString = "rgb("+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+")";
  return rgbString;
}