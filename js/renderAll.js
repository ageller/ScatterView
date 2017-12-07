
function animate(time) {
	requestAnimationFrame( animate );
	update(time);
	render();
}

function update(time){
	keyboard.update();
	if ( keyboard.down("C") ) 
	{	  
		console.log(camera.position, camera.rotation)
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
