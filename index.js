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
// Function to handle dragging
function handleCanvasDragging() {
    if (canvasDraggingEnabled) {
        // Enable dragging by adding event listeners

        canvas.on('mouse:down', function(o) {
            var pointer = canvas.getPointer(o.e);
            if (!canvas.findTarget(o.e)) {
                canvas.isDragging = true;
                canvas.selection = false; // Disable object selection temporarily
                canvas.lastPosX = pointer.x;
                canvas.lastPosY = pointer.y;
            }
        });

        canvas.on('mouse:move', function(o) {
            if (canvas.isDragging) {
                var pointer = canvas.getPointer(o.e);
                var zoomLevel = canvas.getZoom();
                var deltaX = (pointer.x - canvas.lastPosX) / zoomLevel;
                var deltaY = (pointer.y - canvas.lastPosY) / zoomLevel;
                var sensitivityFactor = 0.2;
                canvas.relativePan(new fabric.Point(deltaX * sensitivityFactor, deltaY * sensitivityFactor));

                canvas.lastPosX = pointer.x;
                canvas.lastPosY = pointer.y;
            }
        });

        canvas.on('mouse:up', function(o) {
            canvas.isDragging = false;
            canvas.selection = true; // Re-enable object selection
        });

    } else {
        // Disable dragging by removing event listeners
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
        canvas.isDragging = false;
    }
}

// Function to toggle dragging state
function toggleCanvasDragging() {
    canvasDraggingEnabled = !canvasDraggingEnabled;
    console.log(`Canvas dragging ${canvasDraggingEnabled ? 'enabled' : 'disabled'}`);
    handleCanvasDragging(); // Update event listeners based on the new state
}

// Function to reset and toggle canvas dragging
function moveblankcanvas() {
    toggleCanvasDragging(); // This toggles the dragging state (enables/disables)
}

// Optional: Keyboard shortcut for toggling canvas dragging
document.addEventListener('keydown', function(event) {
    if (event.key === 'k') {
        moveblankcanvas();
    }
});

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
        console.log("Copied object:", _clipboard); // Logs the copied object
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
    //console.log("Mouse Position:", lastMousePosition.y, lastMousePosition.x);
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
            // The head of the arrow is at the current mouse position
            var endX = lastMousePosition.x;
            var endY = lastMousePosition.y;

            // Calculate the start of the arrow based on a 45-degree angle and extend it backwards
            var angle = Math.PI / 4;  // 45 degrees in radians
            var length = 100 / zoomLevel;  // Length of the arrow

            var startX = endX - length * Math.cos(angle);  // Extend arrow start backward from head
            var startY = endY - length * Math.sin(angle);

            // Create the arrow line
            var arrow = new fabric.Line([startX, startY, endX, endY], {
                strokeWidth: 2 / zoomLevel,  // Adjust for zoom level
                fill: 'red',
                stroke: 'red',
                selectable: false,
                evented: false
            });

            var headLength = 10 / zoomLevel;  // Adjust arrowhead size for zoom

            // Arrowhead lines
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

function addAnnotationRow(number) {
    var table = document.querySelector('.screen.active #annotationTable').getElementsByTagName('tbody')[0];
    var newRow = table?.insertRow();

    var cell1 = newRow.insertCell(0);
    var cell2 = newRow.insertCell(1);
    var cell3 = newRow.insertCell(2);
    var cell4 = newRow.insertCell(3);

    cell1.innerHTML = `<input type="number" id="annotationInput${number}" value="${number}" onchange="updateAnnotationNumber(${number}, this.value)">`;

    // Material selection with multiple options
    cell2.innerHTML = `
        <select id="material${number}" multiple onchange="updateAnnotationMaterial(${number}, this)">
            <option value="Metal">Metal</option>
            <option value="plastic">Plastic</option>
            <option value="wood">Wood</option>
            <option value="paper">Paper</option>
            <option value="textile">Textile</option>
            <option value="glass">Glass</option>
        </select>
    `;

    // Color selection with multiple options
    cell3.innerHTML = `
        <select id="color${number}" multiple onchange="updateAnnotationColor(${number}, this)">
            <option value="Red">Red</option>
            <option value="Blue">Blue</option>
            <option value="Green">Green</option>
            <option value="Yellow">Yellow</option>
            <option value="White">White</option>
            <option value="Copper">Copper</option>
            <option value="Black">Black</option>
            <option value="Bing">Bing</option>
            <option value="Grey">Grey</option>
            <option value="Transparent">Transparent</option>
            <option value="Purple">Purple</option>
            <option value="Orange">Orange</option>
            <option value="Silver">Silver</option>
        </select>
    `;

    cell4.innerHTML = `<input type="text" id="description${number}" value="" onchange="updateAnnotationDescription(${number}, this.value)">`;

    // Initialize Select2 on the newly created <select> elements
    $('#material' + number).select2({
        placeholder: "Select materials",
        tags: true,  // Allows users to add new tags
        width: '100%'
    });
    
    
    $('#color' + number).select2({
        placeholder: "Select colors",
        tags: true, 
        width: '100%' // Ensures full width in the cell
    });

    sortTable(); // Sort the table after adding a new row
}



