var canvas = null;
var table = null;
var canvasDraggingEnabled = false; // Flag to toggle canvas dragging

/* Create A New Screen */
const btnCreateNewScreen = document.getElementById('createNewScreen');
//initial active a new Screen 
function initializeCanvas(screen) {
    const parentScreen = screen.parentElement;
    const canvasElement = parentScreen.querySelector('.active #imageCanvas');
    canvas = new fabric.Canvas(canvasElement);
    canvasElement.fabricCanvas = canvas;
    parentScreen.querySelector('.active').setAttribute('data-initialized', 'true'); // Đánh dấu canvas đã được khởi tạo
    canvas?.on('mouse:move', updateMousePosition);
    canvas?.on('mouse:out', function() {
        isCreatingArrow = false;  // Disable arrow creation
        console.log("Mouse left the canvas, arrow creation disabled.");
    });
}
//get current canvas is the canvas of active screen
function getCanvasActive(screen) {
    const parentScreen = screen.parentElement;
    const canvasElement = parentScreen.querySelector('.active #imageCanvas');
    canvas = canvasElement.fabricCanvas;
}

//filter node Text when get ChildNodes 
function filterNode(element) {
    let childNodes = Array.from(element);
    const elementNodes = childNodes.filter(node => node.nodeType === Node.ELEMENT_NODE);
    return elementNodes;
}
function setActiveScreen (tab, screen) {
    filterNode(tab.parentElement.childNodes).forEach(tab => {tab.classList.remove('active')});
    tab.classList.add('active');
    filterNode(screen.parentElement.childNodes).forEach(screen => {screen.classList.remove('active')});
    screen.classList.add('active');
}
//initial table for active screen
function initialTable(screen){
    const parentScreen = screen.parentElement;
    const tableElement = parentScreen.querySelector('.active #annotationTable');
    table = tableElement;
}

function addnewScreen() {
    const tabContainer = document.querySelector('.frame .tab-screens-contain');
    const screenContainer = document.querySelector('.frame .screens-contain');

    const newDivTab = document.createElement('div');
    newDivTab.classList.add('tab-content');
    tabContainer.appendChild(newDivTab);

    const tabText = document.createElement('p');
    tabText.id = 'tab-text-content';
    tabText.innerText = 'Scraft';
    newDivTab.appendChild(tabText);

    const deleteButton = document.createElement('i');
    deleteButton.className = 'fa-solid fa-x';
    newDivTab.appendChild(deleteButton);

    const newDivScreenContain = document.createElement('div');
    newDivScreenContain.classList = 'screen';
    screenContainer.appendChild(newDivScreenContain);
    const newDivScreenContent = `
        <div class="canvas">
            <canvas id="imageCanvas" width="1120" height="500"></canvas>
            <input type="color" id="colorPicker" style="display:none;">
        </div>
        <div class="table">
            <table id="annotationTable" class = "annotationTable">
                <thead>
                    <tr>
                        <th>Số thứ tự</th>
                        <th>Chất liệu</th>
                        <th>Color</th>
                        <th>Thông tin mô tả</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `
    newDivScreenContain.innerHTML += newDivScreenContent;

    //get active the new created screen
    setActiveScreen(newDivTab, newDivScreenContain)
    initializeCanvas(newDivScreenContain);
    initialTable(newDivScreenContain)
    //Delete a new Screen
    deleteButton.addEventListener('click', () => {
        const parent = deleteButton.parentElement;
        parent.parentElement.removeChild(parent);
        const parentScreen = newDivScreenContain.parentElement;
        parentScreen.removeChild(newDivScreenContain);
    });

    //get active screen when click
    newDivTab.addEventListener('click', () => {
        setActiveScreen(newDivTab, newDivScreenContain);
        getCanvasActive(newDivScreenContain);
        initialTable(newDivScreenContain)
    })
}
addnewScreen();
btnCreateNewScreen.addEventListener('click', addnewScreen)

var currentNumber = 1;
var annotationMap = {};  // Keep track of annotations
var images = [];  // Track loaded images
var drawingMode = null;  // Track the current drawing mode
var customShape = { path: [] };  // Store custom shape path
var deletedImageUrls = new Set();
var isDrawing = false;
function toggleCanvasDragging() {
    canvasDraggingEnabled = !canvasDraggingEnabled;
    console.log(`Canvas dragging ${canvasDraggingEnabled ? 'enabled' : 'disabled'}`);
}
canvas?.on('mouse:down', function(o) {
    images.forEach(function(img) {
        img.sendToBack();
    });
});
function setDrawingMode(mode) {
    // Deselect all selected objects
    canvas.discardActiveObject();
    canvas.renderAll();

    drawingMode = mode;
    customShape = new fabric.Path(''); // Reset custom shape path

    if (mode) {
        if (!backgroundImage) {
            // If no background image is set, call toggleBackground to set one
            toggleBackground();
        }

        lockImages(true);  // Lock image movement during drawing
        console.log(`Drawing mode enabled: ${mode}`);
    } else {
        // Unlock image movement and make all objects selectable and evented
        canvas.forEachObject(function(obj) {
            obj.set({
                selectable: true,
                evented: true,
            });
        });
        lockImages(false);
        console.log('Drawing mode disabled');
    }

    console.log(`Drawing mode set to: ${mode}`);
    resetCanvasListeners();
}
function handleCanvasDragging() {
    if (!canvasDraggingEnabled) return;

    canvas.on('mouse:down', function(o) {
        var pointer = canvas.getPointer(o.e);
        if (!canvas.findTarget(o.e)) {
            canvas.isDragging = true;
            canvas.selection = false; // Disable object selection temporarily
            canvas.lastPosX = pointer.x;
            canvas.lastPosY = pointer.y;
        }
    });

    // Event listener for mouse move on the canvas
    canvas.on('mouse:move', function(o) {
        if (canvas.isDragging) {
            var pointer = canvas.getPointer(o.e);
            // Get the zoom level
            var zoomLevel = canvas.getZoom();
            // Adjust delta based on the zoom level
            var deltaX = (pointer.x - canvas.lastPosX) / zoomLevel;
            var deltaY = (pointer.y - canvas.lastPosY) / zoomLevel;

            // Add a sensitivity factor to slow down the dragging
            var sensitivityFactor = 0.5; // Adjust this value as needed
            canvas.relativePan(new fabric.Point(deltaX * sensitivityFactor, deltaY * sensitivityFactor));
            
            canvas.lastPosX = pointer.x;
            canvas.lastPosY = pointer.y;
        }
    });

    // Event listener for mouse up on the canvas
    canvas.on('mouse:up', function(o) {
        canvas.isDragging = false;
        canvas.selection = true; // Re-enable object selection
    });
}



