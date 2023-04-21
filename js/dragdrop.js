// enable drag and drop of files into the browser window
function attachDragDrop(containerID = 'ContentContainer'){
    d3.select('#' + containerID)
        .on('drop', dropHandler)
        .on('dragover', dragOverHandler)
}

function dropHandler(){
    d3.event.preventDefault();
    if (d3.event.dataTransfer.items) {
        console.log('have dropped items');
        // Use DataTransferItemList interface to access the file(s)
        [...d3.event.dataTransfer.items].forEach(function(item, i){
          // If dropped items aren't files, reject them
          if (item.kind === "file") {
            const file = item.getAsFile();
            console.log(`file[${i}].name = ${file.name}`, item);
            var reader = new FileReader();
            reader.onload = function(event) {
                var partscsv = d3.csvParse(event.target.result);
                restartViewer(partscsv)
            };
            reader.readAsText(item.getAsFile())
          }
        });
      } else {
        console.log('have dropped files');
        // Use DataTransfer interface to access the file(s)
        [...d3.event.dataTransfer.files].forEach(function(file, i){
          console.log(`file[${i}].name = ${file.name}`);
        });
      }
}

function dragOverHandler(){
    d3.event.preventDefault();
}

function restartViewer(partscsv){

    cancelAnimationFrame(animateID);
    d3.select('#ContentContainer').html('');
    gui.destroy();

	// I need a way to (re)initialize all the global variables if a file is dropped into the browser
	// ideally I'd like to simply include all globals in the params object, but the code is already written to have both, 
	// so... I will simply make a way to re-initialize them here
	container = scene = camera = renderer = controls = effect = composer = capturer = parts = partsKeys = pointsMesh = paramsInit = params = animateID = null;
	keyboard = new KeyboardState();
	linesMesh = {};
	maxTime = 0;
	minTime = 1e10;
	gui = new dat.GUI({width:300});

    startPromisses(WebGLStart, window, partscsv)
}