// Function to delete a row from the annotation table
function deleteAnnotationRow(number) {
  //  console.log("deleteAnnotationRow");
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
    
    // Convert newNumber to an integer
    newNumber = parseInt(newNumber);

    // If newNumber is invalid, stop execution
    if (isNaN(newNumber)) {
        alert("Invalid number. Please enter a valid integer.");
        return;
    }

    // Check if the new number already exists in annotationMap
    if (newNumber in annotationMap) {
        alert("Number already exists.");
        // Revert the table row number back to the old number if conflict occurs
        updateTableRowNumber(newNumber, oldNumber);
        sortTable();
        return;
    }

    // Get the annotation object associated with the old number
    var annotation = annotationMap[oldNumber];
    
    // Log the annotation and oldNumber for debugging
    console.log(`Updating annotation from ${oldNumber} to ${newNumber}`);
    console.log('Annotation:', annotation);

    // Ensure the annotation exists before proceeding
    if (annotation) {
        // Update the annotationMap with the new number
        annotationMap[newNumber] = annotation;
        delete annotationMap[oldNumber];

        // Access the textLabel property of the annotation
        var textLabel = annotation.textLabel; // Updated property

        // Check if textLabel is defined
        if (textLabel) {
            // Update the text label on the canvas object
            textLabel.set({ text: String(newNumber) }); // Use textLabel instead of text
            canvas.renderAll();
        } else {
            console.warn(`No textLabel property found for annotation with number ${oldNumber}.`);
        }
    } else {
        console.warn(`No annotation found for the number ${oldNumber}.`);
        return;
    }

    // Update the table row number from oldNumber to newNumber
    updateTableRowNumber(oldNumber, newNumber);
    sortTable();

    // Update the `onchange` event handler and the input element's ID to the new number
    var inputElement = document.getElementById('annotationInput' + oldNumber);
    if (inputElement) {
        inputElement.setAttribute('onchange', `updateAnnotationNumber(${newNumber}, this.value)`);
        inputElement.id = 'annotationInput' + newNumber; // Update the input element ID
    } else {
        console.warn(`Input element not found for old number ${oldNumber}.`);
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
    const zoomLevel = canvas.getZoom();
    // Calculate the position relative to the object
    var labelLeft = obj.left - (60/zoomLevel);
    var labelTop = obj.top - (20/zoomLevel); // Adjust as needed

    var text = new fabric.Text(String(number), {
        left: labelLeft,
        top: labelTop,
        fontSize: getScaledFontSize(), // Set scaled font size
        fill: 'black', // Set text color to black
        selectable: true, // Allow the label to be selected and moved
        evented: true // Enable interaction with the text object
    });

    // Store reference to the text label and number in the object
    obj.textLabel = text;
    obj.number = number; // Store the number in the object for easy access
    canvas.add(text);
    canvas.bringToFront(text);
    canvas.bringToFront(obj);
    canvas.renderAll();

    // Function to update the label text position and font size
    function updateNumberLabelPosition(obj) {
        if (!obj || !obj.textLabel) return; // Ensure textLabel exists

        // Calculate the new position for the label
        var labelLeft = obj.left - (60/zoomLevel);
        var labelTop = obj.top -  (20/zoomLevel);

        // Update the label's position and font size
        obj.textLabel.set({
            left: labelLeft,
            top: labelTop,
            fontSize: getScaledFontSize() // Adjust font size based on zoom
        });

        // Re-render the canvas
        canvas.renderAll();
    }

    // Listen for object modification and update label position accordingly
    canvas.on('object:modified', function (e) {
        var modifiedObj = e.target;

        // If the modified object has a text label, update its position
        if (modifiedObj && modifiedObj.textLabel) {
            updateNumberLabelPosition(modifiedObj);
        }
    });

    // Update label font size and position when zoom changes
    canvas.on('zoom', function () {
        if (obj && obj.textLabel) {
            updateNumberLabelPosition(obj);
        }
    });

    // Optional: Allow the user to move the label independently
    text.on('moving', function () {
        // Keep the label's position updated when it's moved
        canvas.renderAll();
    });

    // Listen for object removal and trigger the removal of both label and row
    canvas.on('object:removed', function (e) {
        var removedObj = e.target;

        // Call the new function to remove both the label and the table row
        if (removedObj && removedObj.number !== undefined) {
            removeLabelAndRow(removedObj.number);
        }
    });
}

// New function to remove the label from canvas and the corresponding row from the table
function removeLabelAndRow(number) {
    const canvas = window.canvas;

    // Find and remove the text label from the canvas
    const objects = canvas.getObjects();
    const textObject = objects.find(obj => obj.text === String(number));

    if (textObject) {
        canvas.remove(textObject);
    }

    // Find and remove the row in the table that matches the number
    var table = document.querySelector('.screen.active #annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table?.rows[i]; i++) {
        if (parseInt(row.cells[0].getElementsByTagName('input')[0].value) === number) {
            table?.deleteRow(i);
            break;
        }
    }

    // Re-render the canvas after removal
    canvas.renderAll();
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

function updateAnnotationMaterial(number, selectElement) {
    const selectedMaterials = Array.from(selectElement.selectedOptions).map(option => option.value);
    console.log(`Annotation ${number} materials updated to: ${selectedMaterials.join(', ')}`);
}

function updateAnnotationColor(number, selectElement) {
    const selectedColors = Array.from(selectElement.selectedOptions).map(option => option.value);
    console.log(`Annotation ${number} colors updated to: ${selectedColors.join(', ')}`);
}

// Initialize history array

// Save state on every modification
canvas?.on('object:added', saveState);
canvas?.on('object:modified', saveState);
canvas?.on('object:removed', saveState);
const exportExcelButton = document.getElementById('exportExcel');
exportExcelButton.addEventListener('click', async () => {
    try {
        await exportToExcel();
    } catch (error) {
        console.error("Error exporting to Excel:", error);
    }
});

async function exportToExcel() {
    console.log("Starting export to Excel...");
    
    const filenameInput = document.getElementById('excelFilename');
    let filename = filenameInput.value.trim();

    // Case 1: Filename provided - create a new file
    if (filename) {
        await createNewExcelFile(filename);
    } 
    // Case 2: No filename provided - ask the user if they want to append or create a new file
    else {
        const userChoice = confirm("No filename provided. Do you want to append to an existing file (OK) or create a new file (Cancel)?");
        if (userChoice) {
            // If user chooses to append, open file picker to select an existing file
            await appendToExistingExcel();
        } else {
            // Otherwise, create a new file with a default name
            filename = 'annotations';
            await createNewExcelFile(filename);
        }
    }
}

// Create a new Excel file
async function createNewExcelFile(filename) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Annotations and Canvas');
    
    const titleRow = worksheet.getRow(1);
    titleRow.values = [filename];
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:F1');

    const headerRow = worksheet.getRow(4);
    headerRow.values = ['No.', 'Material', 'Color', 'Re mask', 'Location', 'Description'];
    headerRow.font = { bold: true };

    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF00' },
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 80;

    appendDataToWorksheet(workbook);

    console.log(`Saving new workbook as ${filename}.xlsx...`);
    await saveWorkbookAsFile(workbook, filename);
}

// Append data to an existing Excel file
async function appendToExistingExcel() {
    try {
        // Open file picker to select the existing Excel file
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'Excel Files',
                accept: {
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                }
            }]
        });

        const fileData = await fileHandle.getFile();
        const arrayBuffer = await fileData.arrayBuffer();
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer); // Load the existing workbook

        appendDataToWorksheet(workbook);

        const filename = fileHandle.name.replace('.xlsx', '');
        console.log(`Appending to workbook: ${filename}.xlsx`);
        await saveWorkbookAsFile(workbook, filename);
    } catch (error) {
        console.error("Error opening file:", error);
    }
}