// Toggle dragging on and off with a keyboard shortcut (e.g., 'd' key)
document.addEventListener('keydown', function(event) {
    if (event.key === 'k') {
        toggleCanvasDragging();
        handleCanvasDragging();
    }
});
function moveblankcanvas(){
    toggleCanvasDragging();
    handleCanvasDragging();
}
// Event handler for mouse down event
canvas?.on('mouse:down', function (options) {
    if (!drawingMode) return;

    isDrawing = true;
    const pointer = canvas.getPointer(options.e);
    startX = pointer.x;
    startY = pointer.y;

    console.log(`Mouse down at (${startX}, ${startY})`);

    switch (drawingMode) {
        case 'rectangle':
            drawingObject = new fabric.Rect({
                left: startX,
                top: startY,
                width: 0,
                height: 0,
                fill: 'transparent',
                stroke: 'red',
                strokeWidth: 2
            });
            break;
        case 'circle':
            drawingObject = new fabric.Circle({
                left: startX,
                top: startY,
                radius: 0,
                fill: 'transparent',
                stroke: 'red',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center'
            });
            break;
        case 'arrow':
            drawingObject = new fabric.Line([startX, startY, startX, startY], {
                stroke: 'red',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center'
            });
            drawingObject.head = new fabric.Triangle({
                left: startX,
                top: startY,
                originX: 'center',
                originY: 'center',
                selectable: false,
                pointType: 'arrow_start',
                angle: 45,
                width: 10,
                height: 15,
                fill: 'red'
            });
            break;
    }

    if (drawingObject) {
        canvas.add(drawingObject);
        if (drawingMode === 'arrow') {
            canvas.add(drawingObject.head);
        }
    }

    console.log('Drawing object initialized:', drawingObject);
});
// Event handler for mouse move event
canvas?.on('mouse:move', function (options) {
    if (!isDrawing || !drawingObject) return;
    const pointer = canvas.getPointer(options.e);
    const x = pointer.x;
    const y = pointer.y;
    console.log(`Mouse move at (${x}, ${y})`);
    switch (drawingMode) {
        case 'rectangle':
            drawingObject.set({
                width: Math.abs(x - startX),
                height: Math.abs(y - startY)
            });
            if (x < startX) {
                drawingObject.set({ left: x });
            }
            if (y < startY) {
                drawingObject.set({ top: y });
            }
            break;
        case 'circle':
            const radius = Math.max(Math.abs(x - startX), Math.abs(y - startY)) / 2;
            drawingObject.set({ radius: radius });
            if (x < startX) {
                drawingObject.set({ left: startX - radius });
            }
            if (y < startY) {
                drawingObject.set({ top: startY - radius });
            }
            break;
        case 'arrow':
            drawingObject.set({
                x2: x,
                y2: y
            });
            const angle = Math.atan2(y - startY, x - startX) * 180 / Math.PI;
            drawingObject.head.set({
                left: x,
                top: y,
                angle: angle + 90
            });
            break;
    }

    console.log('Drawing object updated:', drawingObject);
    canvas.renderAll();
});
// Event handler for mouse up event
canvas?.on('mouse:up', function () {
    isDrawing = false;
    drawingObject = null;
    console.log('Mouse up, drawing completed.');
});
// Function to send images to back and make them non-selectable
function sendImagesToBack() {
    imageObjects.forEach(function(image) {
        image.set({
            selectable: true,
            evented: true // Make image non-evented to prevent accidental movements
        });
        canvas.sendToBack(image);
    });
    canvas.renderAll();
}
function bringImagesfromBack() {
    if (!canvas || imageObjects.length === 0) {
        console.error("Canvas not initialized or no image objects available.");
        return;
    }
    try {
        imageObjects.forEach(function(image) {
            console.log("Bringing image to front");
            image.set({
                selectable: true,
                evented: true // Make image evented to allow interactions
            });
            canvas.bringToFront(image);
        });
        canvas.renderAll();
    } catch (error) {
        console.error("Error in bringImagesfromBack:", error);
    }
}

function uploadImage() {
    document.getElementById('file').click();
}
document.getElementById('imageLoader').addEventListener('change', handleImage, false);

document.getElementById('drawLine').addEventListener('click', () => setDrawingMode('line'));
document.getElementById('drawArrow').addEventListener('click', () => setDrawingMode('arrow'));

document.getElementById('deleteAnnotation').addEventListener('click', deleteSelected);
document.getElementById('toggleBackgroundButton').addEventListener('click', toggleBackground);
document.getElementById('zoomIn').addEventListener('click', zoomIn);
document.getElementById('zoomOut').addEventListener('click', zoomOut);
document.getElementById('moveblankcanvas').addEventListener('click', moveblankcanvas);
table?.addEventListener('click', function(event) {
    // Deselect any active object on canvas
    canvas.discardActiveObject();
    canvas.renderAll();
});
document.addEventListener('keydown', function(event) {
    if (event.shiftKey && event.key === 'l'|| event.shiftKey && event.key === 'L') {
        setDrawingMode('line');
    } else if (event.shiftKey && event.key === 'c'|| event.shiftKey && event.key === 'C') {
        setDrawingMode('circle');
    } else if (event.shiftKey && event.key === 'a'|| event.shiftKey && event.key === 'A') {
        setDrawingMode('arrow');
    } else if (event.shiftKey && event.key === 'r'|| event.shiftKey && event.key === 'R') {
        setDrawingMode('rectangle');
    } else if (event.shiftKey && event.key === 's'|| event.shiftKey && event.key === 'S') {
        setDrawingMode('customShape');
    } else if (event.key === 'Backspace') {
        deleteSelected();
    } else if (event.key === '+') {
        zoomIn();
    } else if (event.key === '-') {
        zoomOut();
    } else if (event.shiftKey && event.key === 'e'|| event.shiftKey && event.key === 'E') {
        removeEmptyRows();
    } 
    else if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C')) {
        copy();
    } else if ((event.ctrlKey || event.metaKey) && (event.key === 'v' || event.key === 'V')) {
        paste();
    } 
});

