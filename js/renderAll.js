
function animate(time) {
	requestAnimationFrame( animate );
	update(time);
	render();
}

function update(time){
	keyboard.update();
	if ( keyboard.down("C") ) console.log(camera.position, camera.rotation)

	// control the time
	if  (keyboard.down("space")) params.play = !params.play;
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


	params.renderer.render( scene, camera );

	if (params.captureCanvas){
		var screenWidth = window.innerWidth;
		var screenHeight = window.innerHeight;
		var aspect = screenWidth / screenHeight;
		
		params.renderer.setSize(params.captureWidth, params.captureHeight);
		camera.aspect = params.captureWidth / params.captureHeight;;
		camera.updateProjectionMatrix();
		params.renderer.render( scene, camera );

		capturer.capture( params.renderer.domElement );

		params.renderer.setSize(screenWidth, screenHeight);
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		params.renderer.render( scene, camera );
	}
}
