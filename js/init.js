//all global variables

var container, scene, camera, renderer, controls, effect, composer, capturer;
var keyboard = new KeyboardState();

var parts = null;
var partsKeys;
var pointsMesh;
var linesMesh = {};

var loaded = false;

var maxTime = 0;
var minTime = 1e10;

//defined in WebGLStart, after data is loaded
var ParamsInit;
var params;

var gui = new dat.GUI({width:300});

var fov = 45;
var zmin = 1.;
var zmax = 5.e10;

function init(canvas) {
	// scene
	scene = new THREE.Scene();

	// camera
	var screenWidth = canvas.innerWidth;
	var screenHeight = canvas.innerHeight;
	var aspect = screenWidth / screenHeight;
	camera = new THREE.PerspectiveCamera( fov, aspect, zmin, zmax);
	scene.add(camera);

	camera.position.set(0,0,-75);

	camera.lookAt(scene.position);	

	var dist = scene.position.distanceTo(camera.position);
	var vFOV = THREE.MathUtils.degToRad( camera.fov ); // convert vertical fov to radians


	// renderer
	if ( Detector.webgl ) { //for WebGL

		renderer = new THREE.WebGLRenderer({
			antialias:true,
			preserveDrawingBuffer: true , //so that we can save the image
		});

		container = document.getElementById('ContentContainer');
		container.appendChild( renderer.domElement );

		// events
		THREEx.WindowResize(renderer, camera);
		THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

		// controls
		controls = new THREE.TrackballControls( camera, renderer.domElement );
		controls.dynamicDampingFactor = params.friction;
		controls.zoomSpeed = params.zoomSpeed;
		controls.panSpeed = params.panSpeed;
		controls.rotateSpeed = params.rotateSpeed;

		//stereo
		effect = new THREE.StereoEffect( renderer );
		effect.setAspect(1.);
		effect.setEyeSeparation(params.stereoSep);


		//renderer.autoClear = false;
		effect.autoClear = false;
		params.renderer = renderer;

		//for video capture
		// composer = new THREE.EffectComposer(params.renderer);

	} else { //for Qt

		renderer = new THREE.Canvas3DRenderer({ 
			canvas: canvas, 
			antialias: true, 
			devicePixelRatio: canvas.devicePixelRatio 
		});
		//renderer = new THREE.CanvasRenderer(); 
	}

	renderer.setSize(screenWidth, screenHeight);


	camera.up.set(0, -1, 0);

//draw everything
	initPointsMesh();
	initLineMesh();
	// still need to initialize the line mesh
}


