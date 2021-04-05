function initCanvas() {
  $('.canvas-container').each(function(index) {

    var canvasContainer = $(this)[0];
    var canvasObject = $("canvas", this)[0];

    var imageOffsetX, imageOffsetY;

    function handleDragStart(e) {
      [].forEach.call(images, function(img) {
        img.classList.remove('img_dragging');
      });
      this.classList.add('img_dragging');
      var imageOffset = $(this).offset();
      imageOffsetX = e.clientX - imageOffset.left;
      imageOffsetY = e.clientY - imageOffset.top;
    }

    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'copy';
      return false;
    }

    function handleDragEnter(e) {
      this.classList.add('over');
    }

    function handleDragLeave(e) {
      this.classList.remove('over');
    }

    function handleDrop(e) {
      e = e || window.event;
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      var img = document.querySelector('.furniture img.img_dragging');
      console.log('event: ', e);

      var offset = $(canvasObject).offset();
      var y = e.clientY - (offset.top + imageOffsetY);
      var x = e.clientX - (offset.left + imageOffsetX);

      var newImage = new fabric.Image(img, {
        width: img.width,
        height: img.height,
        left: x,
        top: y
      });
      canvas.add(newImage);
      return false;
    }

    function handleDragEnd(e) {
      [].forEach.call(images, function(img) {
        img.classList.remove('img_dragging');
      });
    }

    var images = document.querySelectorAll('.furniture img');
    [].forEach.call(images, function(img) {
      img.addEventListener('dragstart', handleDragStart, false);
      img.addEventListener('dragend', handleDragEnd, false);
    });
    canvasContainer.addEventListener('dragenter', handleDragEnter, false);
    canvasContainer.addEventListener('dragover', handleDragOver, false);
    canvasContainer.addEventListener('dragleave', handleDragLeave, false);
    canvasContainer.addEventListener('drop', handleDrop, false);
  });
}
initCanvas();

var canvas = new fabric.Canvas('canvas', {
  width: 600,
  height: 300,
  selection: false,
  preserveObjectStacking: true
});
fabric.Object.prototype.set({
  transparentCorners: false,
});

// create grid
function createGrid() {
  var grid = 50;
  var gridLines = [];
  // define presentation option of grid
  var lineOption = {stroke: '#ccc', selectable: false, evented: false};

  for (var i = 0; i < (canvas.get('width') / grid); i++) {
    gridLines.push(new fabric.Line([ 0, i * grid, canvas.get('width'), i * grid], lineOption));
    gridLines.push(new fabric.Line([ i * grid, 0, i * grid, canvas.get('height')], lineOption));
  }
  // Group add to canvas
  var gridGroup = new fabric.Group(gridLines, {left: 0, top: 0, selectable: false, evented: false});
  canvas.add(gridGroup);
}

// zooming and panning
(function() {
  function renderVieportBorders() {
    var ctx = canvas.getContext();

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.1)';

    ctx.fillRect(
      canvas.viewportTransform[4],
      canvas.viewportTransform[5],
      canvas.getWidth() * canvas.getZoom(),
      canvas.getHeight() * canvas.getZoom());

    ctx.setLineDash([5, 5]);

    ctx.strokeRect(
      canvas.viewportTransform[4],
      canvas.viewportTransform[5],
      canvas.getWidth() * canvas.getZoom(),
      canvas.getHeight() * canvas.getZoom());

    ctx.restore();
  }
  canvas.on('object:selected', function(opt) {
      var target = opt.target;
      if (target._cacheCanvas) {

      }
  })

  canvas.on('mouse:wheel', function(opt) {
    var e = opt.e;
    if (!e.ctrlKey) {
      return;
    }
    var newZoom = canvas.getZoom() - e.deltaY / 300;
    canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, newZoom);

    renderVieportBorders();
    e.preventDefault();
    return false;
  });

  var viewportLeft = 0,
      viewportTop = 0,
      mouseLeft,
      mouseTop,
      _drawSelection = canvas._drawSelection,
      isDown = false;

  canvas.on('mouse:down', function(options) {
    if (options.e.altKey) {
      isDown = true;

      viewportLeft = canvas.viewportTransform[4];
      viewportTop = canvas.viewportTransform[5];

      mouseLeft = options.e.x;
      mouseTop = options.e.y;
      _drawSelection = canvas._drawSelection;
      canvas._drawSelection = function(){ };
      renderVieportBorders();
    }
  });
  canvas.on('mouse:move', function(options) {
    if (options.e.altKey && isDown) {
      var currentMouseLeft = options.e.x;
      var currentMouseTop = options.e.y;

      var deltaLeft = currentMouseLeft - mouseLeft,
          deltaTop = currentMouseTop - mouseTop;

      canvas.viewportTransform[4] = viewportLeft + deltaLeft;
      canvas.viewportTransform[5] = viewportTop + deltaTop;

      canvas.renderAll();
      renderVieportBorders();
    }
  });
  canvas.on('mouse:up', function() {
    canvas._drawSelection = _drawSelection;
    isDown = false;
  });
})();