var colors = ['white','black','red', 'blue', 'green', 'yellow', 'purple']; // màu cho đường
var colorsfill = ['white','black','red', 'blue', 'green', 'yellow', 'purple','']; // màu cho phần phía trong
var colorIndex = 0; // Chỉ số index của mảng
// short cut của việc tô màu
document.addEventListener('keydown', function(event) {
    if (event.key === 'b') {
        changeColorstroke('stroke');
    } else if (event.key === 't') {
        changeColorfill('fill');
    }
});
function changeColorstroke(property) {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
        console.log('Active Object:', activeObject);
        var shapeType = getShapeType(activeObject);
        if (shapeType) {
            switch (shapeType) {                
                case 'arrow':
                    console.log('Shape Type:', shapeType); // Check the shape type in console
                    changeColorstrokearrow();
                    break;
                case 'line':    
                case 'rectangle':
                    activeObject.set({ stroke: colors[colorIndex] });
                    break;
                case 'circle':
                case 'customShape':
                    activeObject.set({ stroke: colors[colorIndex] });
                    break;
                default:
                    break;
            }
            canvas.renderAll();
            // Increment colorIndex and wrap around if exceeding array length
            colorIndex = (colorIndex + 1) % colors.length;
        }
    }
}
function changeColorstrokearrow() {
    var activeObject = canvas.getActiveObject();
    if (activeObject && getShapeType(activeObject) === 'arrow') {
        // Assuming the arrow is a group containing lines, change stroke color for each line
        activeObject.getObjects().forEach(function(obj) {
            if (obj.type === 'line') {
                obj.set({ stroke: colors[colorIndex] });
            }
        });
        canvas.renderAll();
    }
}
function changeColorfill(property) {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
        var shapeType = getShapeType(activeObject);
        if (shapeType) {
            switch (shapeType) {
                case 'line':
                case 'arrow':
                case 'rectangle':
                    activeObject.set({ fill: colorsfill[colorIndex] });
                    break;
                case 'circle':
                case 'customShape':
                    activeObject.set({ fill: colorsfill[colorIndex] });
                    break;
                default:
                    break;
            }
            canvas.renderAll();
            // Increment colorIndex and wrap around if exceeding array length
            colorIndex = (colorIndex + 1) % colorsfill.length;
        }
    }
}
// Function to determine the type of shape (line, circle, arrow, rectangle, customShape)
function getShapeType(object) {
    if (object instanceof fabric.Line) {
        return 'line';
    } else if (object instanceof fabric.Circle) {
        return 'circle';
    } else if (object instanceof fabric.Path) {
        // Assuming customShape is a fabric.Path
        return 'customShape';
    } else if (object instanceof fabric.Rect) {
        return 'rectangle';
    } else if (object.type === 'group' && object._objects.length > 0) {
        // Check if it's an arrow (group containing lines)
        var firstChild = object._objects[0];
        if (firstChild instanceof fabric.Line) {
            return 'arrow';
        }
    }
    return null;
}
// Function to handle image upload
var imageObjects = []; // Global variable to store the current image object
var imageUrls = new Map(); // Map to store image URLs
// Function to handle image upload
// Handle image input and add to canvas
function handleImage(e) {
    var files = e.target.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = function(event) {
            var imageUrl = event.target.result;
            if (deletedImageUrls.has(imageUrl)) {
                // Remove the URL from the deleted image URLs set
                deletedImageUrls.delete(imageUrl);
            }
            var imgObj = new Image();
            imgObj.src = imageUrl;
            imgObj.onload = function() {
                var image = new fabric.Image(imgObj);
                image.scaleToWidth(canvas.getWidth());
                canvas.add(image);
                imageObjects.push(image);
                imageUrls.set(image, imageUrl);
                canvas.renderAll();
                e.target.value = '';
                // Set the backgroundImage on the last added image
                if (imageObjects.length === 1) {
                    canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas));
                    isBackgroundSet = true;
                    console.log('Background image set:', image);
                    // Call toggleBackground function here
                    toggleBackground();
                } else {
                    console.log('Image added:', image);
                }
            };
        };
        reader.readAsDataURL(file);
    }
}
// Disable image selection and movement when in drawing mode
canvas?.on('object:modified', function(event) {
    if (drawingMode) {
        var activeObject = event.target;
        if (activeObject && activeObject.type === 'image') {
            activeObject.set({
                selectable: false,
                evented: false
            });
            canvas.renderAll();
        }
    }
});

// Stack to keep track of canvas states for undo functionality
var undoStackdelete = [];
var redoStackdelete = [];

// Save the current state of the canvas and table before deletion
function saveStatedelete() {
    let state = {
        canvas: canvas.toJSON(), // Save canvas state as JSON
        table: table.innerHTML,
        imageObjects: imageObjects.map(obj => ({...obj})), // Deep copy of imageObjects
        annotationMap: {...annotationMap} // Deep copy of annotationMap
    };
    undoStackdelete.push(state);
    redoStackdelete = []; // Clear redo stack after new state saved
}


let proceedWithDelete = false;

// Event listener for 'Delete' key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Delete') {
        // Ask for confirmation before deleting
        if (confirm('Are you sure you want to delete the image and shapes?')) {
            console.log('Delete key pressed. Deleting image and shapes...');
            saveStatedelete(); // Save the current state before deletion
            deleteImageAndShapes(); // Call the function
        } else {
            console.log('Deletion canceled by user.');
            return; // Exit the function without performing deletion
        }
    }
});



// Function to delete images and shapes
function deleteImageAndShapes() {
    // Remove all image objects from the canvas
    if (imageObjects.length > 0) {
        imageObjects.forEach(function(imageObject) {
            canvas.remove(imageObject);
        });
        imageObjects = []; // Clear the array of image objects
    } else {
        console.warn('No image objects found to delete.');
    }
    
    // Remove the background image if it is set
    if (canvas.backgroundImage) {
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        console.log('Background image removed');
    } else {
        console.warn('No background image found to delete.');
    }
    
    // Remove all shapes from the canvas except images
    var objectsToRemove = [];
    canvas.getObjects().forEach(obj => {
        if (obj.type !== 'image') {
            objectsToRemove.push(obj);
        }
    });

    objectsToRemove.forEach(obj => {
        canvas.remove(obj);
    });
    
    // Clear any associated data or arrays tracking shapes (optional)
    clearAnnotationData(); 
    
    // Update your UI or perform any other necessary actions
    canvas.renderAll(); // Render the canvas after removal
    
    // Delete all rows from the table
    deleteAllTableRows(); // Call function to delete all table rows
}

// Function to clear annotation data
function clearAnnotationData() {
    // Implement your logic to clear any associated data here
    annotationMap = {}; // Clear the annotation map or any other data structures
    // Other cleanup tasks specific to your application
}

// Function to delete all table rows
function deleteAllTableRows() {   
    if (table) {
        // Remove all rows except the header row
        while (table?.rows.length > 1) {
            table?.deleteRow(1); // Start deleting from index 1 (first row after header)
        }
    } else {
        console.warn('Table not found.');
    }
}

// Function to undo the delete operation
function undoDeleteImageAndShapes() {
    if (undoStackdelete.length === 0) {
        console.warn('No actions to undo.');
        return;
    }

    let lastState = undoStackdelete.pop();
    redoStackdelete.push({
        canvas: canvas.toJSON(),
        table: table.innerHTML,
        annotationMap: {...annotationMap}
    });

    // Attempt to restore the canvas state
    try {
        canvas.loadFromJSON(lastState.canvas, function() {
            // After loading JSON state
            canvas.renderAll(); // Render the canvas after loading state

            // Restore the table state
            table.innerHTML = lastState.table;

            // Restore the annotation map
            annotationMap = lastState.annotationMap;

            console.log('Undo successful.');
        });

    } catch (error) {
        console.error('Error during undo:', error);
    }
}


