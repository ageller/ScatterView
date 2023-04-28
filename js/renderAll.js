
function animate(time) {
	animateID = requestAnimationFrame( animate );
    update(time);
	render();
}

function update(time){
	keyboard.update();
	if ( keyboard.down("C") ) console.log(camera.position, camera.rotation)

	// control the time
	if ( keyboard.down("space")) params.play = !params.play;
	if ( keyboard.pressed("T") && keyboard.pressed("right") && params.timeYr < params.maxTime) {
		params.timeYr += params.timeStep;
		params.redraw();
	}
	if ( keyboard.pressed("T") && keyboard.pressed("left")  && params.timeYr > params.minTime) {
		params.timeYr -= params.timeStep;
		params.redraw();
	}
	if ( keyboard.pressed("T") && keyboard.down("up")  ) {
		params.timeStepFac *= 2;
		params.updateTimeStep();
	}
	if ( keyboard.pressed("T") && keyboard.down("down")  ) {
		params.timeStepFac /= 2;
		params.updateTimeStep();
	}

	params.updateTime();

	controls.update();
}


function render() {

	if (params.captureCanvas){
		var screenWidth = window.innerWidth;
		var screenHeight = window.innerHeight;
		var aspect = screenWidth / screenHeight;
		
        // render at the desired resolution and capture the frame
		params.renderer.setSize(params.captureWidth, params.captureHeight);
		camera.aspect = params.captureWidth / params.captureHeight;;
		camera.updateProjectionMatrix();
		params.renderer.render( scene, camera );
		capturer.capture( params.renderer.domElement );

        // then go back to the screen size
		params.renderer.setSize(screenWidth, screenHeight);
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		// params.renderer.render( scene, camera );

        // take care of the progress bar
        params.videoFrame += 1;
        d3.select('#progressFill').style('width', params.videoFrame/(params.videoDuration*params.videoFramerate)*100 + '%');

        if (params.videoFrame >= params.videoDuration*params.videoFramerate) endRecording();


	}

    params.renderer.render( scene, camera );

}


function endRecording(){
    
    // update the text in the progress bar
    d3.select('#progress').select('p').text('Rendering ...');
    d3.select('#progressFill').style('width', '100%');

    // save the video
    capturer.stop();
    var fmt = params.videoFormat;
    var ext = '.' + fmt;
    if (fmt != 'gif') ext = '.tar';
    capturer.save(function(blob){ 
        // this callback executes after the rendering is complete
        download(blob, params.filename + ext, fmt);

        //hide the progress indicator
        d3.select('#progress').style('display','none');
    });

    // reset
    params.captureCanvas = false;
    params.videoFrame = 0;
    d3.select(gui.__folders.Capture.__ul.childNodes[8]).select('.property-name').text('Start Video Recording');      

        
}