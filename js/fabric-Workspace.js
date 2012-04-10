fabric.Workspace = function(el, options) {
  options || (options = { });
  
  this._initStatic(el, options);
  this._initInteractive();

  this.permGroups = [];

  fabric.Workspace.activeInstance = this;
};

function ProtoProxy(){ }
ProtoProxy.prototype = fabric.StaticCanvas.prototype;
fabric.Workspace.prototype = new ProtoProxy;