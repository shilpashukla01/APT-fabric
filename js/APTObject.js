/* Our generic APT object base class. */
function APTObject(workspace, fabricObject) {
  this.workspace = workspace;
  this.id = ++this.workspace.numItems;
  this.title = undefined;
  this.description = undefined;

}
APTObject.prototype.getFabricObject = function() {
  return this.fabric;
}

APTObject.prototype.setTitle = function(title) {
	this.title = title;
}

APTObject.prototype.setDescription = function(description) {
	this.description = description;
}
/*
APTObject.prototype.equals = function(x)
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
*/