// Event listener for 'Ctrl+Z' key press to trigger undo
document.addEventListener('keydown', function(event) {
    if ( event.key === 'z') {
        console.log('Ctrl+Z pressed. Undoing last action...');
        undoDeleteImageAndShapes(); // Call the undo function
    }
});

// Assuming you have a key listener or a button click event to trigger this function
// Function to copy selected object
function copy() {
    canvas.getActiveObject().clone(function(cloned) {
        _clipboard = cloned;
    });
}

// Function to paste copied object
function paste() {
    if (_clipboard) {
        _clipboard.clone(function(clonedObj) {
            canvas.discardActiveObject();
            clonedObj.set({
                left: clonedObj.left + 10, // Adjust paste position as needed
                top: clonedObj.top + 10,
                evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
                // active selection needs a reference to the canvas.
                clonedObj.canvas = canvas;
                clonedObj.forEachObject(function(obj) {
                    canvas.add(obj);
                });
                clonedObj.setCoords();
            } else {
                canvas.add(clonedObj);
            }
            addNewAnnotation(clonedObj);
            _clipboard.top += 10;
            _clipboard.left += 10;
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();
        });
    }
}
function drawLine() {
    var line, isDown;

    function handleMouseDown(o) {
        if (drawingMode !== 'line') return;
        var pointer = canvas.getPointer(o.e);

        // Check if clicking on an image
        var target = canvas.findTarget(o.e, false);
        if (target && target.type === 'image') {
            return; // Ignore drawing lines when clicking on an image
        }

        isDown = true;
        var points = [pointer.x, pointer.y, pointer.x, pointer.y];
        line = new fabric.Line(points, {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            originX: 'center',
            originY: 'center',
            selectable: false, // Temporarily set to false while drawing
            hasControls: true,
            hasBorders: true,
        });
        canvas.add(line);
        canvas.bringToFront(line); // Ensure the line is brought to the front
    }

    function handleMouseMove(o) {
        if (!isDown || drawingMode !== 'line') return;
        var pointer = canvas.getPointer(o.e);
        line.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDown || drawingMode !== 'line') return;
        isDown = false;

        // Ensure the line is selectable after drawing
        line.set({
            selectable: true,
            evented: true, // Ensure the line can receive events
        });
        line.setCoords(); // Update the line's coordinates

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = line;
        setDrawingMode(null);

        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    canvas?.on('mouse:down', handleMouseDown);
    canvas?.on('mouse:move', handleMouseMove);
    canvas?.on('mouse:up', handleMouseUp);
}

function addNewAnnotation(object) {
    var newNumber = getLargestNumber() + 1;
    addAnnotationRow(newNumber);
    addNumberLabel(newNumber, object);
    annotationMap[newNumber] = object;
    setDrawingMode(null);
}

function drawArrow() {
    var arrow, arrowHead1, arrowHead2, isDown, startX, startY;

    canvas?.on('mouse:down', function(o) {
        if (drawingMode !== 'arrow') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        startX = pointer.x;
        startY = pointer.y;
        arrow = new fabric.Line([startX, startY, startX, startY], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: false,  // Make the line non-selectable during drawing
            evented: false      // Make the line non-evented during drawing
        });
        canvas.add(arrow);
    });

    canvas?.on('mouse:move', function(o) {
        if (!isDown || drawingMode !== 'arrow') return;
        var pointer = canvas.getPointer(o.e);
        arrow.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
    });

    canvas?.on('mouse:up', function(o) {
        if (!isDown || drawingMode !== 'arrow') return;
        isDown = false;

        // Add arrowhead
        var endX = arrow.x2;
        var endY = arrow.y2;
        var angle = Math.atan2(endY - startY, endX - startX);
        var headLength = 10;

        arrowHead1 = new fabric.Line([
            endX,
            endY,
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        ], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: false,  // Make the arrowhead non-selectable during drawing
            evented: false      // Make the arrowhead non-evented during drawing
        });

        arrowHead2 = new fabric.Line([
            endX,
            endY,
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        ], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: false,  // Make the arrowhead non-selectable during drawing
            evented: false      // Make the arrowhead non-evented during drawing
        });

        // Group the arrow and arrowheads together
        var arrowGroup = new fabric.Group([arrow, arrowHead1, arrowHead2], {
            selectable: true,
            evented: true,
            originX: 'center',
            originY: 'center'
        });

        canvas.add(arrowGroup);
        canvas.remove(arrow);       // Remove the individual arrow line
        canvas.remove(arrowHead1);  // Remove the individual arrowhead1
        canvas.remove(arrowHead2);  // Remove the individual arrowhead2

        currentNumber = getLargestNumber() + 1;
        addAnnotationRow(currentNumber);
        addNumberLabel(currentNumber, arrowGroup);
        annotationMap[currentNumber] = arrowGroup;
        setDrawingMode(null);
    });
}


var lastMousePosition = { x: 0, y: 0 };
var isCreatingArrow = false;  // Flag to track if an arrow is being created

// Function to update the mouse position
function updateMousePosition(o) {
    var pointer = canvas.getPointer(o.e);
    lastMousePosition.x = pointer.x;
    lastMousePosition.y = pointer.y;
    console.log("Mouse Position:", lastMousePosition.y, lastMousePosition.x);
    isCreatingArrow = true; 
}

// Add mouse move listener once to update mouse position
canvas?.on('mouse:move', updateMousePosition);

// Disable arrow creation if the mouse moves out of the canvas
canvas?.on('mouse:out', function() {
    isCreatingArrow = false;  // Disable arrow creation
    console.log("Mouse left the canvas, arrow creation disabled.");
});

// Disable arrow creation if clicked outside the canvas
document.addEventListener('click', function(e) {
    var canvasRect = canvas.getElement().getBoundingClientRect();  // Get canvas position and dimensions
    var isOutside = 
        e.clientX < canvasRect.left || 
        e.clientX > canvasRect.right || 
        e.clientY < canvasRect.top || 
        e.clientY > canvasRect.bottom;

    if (isOutside) {
        isCreatingArrow = false;  // Disable arrow creation
        console.log("Clicked outside the canvas, arrow creation disabled.");
    }
    else {
        isCreatingArrow = true; 
    }
});