// undo redo commandhistory
canvas.counter = 0;
var newleft = 0;

var state = [];
var mods = 0;
canvas.on(
    'object:modified', function () {
    updateModifications(true);
},
    'object:added', function () {
    updateModifications(true);
}
);

function updateModifications(savehistory) {
    if (savehistory === true) {
        myjson = JSON.stringify(canvas);
        state.push(myjson);
    }
}

undo = function undo() {
    if (mods < state.length) {
        canvas.clear().renderAll();
        canvas.loadFromJSON(state[state.length - 1 - mods - 1]);
        canvas.renderAll();
        //console.log("geladen " + (state.length-1-mods-1));
        //console.log("state " + state.length);
        mods += 1;
        console.log("undo: mod " + mods + " of " + state.length);
    }
}
redo = function redo() {
    if (mods > 0) {
        canvas.clear().renderAll();
        canvas.loadFromJSON(state[state.length - 1 - mods + 1]);
        canvas.renderAll();
        //console.log("geladen " + (state.length-1-mods+1));
        mods -= 1;
        //console.log("state " + state.length);
        //console.log("mods " + mods);
        console.log("redo: mod " + mods + " of " + state.length);
    }
}
clearcan = function clearcan() {
    canvas.clear().renderAll();
    newleft = 0;
}

function copy() {
  // clone what are you copying since you
  // may want copy and paste on different moment.
  // and you do not want the changes happened
  // later to reflect on the copy.
  canvas.getActiveObject().clone(function(cloned) {
    _clipboard = cloned;
  });
}
function paste() {
  // clone again, so you can do multiple copies.
  _clipboard.clone(function(clonedObj) {
    canvas.discardActiveObject();
    clonedObj.set({
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });
    if (clonedObj.type === 'activeSelection') {
      // active selection needs a reference to the canvas.
      clonedObj.canvas = canvas;
      clonedObj.forEachObject(function(obj) {
          canvas.add(obj);
      });
      // this should solve the unselectability
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
    }
    _clipboard.top += 10;
    _clipboard.left += 10;
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
  });
}
function duplicate() {
  copy();
  paste();
}
function remove() {
  canvas.getActiveObjects().forEach((obj) => {
    canvas.remove(obj)
  });
  canvas.discardActiveObject().renderAll()
}

function flipH() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentFlip = activeObj.get('flipX')
    if (currentFlip === true) {
      activeObj.set('flipX', false)
    } else {
      activeObj.set('flipX', true)
    }
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function flipV() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentFlip = activeObj.get('flipY')
    if (currentFlip === true) {
      activeObj.set('flipY', false)
    } else {
      activeObj.set('flipY', true)
    }
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function rotateCW() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentAngle = activeObj.get('angle')
//    activeObj.set('originX', "center")
//    activeObj.set('originY', "center")
    activeObj.set('angle', currentAngle + 90)
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function rotateCCW() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentAngle = activeObj.get('angle')
//    activeObj.set('originX', "center")
//    activeObj.set('originY', "center")
    activeObj.set('angle', currentAngle - 90)
    activeObj.setCoords();
    canvas.renderAll();
  }
}

// Align the selected object
function process_align(val, activeObj) {
  //Override fabric transform origin to center
  fabric.Object.prototype.set({
    originX: 'center',
    originY: 'center',
  });

  const bound = activeObj.getBoundingRect()

  switch (val) {
    case 'left':
      activeObj.set({
        left: activeObj.left - bound.left 
      });
      break;
    case 'right':
      activeObj.set({
        left: canvas.width - bound.width/2
      });
      break;
    case 'top':
      activeObj.set({
        top: activeObj.top - bound.top
      });
      break;
    case 'bottom':
      activeObj.set({
        top: canvas.height - bound.height/2
      });
      break;
    case 'center':
      activeObj.set({
        left: canvas.width / 2
      });
      break;
    case 'middle':
      activeObj.set({
        top: canvas.height / 2
      });
      break;
  }
}

