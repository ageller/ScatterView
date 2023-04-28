//all global variables

var container, scene, camera, renderer, controls, effect, composer, capturer, keyboard, parts, partsKeys, pointsMesh, params, gui, animateID, linesMesh;

var dataProcessed = false;

var maxTime = 0;
var minTime = 1e10;

var fov = 45;
var zmin = 1e-5;
var zmax = 5.e5;


function init(canvas) {

    // initialize global variables
    container = scene = camera = renderer = controls = effect = composer = capturer = pointsMesh = animateID = null;
    linesMesh = {};

    d3.select('#ContentContainer').html('');

	// scene
	scene = new THREE.Scene();

	// camera
	var screenWidth = canvas.innerWidth;
	var screenHeight = canvas.innerHeight;
	var aspect = screenWidth / screenHeight;
	camera = new THREE.PerspectiveCamera( fov, aspect, zmin, zmax);
	scene.add(camera);

    // get an estimate of the best initial distance for the camera
    var points0 = getPointsParams(minTime);
    var maxD = 0;
    for (var i=0; i<points0.positions.length; i+=3){
        var dist = Math.sqrt(
            Math.pow(points0.positions[i],2) + 
            Math.pow(points0.positions[i + 1],2) + 
            Math.pow(points0.positions[i + 2],2))
        maxD = Math.max(dist, maxD);
    }
	camera.position.set(0,0,-5*maxD);

	camera.lookAt(scene.position);	

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

        keyboard = new KeyboardState();

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

    //draw/initialize everything
	initPointsMesh();
	initLineMesh();
}