function defineParams(){

    ParamsInit = function() {


		this.timeYr = minTime;
		this.maxTime = maxTime;
		this.minTime = minTime;
		this.timeStepUnit = 1.;
		this.timeStepFac = (1.).toFixed(4);
		this.timeStep = parseFloat(this.timeStepUnit)*parseFloat(this.timeStepFac);
		this.play = false;

		this.partsMinTime = {};
		this.partsMaxTime = {};

		this.lineAlpha = 1.;
		this.lineWidth = 1;
		this.lineLengthYr = (this.maxTime - this.minTime)/this.timeStepUnit
		this.lineLength = this.lineLengthYr;
		this.pointsSize = 10.;
		this.pointsAlpha = 1.;

		this.renderer = null;
		this.stereo = false;
		this.friction = 0.2;
		this.zoomSpeed = 1.;
		this.rotateSpeed = 1.;
		this.panSpeed = 0.3;
		this.stereoSep = 0.064;
		this.filename = "test.png";
		this.captureWidth = 1024;
		this.captureHeight = 1024;
		this.captureCanvas = false;
		this.videoFramerate = 30;
		this.videoDuration = 2;
		this.videoFormat = 'png';

	    this.screenshot = function(){
			var imgData, imgNode;
    		var strDownloadMime = "image/octet-stream";
			var strMime = "image/png";
			var screenWidth = window.innerWidth;
			var screenHeight = window.innerHeight;
			var aspect = screenWidth / screenHeight;

			var saveFile = function (strData, filename) {
				var link = document.createElement('a');
				if (typeof link.download === 'string') {
					document.body.appendChild(link); //Firefox requires the link to be in the body
					link.download = filename;
					link.href = strData;
					link.click();
					document.body.removeChild(link); //remove the link when done
				} else {
					location.replace(uri);
				}
			}


			try {
				//resize
				params.renderer.setSize(params.captureWidth, params.captureHeight);
				camera.aspect = params.captureWidth / params.captureHeight;;
				camera.updateProjectionMatrix();
				params.renderer.render( scene, camera );

				//save image
				imgData = params.renderer.domElement.toDataURL(strMime);
				saveFile(imgData.replace(strMime, strDownloadMime), params.filename);

				//back to original size
				params.renderer.setSize(screenWidth, screenHeight);
				camera.aspect = aspect;
				camera.updateProjectionMatrix();
				params.renderer.render( scene, camera );

			} catch (e) {
				console.log(e);
				return;
			}

		}

		this.recordVideo = function(){

			params.captureCanvas = true;
			capturer = new CCapture( { 
				format: params.videoFormat, 
				workersPath: 'resources/CCapture/',
				framerate: params.videoFramerate,
				name: params.filename,
				timeLimit: params.videoDuration,
				autoSaveTime: params.videoDuration,
				verbose: true,
			} );

			capturer.start();

		}

		this.updateLine = function(){
			params.lineLengthYr = parseFloat(params.timeStepUnit)*parseFloat(params.lineLength);
			params.redraw();
		}

	    this.redraw = function() {
			// this is a misnomer, might be wise to update it to something like updateParticlePositions (but redraw is used a lot!)
	    	params.timeYr = parseFloat(params.timeYr);

			if (params.timeYr > 0) {
				updatePoints();
				updateLines();
			}
	    }

	    this.updateTime = function() {
	    	if (params.play && params.timeStep > 0 && params.timeYr < params.maxTime){
	    		params.timeYr += params.timeStep;

	    		params.redraw();
	    	}
	    }

	    this.updateColor = function(p) {
	    	params[p+"ColorUse"] = new THREE.Color(params[p+"Color"][0]/255., params[p+"Color"][1]/255., params[p+"Color"][2]/255.);
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

        this.updateRotate = function() {
			controls.rotateSpeed = params.rotateSpeed;
			controls.update();
        }

        this.updatePan = function() {
			controls.panSpeed = params.panSpeed;
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
	setParticleMinMaxTime();

	if ( Detector.webgl ) {
		gui.remember(params);

		var timeGUI = gui.addFolder('Time controls');
		timeGUI.add( params, 'timeYr', params.minTime, params.maxTime).listen().onChange(params.redraw);
		timeGUI.add( params, 'timeStepUnit', {"Hour": 1./8760., "Day": 1./365.24, "Year": 1, "Million Years": 1e6, } ).onChange(params.updateTimeStep);
		timeGUI.add( params, 'timeStepFac', 0, 1e4 ).listen().onChange(params.updateTimeStep);
		timeGUI.add( params, 'play').listen();

		var pointLineGUI = gui.addFolder('Points and Lines');
		pointLineGUI.add( params, 'lineWidth', 1, 10).onChange( params.redraw );
		params.lineGUI = pointLineGUI.add( params, 'lineLength', 0, params.maxTime - params.minTime).onChange( params.updateLine );
		pointLineGUI.add( params, 'lineAlpha', 0, 1.).onChange( params.redraw );
		// pointLineGUI.add( params, 'pointsSize', 0, 100.).onChange( params.redraw );
		pointLineGUI.add( params, 'pointsAlpha', 0, 1.).onChange( params.redraw );
		partsKeys.forEach( function(p,i) {
			params[p+"PointSize"] = params.pointsSize;
			pointLineGUI.add( params, p+"PointSize", 0, 100).onChange(params.redraw);
		});

		var colorGUI = gui.addFolder('Colors');
		partsKeys.forEach( function(p,i) {
			params[p+"ColorUse"] = parts[p].color;
			params[p+"Color"] = [255.*parts[p].color.r, 255.*parts[p].color.g, 255.*parts[p].color.b];

			colorGUI.addColor( params, p+"Color").onChange(function(){params.updateColor(p)});

		});

		var captureGUI = gui.addFolder('Capture');
		captureGUI.add( params, 'filename');
		captureGUI.add( params, 'captureWidth');
		captureGUI.add( params, 'captureHeight');
		captureGUI.add( params, 'videoDuration');
		captureGUI.add( params, 'videoFramerate');
		captureGUI.add( params, 'videoFormat', {"gif":"gif", "jpg":"jpg", "png":"png"} )
		captureGUI.add( params, 'screenshot');
		captureGUI.add( params, 'recordVideo');

		var cameraGUI = gui.addFolder('Camera');
		cameraGUI.add( params, 'fullscreen');
		cameraGUI.add( params, 'stereo').onChange(params.updateStereo);
		cameraGUI.add( params, 'stereoSep',0,1).onChange(params.updateStereo);
		cameraGUI.add( params, 'friction',0,1).onChange(params.updateFriction);
		cameraGUI.add( params, 'zoomSpeed',0.01,3).onChange(params.updateZoom);
		cameraGUI.add( params, 'rotateSpeed',0.01,3).onChange(params.updateRotate);
		cameraGUI.add( params, 'panSpeed',0.01,3).onChange(params.updatePan);
	}
}


function setGlobalMinMaxTime(){
	for (var i = 0; i< parts.time.length; i++){
		var checkTime = parts.time[i] - 1e-10;
		if (checkTime > maxTime) maxTime = checkTime;
		if (checkTime < minTime) minTime = checkTime;
	}
}

function checkNull(x){
	if (x == undefined || x == null || x == NaN || x == "null" || x == "NaN" || x == "nan") return true;
	return false;
}
function setParticleMinMaxTime(){
	// get min and max time for each particle (in case a particle disappears due to a collision)
	// this is needed to work with the line lengths using three-fatline
	partsKeys.forEach(function(p,i) {
		params.partsMaxTime[p] = -1e10;
		params.partsMinTime[p] = 1e10;

		parts[p].r.forEach(function(c, j) {
			if (!checkNull(c[0]) && !checkNull(c[1]) && !checkNull(c[2])){
				if (parts.time[j] > params.partsMaxTime[p] && parts.time[j] < params.maxTime) params.partsMaxTime[p] = parts.time[j];
				if (parts.time[j] < params.partsMinTime[p] && parts.time[j] > params.minTime) params.partsMinTime[p] = parts.time[j];
			}
		})
	})
}

// Fewbody jumps to very large times at the end.  This will fix that
function setGlobalMinMaxTimeTolerance(tol = 0.1, Nignore = 50){

	var dt = 0.,
		dtSum = 0.,
		dtAve = 1.e-10,
		dtAve0 = 1.e-10,
		dtAveDiff = 0.;

	minTime = parts.time[0];
	maxTime = parts.time[0];

    for (var i = 0; i< parts.time.length; i++){
    	if (i < parts.time.length - 1){
    		dt = parts.time[i+1] - parts.time[i];
    		dtSum += dt;
    		dtAve0 = dtAve;
    		dtAve = dtSum / i;
			if (dtAve0 > 0) dtAveDiff = Math.abs(dtAve0 - dtAve)/dtAve0;
    	}
        if (parts.time[i] > maxTime && dtAveDiff < tol) maxTime = parts.time[i] - 1e-10; 
        if (parts.time[i] < minTime && dtAveDiff < tol) minTime = parts.time[i] - 1e-10; 
        
        if (dtAveDiff > tol && maxTime > 0 && i > Nignore) break;
    }

}

function loadData(callback, canvas){
	var filename = "data/ScatterParts.json";

    d3.json(filename,  function(partsjson) {
    	//reorganize
    	parts = {};

    	times = Object.keys(partsjson);
    	pkeys = Object.keys(partsjson[times[0]]);
    	partsKeys = [];

		pkeys.forEach(function(k,i){
			if (k.substring(0,8) == "Particle"){
				partsKeys.push(k)
				parts[k] = {};
				Object.keys(partsjson[times[0]][k]).forEach(function(p,j){
					parts[k][p] = []
				});
			} else {
				parts[k] = [];
			}
		});
		parts.time = [];
		var foo;
		times.forEach(function(t,i){
			parts.time.push(parseFloat(t));
			if (t != ""){
				pkeys.forEach(function(k,j){
					if (partsKeys.includes(k)){
						Object.keys(parts[k]).forEach(function(p){
							parts[k][p].push(partsjson[t][k][p]);
						});
					} else {
						parts[k].push(partsjson[t][k])
					}
				});
			}
		});

		//random colors
		partsKeys.forEach( function(p,i) {
			parts[p].color = new THREE.Color(Math.random(), Math.random(), Math.random());
		})

		let step1 = new Promise(function(resolve, reject) {
			setGlobalMinMaxTimeTolerance();
			resolve('done');
			reject('error');
		});
		let step2 = new Promise(function(resolve, reject) {
			defineParams();
			resolve('done');
			reject('error');
		});
		let step3 = new Promise(function(resolve, reject) {
			initInterps();
			resolve('done');
			reject('error');
		});			
		
		step1.then(function(value){
			step2.then(function(value){
				step3.then(function(value){
					callback(canvas);
				},function(error){})
			},function(error){})
		},function(error){})

	});
}

function WebGLStart(canvas){

	init(canvas);

//begin the animation
	animate();
}

//////this will load the data, and then start the WebGL rendering
loadData(WebGLStart, window);