// Function to create an arrow at the mouse position on 'A' keydown
function createArrowAtMouse() {
    document.addEventListener('keydown', function(e) {
        console.log(isCreatingArrow);
        if ((e.key === 'a' || e.key === 'A') && isCreatingArrow) {
            isCreatingArrow = true;  // Start arrow creation process

            // Check if an object is selected on the canvas
            var activeObject = canvas.getActiveObject();
            if (activeObject) {
                // Deselect the object without affecting arrow creation
                canvas.discardActiveObject();
                canvas.renderAll();  // Ensure the canvas re-renders after deselecting
            }

            // Get the zoom level at the moment of drawing
            var zoomLevel = canvas.getZoom();

            // Adjust the positions based on zoom level to ensure size changes
            var startX = lastMousePosition.x;
            var startY = lastMousePosition.y;
            var endX = startX + 100 / zoomLevel;  // Extend the length of the arrow
            var endY = startY;

            // Create the arrow line and its head
            var arrow = new fabric.Line([startX, startY, endX, endY], {
                strokeWidth: 2 / zoomLevel,  // Adjust for zoom level
                fill: 'red',
                stroke: 'red',
                selectable: false,
                evented: false
            });

            var angle = Math.atan2(endY - startY, endX - startX);
            var headLength = 10 / zoomLevel;  // Adjust arrowhead size for zoom

            var arrowHead1 = new fabric.Line([
                endX,
                endY,
                endX - headLength * Math.cos(angle - Math.PI / 6),
                endY - headLength * Math.sin(angle - Math.PI / 6)
            ], {
                strokeWidth: 2 / zoomLevel,
                fill: 'red',
                stroke: 'red',
                selectable: false,
                evented: false
            });

            var arrowHead2 = new fabric.Line([
                endX,
                endY,
                endX - headLength * Math.cos(angle + Math.PI / 6),
                endY - headLength * Math.sin(angle + Math.PI / 6)
            ], {
                strokeWidth: 2 / zoomLevel,
                fill: 'red',
                stroke: 'red',
                selectable: false,
                evented: false
            });

            // Group the arrow and its head
            var arrowGroup = new fabric.Group([arrow, arrowHead1, arrowHead2], {
                selectable: true,
                evented: true,
                originX: 'center',
                originY: 'center',
                arrow: true  // Custom property to identify arrow groups
            });

            canvas.add(arrowGroup);

            // Remove individual lines after adding the group
            canvas.remove(arrow);
            canvas.remove(arrowHead1);
            canvas.remove(arrowHead2);

            // Handle annotations and labeling
            currentNumber = getLargestNumber() + 1;
            addAnnotationRow(currentNumber);
            addNumberLabel(currentNumber, arrowGroup);
            annotationMap[currentNumber] = arrowGroup;
            
            // After arrow creation, reset the flag
            isCreatingArrow = false;
            canvas.renderAll();
        }
    });
}

// Call the function to enable arrow creation functionality
createArrowAtMouse();

function drawCircle() {
    var circle, isDown;

    function handleMouseDown(o) {
        if (drawingMode !== 'circle') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        circle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            originX: 'center',
            originY: 'center',
            radius: 1,
            fill: 'rgba(0,0,0,0)',
            stroke: 'red',
            strokeWidth: 2,
            selectable: false, // Temporarily set to false while drawing
            hasControls: true,
            hasBorders: true,
        });
        canvas.add(circle);
        circle.bringToFront();
    }

    function handleMouseMove(o) {
        if (!isDown || drawingMode !== 'circle') return;
        var pointer = canvas.getPointer(o.e);
        var radius = Math.sqrt(Math.pow(circle.left - pointer.x, 2) + Math.pow(circle.top - pointer.y, 2));
        circle.set({ radius: radius });
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDown || drawingMode !== 'circle') return;
        isDown = false;

        // Ensure the circle is selectable after drawing
        circle.set({
            selectable: true,
            evented: true, // Ensure the circle can receive events
        });
        circle.setCoords(); // Update the circle's coordinates

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = circle;
        setDrawingMode(null);

        // Cleanup event listeners
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    // Attach event listeners
    canvas?.on('mouse:down', handleMouseDown);
    canvas?.on('mouse:move', handleMouseMove);
    canvas?.on('mouse:up', handleMouseUp);
}
function drawRectangle() {
    var rect, isDown, origX, origY;

    function handleMouseDown(o) {
        if (drawingMode !== 'rectangle') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        rect = new fabric.Rect({
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            width: pointer.x - origX,
            height: pointer.y - origY,
            angle: 0,
            fill: 'rgba(0,0,0,0)',
            stroke: 'red',
            strokeWidth: 2,
            selectable: false, // Temporarily set to false while drawing
            hasControls: true,
            hasBorders: true,
        });
        canvas.add(rect);
        rect.bringToFront();
    }

    function handleMouseMove(o) {
        if (!isDown || drawingMode !== 'rectangle') return;
        var pointer = canvas.getPointer(o.e);
        if (origX > pointer.x) {
            rect.set({ left: Math.abs(pointer.x) });
        }
        if (origY > pointer.y) {
            rect.set({ top: Math.abs(pointer.y) });
        }
        rect.set({
            width: Math.abs(origX - pointer.x),
            height: Math.abs(origY - pointer.y)
        });
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDown || drawingMode !== 'rectangle') return;
        isDown = false;

        // Ensure the rectangle is selectable after drawing
        rect.set({
            selectable: true,
            evented: true, // Ensure the rectangle can receive events
        });
        rect.setCoords(); // Update the rectangle's coordinates

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = rect;
        setDrawingMode(null);

        // Cleanup event listeners
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    // Attach event listeners
    canvas?.on('mouse:down', handleMouseDown);
    canvas?.on('mouse:move', handleMouseMove);
    canvas?.on('mouse:up', handleMouseUp);
}

function drawCustomShape() {
    var isDrawing = false;
    var path = [];
    var tempPath;

    function handleMouseDown(o) {
        if (drawingMode !== 'customShape') return;
        isDrawing = true;
        var pointer = canvas.getPointer(o.e);
        path = [['M', pointer.x, pointer.y]];
    }

    function handleMouseMove(o) {
        if (!isDrawing || drawingMode !== 'customShape') return;
        var pointer = canvas.getPointer(o.e);
        path.push(['L', pointer.x, pointer.y]);

        // Clear temporary path if it exists
        if (tempPath) {
            canvas.remove(tempPath);
        }

        // Create a new temporary path
        tempPath = new fabric.Path(path, {
            stroke: 'red',
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });

        canvas.add(tempPath);
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDrawing || drawingMode !== 'customShape') return;
        isDrawing = false;

        // Create the final path from the collected points
        var customShape = new fabric.Path(path, {
            stroke: 'red',
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 2,
            selectable: true,
            evented: true // Ensure the shape can receive events
        });

        canvas.add(customShape);
        if (tempPath) {
            canvas.remove(tempPath); // Remove the temporary path
        }

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = customShape;
        setDrawingMode(null);

        // Cleanup event listeners
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    // Attach event listeners
    canvas?.on('mouse:down', handleMouseDown);
    canvas?.on('mouse:move', handleMouseMove);
    canvas?.on('mouse:up', handleMouseUp);
}
//var deletedObjects = [];
//var imageUrls = new Map(); // Assuming you store image URLs in a Map with image object as the key
// Stacks to store history for undo and redo
var deletedObjects = [];
var undoStack = [];
var redoStack = [];

