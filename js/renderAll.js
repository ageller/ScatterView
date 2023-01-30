
function animate(time) {
	requestAnimationFrame( animate );
	update(time);
	render();
}

function update(time){
	keyboard.update();
	if ( keyboard.down("C") ) console.log(camera.position, camera.rotation)

	// control the time
	if ( keyboard.pressed("S") && keyboard.pressed("right") && params.timeYr < params.maxTime) {
		params.timeYr += params.timeStep;
		params.redraw();
	}
	if ( keyboard.pressed("S") && keyboard.pressed("left")  && params.timeYr > params.minTime) {
		params.timeYr -= params.timeStep;
		params.redraw();
	}
	if ( keyboard.pressed("S") && keyboard.down("A")  ) {
		params.timeStepFac *= 2;
		params.updateTimeStep();
	}
	if ( keyboard.pressed("S") && keyboard.down("D")  ) {
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