// Save the workbook to a file
async function saveWorkbookAsFile(workbook, filename) {
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

function appendDataToWorksheet(workbook) {
    const worksheet = workbook.getWorksheet('Annotations and Canvas') || workbook.addWorksheet('Annotations and Canvas');

    const screens = document.querySelectorAll('.screen');
    let currentRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 5;
    let maxCanvasWidth = 200;

    screens.forEach((screen, screenIndex) => {
        const canvases = screen.querySelectorAll('#imageCanvas');

        canvases.forEach((canvasElement) => {
            let fabricCanvas = canvasElement.fabricCanvas;
            if (!fabricCanvas) {
                fabricCanvas = new fabric.Canvas(canvasElement);
                canvasElement.fabricCanvas = fabricCanvas;
            }

            const rows = screen.querySelectorAll('.annotationTable tbody tr');
            const startRow = currentRow;

            rows.forEach(row => {
                try {
                    const numberInput = row.querySelector('input[type="number"]');
                    const materialSelect = row.querySelector('select[id^="material"]');
                    const colorSelect = row.querySelector('select[id^="color"]');
                    const descriptionInput = row.querySelector('input[type="text"]');

                    if (!numberInput || !materialSelect || !colorSelect || !descriptionInput) {
                        console.error("Error finding inputs in row:", row);
                        return;
                    }

                    const number = numberInput.value;
                    const selectedMaterials = Array.from(materialSelect.selectedOptions).map(option => option.value).join('/');
                    const selectedColors = Array.from(colorSelect.selectedOptions).map(option => option.value).join('/');
                    const description = descriptionInput.value;

                    // Determine new "No." value based on existing values in column D
                    let reMaskValue = `No. ${number}`;
                    let existingRows = worksheet.getColumn(4).values; // Get values of column D (Re mask)

                    // Count how many times the reMaskValue appears in column D
                    let count = 0;
                    existingRows.forEach((cellValue, index) => {
                        if (cellValue === reMaskValue) {
                            count++;
                        }
                    });

                    // Update reMaskValue if there are existing entries
                    if (count > 0) {
                        reMaskValue = `No. ${parseInt(number) + screenIndex + 1}`; // Increment the number based on existing entries
                    }

                    const rowData = [number, selectedMaterials, selectedColors, reMaskValue, '', description];
                    console.log("Adding row to Annotations sheet:", rowData);
                    const excelRow = worksheet.getRow(currentRow);
                    excelRow.values = rowData;

                    excelRow.eachCell((cell, colNumber) => {
                        if (colNumber === 6) { // Description column
                            cell.font = { color: { argb: '0000FF' }, bold: false };
                        }
                        if (colNumber !== 5) {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        }
                    });

                    excelRow.height = 80;
                    currentRow++;
                } catch (error) {
                    console.error("Error processing row:", row, error);
                }
            });

            if (currentRow - startRow > 1) {
                worksheet.mergeCells(`D${startRow}:D${currentRow - 1}`);
            }
            worksheet.getCell(`D${startRow}`).font = { color: { argb: '0000FF' }, bold: true };
            worksheet.mergeCells(`E${startRow}:E${currentRow - 1}`);

            const originalWidth = canvasElement.width;
            const originalHeight = canvasElement.height;
            const aspectRatio = originalWidth / originalHeight;
            const totalHeight = (currentRow - startRow) * 80;
            let totalWidth = aspectRatio * totalHeight;

            if (totalWidth < totalHeight) {
                totalWidth = totalHeight;
            }

            const canvasWidthInPoints = totalWidth / 7;
            if (canvasWidthInPoints > maxCanvasWidth) {
                maxCanvasWidth = canvasWidthInPoints;
            }

            const canvasImage = canvasElement.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
            const imageId = workbook.addImage({
                base64: canvasImage,
                extension: 'png',
            });
            worksheet.addImage(imageId, {
                tl: { col: 4, row: startRow - 1 },
                ext: { width: totalWidth, height: totalHeight }
            });

            console.log(`Adding canvas image for screen ${screenIndex + 1} to Excel`);
        });
    });

    worksheet.getColumn(5).width = maxCanvasWidth;
}
