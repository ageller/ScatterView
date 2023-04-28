// enable drag and drop of files into the browser window
//https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
//https://www.javascripture.com/DataTransferItem
function attachDragDrop(containerID = 'ContentContainer'){
    d3.select('#' + containerID)
        .on('drop', dropHandler)
        .on('dragover', dragOverHandler)
        .on('dragenter', dragEnterHandler)
        .on('dragleave', dragLeaveHandler)
}

function dropHandler(){
    d3.select('#ContentContainer').style('opacity',1)

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
            console.log('parsing data...')
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

function dragEnterHandler(){
    d3.select('#ContentContainer').transition().duration(100).style('opacity',0.7)
}
function dragLeaveHandler(){
    d3.select('#ContentContainer').transition().duration(100).style('opacity',1)
}

function restartViewer(partscsv){
    console.log('restarting viewer...')

    d3.select('#progressFill').style('width', '0%');
    d3.select('#progress').select('p').text('Loading ...');
    d3.select('#progress').style('display','block')

    // destroy the GUI
    // remove all objects from the scene
    // stop the animation
    cancelAnimationFrame(animateID);
    gui.destroy();
    d3.select('#contentContainer').html("")

    // reinitialize some global variables (other initialized in init function)
    params = parts = partsKeys = null;
    dataProcessed = false;
    maxTime = 0;
    minTime = 1e10;

    console.log('starting promises...');
    loadSystem(WebGLStart, window, partscsv)
    
}

attachDragDrop();
