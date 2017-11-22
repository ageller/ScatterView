//all global variables

var container, scene, MWscene, MWInnerScene, camera, renderer, controls, effect;
var keyboard = new KeyboardState();

var parts = null;
var partsKeys;
var partsMesh = {};

var loaded = false;

var maxTime = 0;

//defined in WebGLStart, after data is loaded
var ParamsInit;
var params;

var gui = new dat.GUI({width:300});


function init() {
	// scene
	scene = new THREE.Scene();

	// camera
	var screenWidth = window.innerWidth;
	var screenHeight = window.innerHeight;
	var fov = 45;
	var aspect = screenWidth / screenHeight;
	var zmin = 1.;
	var zmax = 5.e10;
	camera = new THREE.PerspectiveCamera( fov, aspect, zmin, zmax);
	scene.add(camera);

	camera.position.set(0,0,-10);

	camera.lookAt(scene.position);	

	var dist = scene.position.distanceTo(camera.position);
	var vFOV = THREE.Math.degToRad( camera.fov ); // convert vertical fov to radians


	// renderer
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(screenWidth, screenHeight);
	container = document.getElementById('ContentContainer');
	container.appendChild( renderer.domElement );

	// events
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

	// controls
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.dynamicDampingFactor = params.friction;
 	controls.zoomSpeed = params.zoomSpeed;

	//stereo
	effect = new THREE.StereoEffect( renderer );
	effect.setAspect(1.);
	effect.setEyeSeparation(params.stereoSep);


	//renderer.autoClear = false;
	effect.autoClear = false;
	params.renderer = renderer;

	camera.up.set(0, -1, 0);

}


function defineParams(){

    ParamsInit = function() {


    	this.timeYr = 0.;
    	this.maxTime = maxTime;
        this.timeStepUnit = 0.;
        this.timeStepFac = 1.;
        this.timeStep = parseFloat(this.timeStepUnit)*parseFloat(this.timeStepFac);

    	this.lineAlpha = 1.;
    	this.lineWidth = 0.001;
    	this.lineLengthYr = this.maxTime/10.;
    	this.pointsSize = 10.;
    	this.pointsAlpha = 1.;

	    this.renderer = null;
	    this.stereo = false;
	    this.friction = 0.2;
	    this.zoomSpeed = 1.;
	    this.stereoSep = 0.064;

	    this.redraw = function() {
	    	params.timeYr = parseFloat(params.timeYr);
    		clearPartsMesh();
    		if (params.timeYr > 0) drawParts();
	    }

	    this.updateTime = function() {
	    	if (params.timeStep > 0 && params.timeYr < params.maxTime){
	    		params.timeYr += params.timeStep;

	    		params.redraw();
	    	}
	    }

	    this.updateColors = function() {
	    	partsKeys.forEach( function(p,i) {
	    		params[p+"ColorUse"] = new THREE.Color(params[p+"Color"][0]/255., params[p+"Color"][1]/255., params[p+"Color"][2]/255.);
	    	});
	    	params.redraw();
	    }

	    this.updateTimeStep = function() {
	    	params.timeStep = parseFloat(params.timeStepUnit)*parseFloat(params.timeStepFac);
	    }

	    this.fullscreen = function() { 
	    	THREEx.FullScreen.request();
	    }

	    this.resetCamera = function() { 
	    	controls.reset();       
	    	camera.up.set(0, -1, 0);
	    }

		this.updateFriction = function() {
			controls.dynamicDampingFactor = params.friction;
			controls.update();
        }

        this.updateZoom = function() {
			controls.zoomSpeed = params.zoomSpeed;
			controls.update();
        }

        this.updateStereo = function() {
            if (params.stereo){
                effect.setEyeSeparation(params.stereoSep);
                params.renderer = effect;
            } else {
                renderer.setSize(window.innerWidth, window.innerHeight);
                params.renderer = renderer;
            }

        }
	}

    params = new ParamsInit();

	gui.remember(params);

	gui.add( params, 'timeYr', 0, params.maxTime).listen().onChange(params.redraw);
    gui.add( params, 'timeStepUnit', { "None": 0,  "Year": 1, "Million Years": 1e6, } ).onChange(params.updateTimeStep);
    gui.add( params, 'timeStepFac', 0, 1e4 ).onChange(params.updateTimeStep);

    gui.add( params, 'lineWidth', 0, 0.01).onChange( params.redraw );
    gui.add( params, 'lineLengthYr', 0, params.maxTime).onChange( params.redraw );
    gui.add( params, 'lineAlpha', 0, 1.).onChange( params.redraw );
    gui.add( params, 'pointsSize', 0, 100.).onChange( params.redraw );
    gui.add( params, 'pointsAlpha', 0, 1.).onChange( params.redraw );


	partsKeys.forEach( function(p,i) {
		params[p+"ColorUse"] = parts[p].color;
		params[p+"Color"] = [255.*parts[p].color.r, 255.*parts[p].color.g, 255.*parts[p].color.b];

		gui.addColor( params, p+"Color").onChange(params.updateColors);

	});
	console.log(params.colors)

    var cameraGUI = gui.addFolder('Camera');
    cameraGUI.add( params, 'fullscreen');
    cameraGUI.add( params, 'stereo').onChange(params.updateStereo);
    cameraGUI.add( params, 'stereoSep',0,1).onChange(params.updateStereo);
    cameraGUI.add( params, 'friction',0,1).onChange(params.updateFriction);
    cameraGUI.add( params, 'zoomSpeed',0.01,5).onChange(params.updateZoom);
}


function setMaxTime(tol = 0.1){
	var dt = 0.,
		dtSum = 0.,
		dtAve = 0.,
		dtAve0 = 0.,
		dtAveDiff = 0.;

    for (var i = 0; i< parts.time.length; i++){
    	if (i < parts.time.length - 1){
    		dt = parts.time[i+1] - parts.time[i];
    		dtSum += dt;
    		dtAve0 = dtAve;
    		dtAve = dtSum / i;
    		dtAveDiff = Math.abs(dtAve0 - dtAve)/dtAve0;
    	}

        if (parts.time[i] > maxTime && dtAveDiff < tol) maxTime = parts.time[i] - 0.01; 
        
        if (dtAveDiff > tol && maxTime > 0) break;
    }

}

function WebGLStart(){

    d3.json("data/ScatterParts.json",  function(partsjson) {
        parts = partsjson; 

	//initialize
		partsKeys = Object.keys(parts);
		partsKeys.pop("time")
		
		//random colors
		partsKeys.forEach( function(p,i) {
			parts[p].color = new THREE.Color(Math.random(), Math.random(), Math.random());
		})

		setMaxTime();
	    defineParams();
	    initInterps();
		init();

	//draw everything
		drawParts();

	//begin the animation
		animate();

	});

}