// Assign alignment
function alignLeft() {
  var cur_value = 'left';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
};
function alignCenter() {
  var cur_value = 'center';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignRight() {
  var cur_value = 'right';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignTop() {
  var cur_value = 'top';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignMiddle() {
  var cur_value = 'middle';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignBottom() {
  var cur_value = 'bottom';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}

var objectToSendBack;
canvas.on("selection:created", function(event){
  objectToSendBack = event.target;
});
canvas.on("selection:updated", function(event){
  objectToSendBack = event.target;
});
function sendBackwards() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.sendBackwards(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function sendToBack() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.sendToBack(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function bringForward() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.bringForward(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function bringToFront() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.bringToFront(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}

function ungroup() {
  var activeObject = canvas.getActiveObject();
  if(activeObject.type=="group"){
    var items = activeObject._objects;
    activeObject._restoreObjectsState();
    canvas.remove(activeObject);
    for(var i = 0; i < items.length; i++) {
      canvas.add(items[i]);
      canvas.item(canvas.size()-1).hasControls = true;
    }

    canvas.renderAll();
  }
}

var w, h;
function upload(e) {
  var fileType = e.target.files[0].type;
  var url = URL.createObjectURL(e.target.files[0]);
  
  var img = new Image();
  img.onload = function() {
    w = this.width;
    h = this.height;
    canvas.setDimensions({width:w, height:h});
  }
  img.src = url;

  if (fileType === 'image/svg+xml') { //check if svg
    fabric.loadSVGFromURL(url, function(objects, options) {
       var svg = fabric.util.groupSVGElements(objects, options);
       canvas.add(svg);
    });
  }
}

// touch gestures
var info = document.createTextNode("p");
canvas.on({
  'touch:gesture': function() {
    var text = document.createTextNode(' Gesture ');
    info.insertBefore(text, info.firstChild);
  },
  'touch:drag': function() {
    var text = document.createTextNode(' Dragging ');
    info.insertBefore(text, info.firstChild);
  },
  'touch:orientation': function() {
    var text = document.createTextNode(' Orientation ');
    info.insertBefore(text, info.firstChild);
  },
  'touch:shake': function() {
    var text = document.createTextNode(' Shaking ');
    info.insertBefore(text, info.firstChild);
  },
  'touch:longpress': function() {
    var text = document.createTextNode(' Longpress ');
    info.insertBefore(text, info.firstChild);
  }
});

// tools
var line, isDown;

function drawLine() {
  removeEvents();
  changeObjectSelection(false);
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    var points = [pointer.x, pointer.y, pointer.x, pointer.y];
    line = new fabric.Line(points, {
      strokeWidth: 5,
      fill: '#07ff11a3',
      stroke: '#07ff11a3',
      originX: 'center',
      originY: 'center',
      centeredRotation: true,
      selectable: false
    });
    canvas.add(line);
  });
  canvas.on('mouse:move', function(o) {
    if (!isDown) return;
    var pointer = canvas.getPointer(o.e);
    line.set({
      x2: pointer.x,
      y2: pointer.y
    });
    canvas.renderAll();
  });

  canvas.on('mouse:up', function(o) {
    isDown = false;
    line.setCoords();
  });
}
function drawRect() {
  var rect, isDown, origX, origY;
  removeEvents();
  changeObjectSelection(false);

  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    var pointer = canvas.getPointer(o.e);
    rect = new fabric.Rect({
      left: origX,
      top: origY,
      originX: 'left',
      originY: 'top',
      width: pointer.x - origX,
      height: pointer.y - origY,
      angle: 0,
      selectable: false,
      centeredRotation: true,
      fill: '#07ff11a3',
      stroke: 'black',
      centeredRotation: true,
    });
    canvas.add(rect);
  });

  canvas.on('mouse:move', function(o) {
    if (!isDown) return;
    var pointer = canvas.getPointer(o.e);

    if (origX > pointer.x) {
      rect.set({
        left: Math.abs(pointer.x)
      });
    }
    if (origY > pointer.y) {
      rect.set({
        top: Math.abs(pointer.y)
      });
    }

    rect.set({
      width: Math.abs(origX - pointer.x)
    });
    rect.set({
      height: Math.abs(origY - pointer.y)
    });


    canvas.renderAll();
  });
  
  canvas.on('mouse:up', function(o) {
    isDown = false;
    rect.setCoords();
  });
}
function drawCircle() {
  var circle, isDown, origX, origY;
  removeEvents();
  changeObjectSelection(false);
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    circle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 1,
      strokeWidth: 1,
      fill: '#07ff11a3',
      stroke: 'black',
      selectable: false,
      originX: 'center',
      originY: 'center'
    });
    canvas.add(circle);
  });

  canvas.on('mouse:move', function(o) {
    if (!isDown) return;
    var pointer = canvas.getPointer(o.e);
    circle.set({
      radius: Math.abs(origX - pointer.x)
    });
    canvas.renderAll();
  });

  canvas.on('mouse:up', function(o) {
    isDown = false;
    circle.setCoords();
  });

}
function drawEllipse() {
  var ellipse, isDown, origX, origY;
  removeEvents();
  changeObjectSelection(false);
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    ellipse = new fabric.Ellipse({
      left: pointer.x,
      top: pointer.y,
      rx: pointer.x - origX,
      ry: pointer.y - origY,
      angle: 0,
      fill: '#07ff11a3',
      strokeWidth: 1,
      stroke: 'black',
      selectable: true,
      centeredRotation: true,
      originX: 'center',
      originY: 'center'
    });
    canvas.add(ellipse);
  });

  canvas.on('mouse:move', function(o){
      if (!isDown) return;
      var pointer = canvas.getPointer(o.e);
      var rx = Math.abs(origX - pointer.x)/2;
      var ry = Math.abs(origY - pointer.y)/2;
      if (rx > ellipse.strokeWidth) {
        rx -= ellipse.strokeWidth/2
      }
       if (ry > ellipse.strokeWidth) {
        ry -= ellipse.strokeWidth/2
      }
      ellipse.set({ rx: rx, ry: ry});

      if(origX>pointer.x){
          ellipse.set({originX: 'right' });
      } else {
          ellipse.set({originX: 'left' });
      }
      if(origY>pointer.y){
          ellipse.set({originY: 'bottom'  });
      } else {
          ellipse.set({originY: 'top'  });
      }
      canvas.renderAll();
  });

  canvas.on('mouse:up', function(o){
    isDown = false;
    ellipse.setCoords();
  });
}
function drawText() {
  var text, isDown, origX, origY;
  removeEvents();
  changeObjectSelection(false);
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    text = new fabric.Text("Your text here", {
      left: pointer.x,
      top: pointer.y,
      fontFamily: 'Open Sans',
      //textAlign: 'center',
      fill: 'navy',
      angle: 0,
      fill: '#07ff11a3',
      strokeWidth: 1,
      stroke: 'black',
      selectable: true,
      centeredRotation: true,
      originX: 'left',
      originY: 'top'
    });
    canvas.add(text);
    canvas.renderAll();
  });

  canvas.on('mouse:up', function(o){
    isDown = false;
    text.setCoords();
  });
}
function drawTriangle() {
  var triangle, isDown, origX, origY;
  removeEvents();
  changeObjectSelection(false);
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    triangle = new fabric.Triangle({
      left: pointer.x,
      top: pointer.y,
      width: pointer.x - origX,
      height: pointer.y - origY,
      strokeWidth: 1,
      fill: '#07ff11a3',
      stroke: 'black',
      strokeWidth: 3,
      selectable: false,
      centeredRotation: true,
      originX: 'left',
      originY: 'top'
    });
    canvas.add(triangle);
  });

  canvas.on('mouse:move', function(o) {
    if (!isDown) return;
    var pointer = canvas.getPointer(o.e);

    if (origX > pointer.x) {
      triangle.set({
        left: Math.abs(pointer.x)
      });
    }
    if (origY > pointer.y) {
      triangle.set({
        top: Math.abs(pointer.y)
      });
    }

    triangle.set({
      width: Math.abs(origX - pointer.x)
    });
    triangle.set({
      height: Math.abs(origY - pointer.y)
    });


    canvas.renderAll();
  });

  canvas.on('mouse:up', function(o) {
    isDown = false;
    triangle.setCoords();
  });

}
function enableFreeDrawing(){
  removeEvents();
  canvas.isDrawingMode = true;
}
function enableSelection() {
  removeEvents();
  changeObjectSelection(true);
  canvas.selection = true;
}
function changeObjectSelection(value) {
  canvas.forEachObject(function (obj) {
    obj.selectable = value;
  });
  canvas.renderAll();
}
function removeEvents() {
  canvas.isDrawingMode = false;
  canvas.selection = false;
  canvas.off('mouse:down');
  canvas.off('mouse:up');
  canvas.off('mouse:move');
}

function exportPNG() {
  var c = document.getElementById("canvas");
  var link = document.createElement('a');
  link.setAttribute('download', 'download.png');
  link.setAttribute('href', c.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  link.click();
}
function exportSVG() {
  var yourSVG = canvas.toSVG().toString().replace(/Created with Fabric.js 4.3.1/g, "Created with simple-svg-designer - michaelsboost.github.io/simple-svg-designer");
  blob = new Blob([ yourSVG ], {type: "image/svg+xml"});
  saveAs(blob, "download.svg");
}