// Function to get the current state including annotations and table rows
function getCurrentState() {
    return {
        canvas: JSON.stringify(canvas.toJSON()),
        annotationMap: JSON.stringify(annotationMap),
        tableRows: table.innerHTML
    };
}

// Function to save the current state to the undo stack
function saveState() {
    undoStack.push(getCurrentState());
    redoStack = []; // Clear redo stack when a new action is performed
}

function deleteSelected() {
    var activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
        var deletedItems = {
            objects: [],
            annotations: {}
        };
        
        activeObjects.forEach(function(activeObject) {
            if (activeObject.type === 'image') {
                console.log('Skipped deletion of image:', activeObject);
                canvas.remove(activeObject);
            } else {
                var number = parseInt(activeObject.text?.text); // Use optional chaining to avoid errors
                
                // Store the object and its annotation before deleting
                deletedItems.objects.push({
                    object: activeObject,
                    number: number
                });

                if (annotationMap[number]) {
                    deletedItems.annotations[number] = annotationMap[number];
                }

                // Remove the shape object from the canvas
                canvas.remove(activeObject);

                // Handle annotations associated with the shape
                if (number && annotationMap[number]) {
                    removeAnnotationText(number);
                    deleteAnnotationText(number);
                    delete annotationMap[number];
                }
                deleteAnnotationRow(number);
            }
        });

        // Store the deleted items in the deletedObjects array
        deletedObjects.push(deletedItems);

        saveState(); // Save the current state

        canvas.discardActiveObject();
        canvas.renderAll();
    }
}


function undoDelete() {
    if (deletedObjects.length > 0) {
        var lastDeleted = deletedObjects.pop(); // Retrieve the last deleted items

        // Restore the objects to the canvas
        lastDeleted.objects.forEach(function(item) {
            canvas.add(item.object);
        });

        // Restore the annotations
        for (var number in lastDeleted.annotations) {
            var annotationData = lastDeleted.annotations[number];
            annotationMap[number] = annotationData;
            addAnnotationRow(number);
            addNumberLabel(number, annotationData);
        }

        // Re-sort the table if needed
        sortTable();

        canvas.renderAll();

        // Save the current state after undo
        saveState();
    } else {
        console.log('No objects to undo.');
    }
}

// Event listener for keydown
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'z') {
        undoDelete();
    } 
});
// Function to remove annotation text
function removeAnnotationText(number) {
    if (annotationMap[number] && annotationMap[number].text) {
        canvas.remove(annotationMap[number].text);
    }
}

function zoomIn() {
    var zoomLevel = canvas.getZoom();
    zoomLevel += 0.1;
    canvas.setZoom(zoomLevel);


}


// Function to zoom out
function zoomOut() {
    var zoomLevel = canvas.getZoom();
    zoomLevel -= 0.1;
    if (zoomLevel < 0.1) zoomLevel = 0.1;
    canvas.setZoom(zoomLevel);
}

// Function to lock/unlock a specific annotation shape
function lockShape(number, lock) {
    var shape = annotationMap[number];
    if (shape) {
        shape.selectable = !lock;
        shape.evented = !lock;
        canvas.renderAll();
    }
}

// Updated lockImages function to iterate over all annotation shapes
function lockImages(lock) {
    for (var number in annotationMap) {
        if (annotationMap.hasOwnProperty(number)) {
            lockShape(number, lock);
        }
    }
    images.forEach(img => {
        img.selectable = !lock;
        img.evented = !lock;
    });
    canvas.renderAll();
}


// Function to reset canvas event listeners based on drawing mode
function resetCanvasListeners() {
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    if (drawingMode === 'line') {
        drawLine();
    } else if (drawingMode === 'circle') {
        drawCircle();
    } else if (drawingMode === 'arrow') {
        drawArrow();
    } else if (drawingMode === 'rectangle') {
        drawRectangle();
    } else if (drawingMode === 'customShape') {
        drawCustomShape();
    }
}


function getLargestNumberTable(tableElement, largest) {
    var table = tableElement.querySelector('#annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table.rows[i]; i++) {
        var value = parseInt(row.cells[0].getElementsByTagName('input')[0].value);
        if (value > largest) {
            largest = value;
        }
    }
    return largest;
}
function getLargestNumber() {
    var tableActive = document.querySelector('.screen.active');
    let nxtPoint = tableActive;
    let prevPoint = tableActive;
    var largest = 0;
    while(prevPoint){
        if (prevPoint.tagName === 'DIV') {
            largest = getLargestNumberTable(prevPoint, largest);
        }
        prevPoint = prevPoint.previousElementSibling;
    }
    while(nxtPoint){
        if (nxtPoint.tagName === 'DIV') {
            largest = getLargestNumberTable(nxtPoint, largest);
        }
        nxtPoint = nxtPoint.nextElementSibling;
    }
    return largest;
}

// Function to add a new row in the annotation table
function addAnnotationRow(number) {
    var table = document.querySelector('.screen.active #annotationTable').getElementsByTagName('tbody')[0];
    var newRow = table?.insertRow();

    var cell1 = newRow.insertCell(0);
    var cell2 = newRow.insertCell(1);
    var cell3 = newRow.insertCell(2);
    var cell4 = newRow.insertCell(3);

    cell1.innerHTML = `<input type="number" id="annotationInput${number}" value="${number}" onchange="updateAnnotationNumber(${number}, this.value)">`;

    // Replace text input with select for 'Chất liệu'
    cell2.innerHTML = `
        <select id="material${number}">
            <option value="">Select Material</option>
            <option value="Metal">Metal</option>
            <option value="plastic">plastic</option>
            <option value="wood">wood</option>
            <option value="paper">paper</option>
            <option value="textile">textile</option>
            <option value="glass">glass</option>
        </select>
    `;

    // Replace text input with select for 'Màu sắc'
    cell3.innerHTML = `
        <select id="color${number}" onchange="updateAnnotationColor(${number}, this.value)">
            <option value="">Select Color</option>
            <option value="Red">Red</option>
            <option value="Blue">Blue</option>
            <option value="Green">Green</option>
            <option value="yellow">yellow</option>
            <option value="white">white</option>
            <option value="copper">copper</option>
            <option value="black">black</option>
            <option value="bing">bing</option>
            <option value="grey">grey</option>
            <option value="transparent">transparent</option>
            <option value="purple">purple</option>
            <option value="orange">orange</option>
            <option value="silver">silver</option>
        </select>
    `;
    //color: , green, , blue, , , , red, , , , , ,
    cell4.innerHTML = `<input type="text" id="description${number}" value="" onchange="updateAnnotationDescription(${number}, this.value)">`;

    sortTable(); // Sort the table after adding a new row
}


