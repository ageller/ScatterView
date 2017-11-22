
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
	
	controls.update();
}


function render() {

	params.updateTime();

	params.renderer.render( scene, camera );

}