function defineParams(){

    var ParamsInit = function() {


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
		this.pointsSize = 10.;
		this.pointsAlpha = 1.;
		this.pointsNow;
		this.pointsPrev;
		this.prevCount = {};

		this.renderer = null;
		this.stereo = false;
		this.friction = 0.2;
		this.zoomSpeed = 1.;
		this.rotateSpeed = 1.;
		this.panSpeed = 0.3;
		this.stereoSep = 0.064;
		this.filename = "test";
		this.captureWidth = 1024;
		this.captureHeight = 1024;
		this.captureCanvas = false;
		this.videoFramerate = 30;
		this.videoDuration = 2;
		this.videoFormat = 'png';
        this.videoFrame = 0;

	    this.screenshot = function(){
			var imgData, imgNode;
    		var strDownloadMime = "image/octet-stream";
			var strMime = "image/png";
			var screenWidth = window.innerWidth;
			var screenHeight = window.innerHeight;
			var aspect = screenWidth / screenHeight


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

            if (params.captureCanvas){
                // stop the recording
                params.videoFrame = params.videoDuration*params.videoFramerate

            } else {
                // start the recording

                // change the name of the GUI
                d3.select(gui.__folders.Capture.__ul.childNodes[8]).select('.property-name').text('Stop Video Recording');      


                // I want to create another progress bar
                // I solved this in Firefly (with much code!)
                // Firefly has a circle, but here I think I'd prefer a simple bar at the bottom (like our loading bar)
                // maybe I should rename the loading bar to a progress bar and just use it here as well
                // then I could have the text change in JS (Loading... vs. Recording...)
                // see Firefly renderLoop.js and applyUISelections.js for recordingCircle

                //initialize the progress bar
                d3.select('#progressFill').style('width', '0%');
                d3.select('#progress').select('p').text('Capturing ...');
                d3.select('#progress').style('display', 'block');

                params.captureCanvas = true;
                params.videoFrame = 0;
                capturer = new CCapture( { 
                    format: params.videoFormat, 
                    workersPath: 'resources/CCapture/',
                    verbose: false,
                    // framerate: params.videoFramerate,
                    // name: params.filename,
                    // timeLimit: params.videoDuration,
                    // autoSaveTime: params.videoDuration,
                } );

                capturer.start();
            }

		}

		this.updateLine = function(){
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
    gui = new dat.GUI({width:300});
	if ( Detector.webgl ) {
		gui.remember(params);

		var timeGUI = gui.addFolder('Time controls');
		timeGUI.add( params, 'timeYr', params.minTime, params.maxTime).name("Time (yr)").listen().onChange(params.redraw);
		timeGUI.add( params, 'timeStepUnit', {"Hour": 1./8760., "Day": 1./365.24, "Year": 1, "Million Years": 1e6, } ).name("Time Step Unit").onChange(params.updateTimeStep);
		timeGUI.add( params, 'timeStepFac', 0, 1e4 ).name("Time Step Amount").listen().onChange(params.updateTimeStep);
		timeGUI.add( params, 'play').name("Play").listen();

		var pointLineGUI = gui.addFolder('Points and Lines');
		pointLineGUI.add( params, 'lineWidth', 1, 10).name("Line Width").onChange( params.redraw );
		params.lineGUI = pointLineGUI.add( params, 'lineLengthYr', 0, params.maxTime - params.minTime).name("Line Length (yr)").onChange( params.updateLine );
		pointLineGUI.add( params, 'lineAlpha', 0, 1.).name("Line Opacity").onChange( params.redraw );
		// pointLineGUI.add( params, 'pointsSize', 0, 100.).onChange( params.redraw );
		pointLineGUI.add( params, 'pointsAlpha', 0, 1.).name("Points Opacity").onChange( params.redraw );
		partsKeys.forEach( function(p,i) {
			params[p+"PointSize"] = params.pointsSize;
			pointLineGUI.add( params, p+"PointSize", 0, 100).name(p + " Point Size").onChange(params.redraw);
		});

		var colorGUI = gui.addFolder('Colors');
		partsKeys.forEach( function(p,i) {
			params[p+"ColorUse"] = parts[p].color;
			params[p+"Color"] = [255.*parts[p].color.r, 255.*parts[p].color.g, 255.*parts[p].color.b];

			colorGUI.addColor( params, p+"Color").name(p + " Color").onChange(function(){params.updateColor(p)});

		});

		var captureGUI = gui.addFolder('Capture');
		captureGUI.add( params, 'filename').name("File Name");
		captureGUI.add( params, 'captureWidth').name("Capture Width (px)");
		captureGUI.add( params, 'captureHeight').name("Capture Height (px)");
		captureGUI.add( params, 'videoDuration').name("Video Duration (s)");
		captureGUI.add( params, 'videoFramerate').name("Video Framerate (fps)");
		captureGUI.add( params, 'videoFormat', {"gif":"gif", "jpg":"jpg", "png":"png"} ).name("Video Format")
		captureGUI.add( params, 'screenshot').name("Take Screenshot");
		captureGUI.add( params, 'recordVideo').name("Start Recording Video");

		var cameraGUI = gui.addFolder('Camera');
		cameraGUI.add( params, 'fullscreen').name("Fullscreen");
		cameraGUI.add( params, 'stereo').name("Stereo").onChange(params.updateStereo);
		cameraGUI.add( params, 'stereoSep',0,1).name("Stereo Separation").onChange(params.updateStereo);
		cameraGUI.add( params, 'friction',0,1).name("Friction").onChange(params.updateFriction);
		cameraGUI.add( params, 'zoomSpeed',0.01,3).name("Soom Speed").onChange(params.updateZoom);
		cameraGUI.add( params, 'rotateSpeed',0.01,3).name("Rotation Speed").onChange(params.updateRotate);
		cameraGUI.add( params, 'panSpeed',0.01,3).name("Pan Speed").onChange(params.updatePan);
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
	if (x == undefined || x == null || x == NaN || !isFinite(x) || x == "null" || x == "NaN" || x == "nan") return true;
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


function processData(inputData){
    console.log('processing data ...')
    dataProcessed = false;
	parts = {};
		
    // for the loader
	var dataSize = inputData.length - 1;

    // reorganize
	// get the times and particle names and positions
	times = [];
	partsKeys = [];

    // try loading data in chunks so that we can get a progress bar to update!
    var linesPerChunk = 500.; // some guess to what will make the loading bar look smooth
    var chunks = Math.ceil(inputData.length/linesPerChunk);

    for (var j = 0; j < chunks; j += 1){
        (function(j){
            setTimeout(function(){
                for (var k = 0; k < linesPerChunk; k += 1){
                    var i = j*linesPerChunk + k;
                    var d = inputData[i];
                    if (d){
                        if (!times.includes(+d.time)) times.push(+d.time);
                        if (!partsKeys.includes(d.ID)) {
                            partsKeys.push(d.ID);
                            parts[d.ID] = {};
                            parts[d.ID].r = [];
                        }
                        parts[d.ID].r.push([d.x, d.y, d.z]);
                    }

                    // update the loader
                    if (k == linesPerChunk - 1)  d3.select('#progressFill').style('width', i/dataSize*100 + '%');

                    // finish data processing when at the end
                    if (i == dataSize) {
                        parts.time = times;
                        //random colors
                        partsKeys.forEach( function(p,i) {
                            parts[p].color = new THREE.Color(Math.random(), Math.random(), Math.random());
                        })
                        dataProcessed = true;
                    }
                }
            }, 100)
        }(j))
    }

}

function startPromises(callback, canvas){
    let step1 = new Promise(function(resolve, reject) {
        console.log('setting min max time ... ')
        setGlobalMinMaxTimeTolerance();
        resolve('done');
        reject('error');
    });
    let step2 = new Promise(function(resolve, reject) {
        console.log('defining params ...')
        defineParams();
        resolve('done');
        reject('error');
    });
    let step3 = new Promise(function(resolve, reject) {
        console.log('initializing interps ... ')
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
}

function loadSystem(callback, canvas, inputData){
	
    // processing data outside of promise so that I can have a loading progress bar!
    processData(inputData);
    var wait = setInterval(function(){
        if (dataProcessed){
            clearInterval(wait);
            startPromises(callback, canvas)
        }
    })


}

function loadDataFromFile(callback, canvas){

	d3.csv('data/ScatterParts.csv', function(partscsv){
		// file must have columns of ID, time, x,y,z 
		// (all other columns are ignored for now)
        loadSystem(callback, canvas, partscsv);
	})

}

function WebGLStart(canvas){
	console.log('starting WebGL...');

	d3.select('#progress').style('display','none');

	init(canvas);

//begin the animation
	animate();
}


// download a file
function saveFile(strData, filename){
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename + '.png';
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}

//////this will load the data, and then start the WebGL rendering
loadDataFromFile(WebGLStart, window);