// Function to delete a row from the annotation table
function deleteAnnotationRow(number) {
    var table = document.querySelector('.screen.active #annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table?.rows[i]; i++) {
        if (parseInt(row.cells[0].getElementsByTagName('input')[0].value) === number) {
            table?.deleteRow(i);
            break;
        }
    }
}
// Function to update annotation number
function updateAnnotationNumber(oldNumber, newNumber) {
    canvas.discardActiveObject();
    
    // Convert newNumber to integer
    newNumber = parseInt(newNumber);

    // Check if newNumber already exists
    if (newNumber in annotationMap) {
        alert("Number already exists.");
        // Revert back to old number if new number already exists
        updateTableRowNumber(newNumber, oldNumber);
        // Sort the table again after reverting
        sortTable();
        return;
    }
    
    // Get the annotation object associated with oldNumber
    var annotation = annotationMap[oldNumber];
    // If annotation exists, update annotationMap and associated properties
    if (annotation) {
        annotationMap[newNumber] = annotation;
        delete annotationMap[oldNumber];
        // Update text on the canvas object
        var text = annotation.text;
        text.set({ text: String(newNumber) });
        canvas.renderAll();
    }
    // Update the table row number and sort the table
    updateTableRowNumber(oldNumber, newNumber);
    sortTable();
    // Update the onchange attribute to reflect the new number
    var inputElement = document.getElementById('annotationInput' + oldNumber);
    if (inputElement) {
        inputElement.setAttribute('onchange', `updateAnnotationNumber(${newNumber}, this.value)`);
        inputElement.id = 'annotationInput' + newNumber; // Update the ID as well
    }
}
var backgroundImage = null;
var isBackgroundSet = false;
// Function to toggle background image
function toggleBackground() {
    console.log('Toggle background called');
    if (backgroundImage) {
        // Remove background and add the background image back as an object
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        canvas.add(backgroundImage);
        imageObjects.push(backgroundImage);
        backgroundImage.set({ selectable: true, evented: true });
        backgroundImage = null;
        isBackgroundSet = false;
        console.log('Background removed. isBackgroundSet:', isBackgroundSet);
    } else if (imageObjects.length > 0) {
        // Set the last image as background
        const lastImage = imageObjects.pop();
        backgroundImage = lastImage;
        canvas.remove(lastImage);
        canvas.setBackgroundImage(lastImage, canvas.renderAll.bind(canvas));
        backgroundImage.set({ selectable: false, evented: false });
        isBackgroundSet = true;
        console.log('Background set. isBackgroundSet:', isBackgroundSet);
    } else {
        console.log('No image to toggle');
    }
    canvas.renderAll();
}
// Function to update annotation number in table row
function updateTableRowNumber(oldNumber, newNumber) {
    var table = document.querySelector('.screen.active #annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table?.rows[i]; i++) {
        if (parseInt(row.cells[0].getElementsByTagName('input')[0].value) === oldNumber) {
            row.cells[0].getElementsByTagName('input')[0].value = newNumber;
            break;
        }
    }
}
// Function to sort annotation table rows
function sortTable() {
    var table = document.querySelector('.screen.active #annotationTable').getElementsByTagName('tbody')[0];
    var rows = Array.from(table?.rows);
    rows.sort((a, b) => parseInt(a.cells[0].getElementsByTagName('input')[0].value) - parseInt(b.cells[0].getElementsByTagName('input')[0].value));
    rows.forEach(row => table?.appendChild(row));
}
// Function to add number label associated with an annotation object
// Assuming this code is executed after the canvas is properly initialized
function addNumberLabel(number, obj) {
    if (number === null || !obj) return;

    // Initialize Fabric.js canvas if it's not already initialized
    if (!window.canvas) {
        const parentScreen = screen.parentElement;
        const canvasElement = parentScreen.querySelector('.active #imageCanvas');
        window.canvas = canvasElement.fabricCanvas;
    }

    const canvas = window.canvas;

    // Function to get scaled font size based on zoom level
    function getScaledFontSize() {
        const zoomLevel = canvas.getZoom();
        return 24 / zoomLevel; // Adjust the base font size (24) as needed
    }

    // Calculate the position relative to the object
    var labelLeft = obj.left;
    var labelTop = obj.top - 20; // Adjust as needed

    var text = new fabric.Text(String(number), {
        left: labelLeft,
        top: labelTop,
        fontSize: getScaledFontSize(), // Set scaled font size
        fill: 'black', // Set text color to black
        selectable: false,
        evented: false
    });

    obj.text = text;
    canvas.add(text);
    canvas.bringToFront(text);
    // Optionally, bring the object to the front as well
    canvas.bringToFront(obj);
    canvas.renderAll();

    // Function to update the position and font size of the label text
    function updateNumberLabelPosition(obj) {
        if (!obj || !obj.text) return;

        // Calculate the new position of the label
        var labelLeft = obj.left;
        var labelTop = obj.top - 30; // Adjust as needed

        // Update the position and font size of the label text
        obj.text.set({
            left: labelLeft,
            top: labelTop,
            fontSize: getScaledFontSize() // Update font size based on zoom level
        });

        // Ensure the canvas updates the changes
        canvas.renderAll();
    }

    // Event listener to update label positions when an object is modified
    canvas.on('object:modified', function(e) {
        var modifiedObj = e.target;

        // Check if the object has a label text associated with it
        if (modifiedObj && modifiedObj.text) {
            updateNumberLabelPosition(modifiedObj);
        }
    });

    // Event listener to update label font size when zoom level changes
    canvas.on('zoom', function() {
        if (obj && obj.text) {
            updateNumberLabelPosition(obj);
        }
    });
}


// Function to remove rows without number column values and corresponding shapes with NaN labels
function removeEmptyRows() {
    var table = document.querySelector('.screen.active #annotationTable').getElementsByTagName('tbody')[0];
    
    for (var i = table?.rows.length - 1; i >= 0; i--) {
        var inputElement = table?.rows[i].cells[0].getElementsByTagName('input')[0];
        var value = parseInt(inputElement.value);
        
        if (isNaN(value)) {
            // Remove corresponding shape from canvas and its associated text label
            var shapeToRemove = annotationMap[value];
            if (shapeToRemove) {
                canvas.remove(shapeToRemove);
                delete annotationMap[value];
                deleteAnnotationText(shapeToRemove); // Delete associated text label
            }
            // Delete row from table regardless of NaN label
            table?.deleteRow(i);
        }
    }
    canvas.renderAll();
}

// Function to delete annotation text label associated with a shape
function deleteAnnotationText(shape) {
    if (shape.text) {
        canvas.remove(shape.text);
    }
}

// Initialize drawing functionalities
drawLine();
drawArrow();
drawCircle();
drawRectangle();
drawCustomShape();
function updateAnnotationDescription(number, description) {
    canvas.discardActiveObject();
    // Custom logic to handle description updates
    console.log(`Annotation ${number} description updated to: ${description}`);
}

function updateAnnotationColor(number, color) {
    canvas.discardActiveObject();
    // Custom logic to handle color updates
    console.log(`Annotation ${number} color updated to: ${color}`);
}
// Initialize history array

// Save state on every modification
canvas?.on('object:added', saveState);
canvas?.on('object:modified', saveState);
canvas?.on('object:removed', saveState);
const exportExcelButton = document.getElementById('exportExcel');
exportExcelButton.addEventListener('click', exportToExcel);

function exportToExcel() {
    console.log("Starting export to Excel...");

    // Get the filename from the input field
    const filenameInput = document.getElementById('excelFilename');
    let filename = filenameInput.value.trim();

    // Use a default filename if the input is empty
    if (!filename) {
        filename = 'annotations'; // Default filename
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Annotations and Canvas');

    // Add filename to the first row
    const titleRow = worksheet.getRow(1);
    titleRow.values = [filename]; // Set the filename in the first cell
    titleRow.font = { bold: true, size: 14 }; // Make the filename bold and larger font
    worksheet.mergeCells('A1:F1'); // Merge cells A1 to F1 for the title

    // Leave two empty rows (rows 2 and 3)

    // Add header to Excel starting from row 4
    const headerRow = worksheet.getRow(4);
    headerRow.values = ['Số thứ tự', 'Chất liệu', 'Màu sắc', 'Screen Number', 'Location', 'Thông tin mô tả']; // Column headers
    headerRow.font = { bold: true };

    // Apply yellow background to the header row
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF00' }, // Yellow color
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    // Set column widths
    worksheet.getColumn(1).width = 15; // Số thứ tự
    worksheet.getColumn(2).width = 30; // Chất liệu
    worksheet.getColumn(3).width = 30; // Màu sắc
    worksheet.getColumn(4).width = 20; // Screen Number
    worksheet.getColumn(5).width = 50; // Location (to fit the canvas image)
    worksheet.getColumn(6).width = 40; // Thông tin mô tả

    // Get all screens and iterate over them
    const screens = document.querySelectorAll('.screen');
    let currentRow = 5; // Start adding data from row 5

    screens.forEach((screen, screenIndex) => {
        const screenNumber = `No. ${screenIndex + 1}`; // Change "Screen Number" to "No. X" format

        // Get all canvases within the screen, not just the active one
        const canvases = screen.querySelectorAll('#imageCanvas');

        canvases.forEach((canvasElement) => {
            // Initialize Fabric.js canvas from canvas element if not initialized
            let fabricCanvas = canvasElement.fabricCanvas;
            if (!fabricCanvas) {
                fabricCanvas = new fabric.Canvas(canvasElement);
                canvasElement.fabricCanvas = fabricCanvas;
            }

            // Get the annotations table for this screen
            const rows = screen.querySelectorAll('.annotationTable tbody tr');
            const startRow = currentRow; // Keep track of the start row for merging

            rows.forEach(row => {
                try {
                    const numberInput = row.querySelector('input[type="number"]');
                    const materialSelect = row.querySelector('select[id^="material"]');
                    const colorSelect = row.querySelector('select[id^="color"]');
                    const descriptionInput = row.querySelector('input[type="text"]');

                    // Ensure all necessary elements are present
                    if (!numberInput || !materialSelect || !colorSelect || !descriptionInput) {
                        console.error("Error finding inputs in row:", row);
                        return;
                    }

                    const number = numberInput.value;
                    const material = materialSelect.value; // Get value from select for 'Chất liệu'
                    const color = colorSelect.value; // Get value from select for 'Màu sắc'
                    const description = descriptionInput.value; // Text input for 'Thông tin mô tả'

                    // New order: 'Số thứ tự', 'Chất liệu', 'Màu sắc', 'Screen Number', 'Location', 'Thông tin mô tả'
                    const rowData = [number, material, color, screenNumber, '', description]; // Leave Location empty for now
                    console.log("Adding row to Annotations sheet:", rowData);
                    const excelRow = worksheet.getRow(currentRow);
                    excelRow.values = rowData;

                    // Set border for each cell in the row, except the Location column
                    excelRow.eachCell((cell, colNumber) => {
                        if (colNumber !== 5) { // Skip column F (Location)
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        }
                    });

                    // Set row height for the data rows
                    excelRow.height = 40; // Adjust the row height as needed

                    currentRow++;
                } catch (error) {
                    console.error("Error processing row:", row, error);
                }
            });

            // Merge cells in the 'Screen Number' column for all rows of the same screen
            if (currentRow - startRow > 1) {
                worksheet.mergeCells(`D${startRow}:D${currentRow - 1}`); // Merge cells for the same screen number
            }

            // Apply blue color to the 'Screen Number' column
            worksheet.getCell(`D${startRow}`).font = { color: { argb: '0000FF' }, bold: true };

            // Merge cells in the 'Location' column to create a single cell for the image
            const totalRows = currentRow - 1; // Total number of rows occupied by the table
            worksheet.mergeCells(`E${startRow}:E${totalRows}`); // Merge cells from E<first row> to E<totalRows>

            // Add canvas image to Excel in the merged cell
            const canvasImage = canvasElement.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
            const imageId = workbook.addImage({
                base64: canvasImage,
                extension: 'png',
            });

            // Calculate the number of rows the table occupies and add the image to start from the first row of this screen
            const totalHeight = (totalRows - startRow + 1) * 40; // Adjust image height based on the number of rows
            const totalWidth = 16 / 9 * totalHeight; // Adjust image width as needed

            // Set the width of column E to fit the image
            worksheet.getColumn(5).width = totalWidth / 7; // Adjust this value as needed

            // Add the image to the merged cell (E<first row>:E<totalRows>)
            worksheet.addImage(imageId, {
                tl: { col: 4, row: startRow }, // Start at the top left of the merged cell E<first row>
                ext: { width: totalWidth, height: totalHeight } // Adjust dimensions based on the table size
            });

            console.log(`Adding canvas image for screen ${screenIndex + 1} to Excel`);
        });
    });

    console.log(`Saving workbook as ${filename}.xlsx...`);
    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("Export to Excel complete.");
    });
}
