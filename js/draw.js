function initInterps(){
	var coord;
	partsKeys.forEach( function(p,i) {
		parts[p].CoordInterp = []

		for (var j=0; j<3; j++){
			coord = [];
			for (var i=0; i< parts[p].r.length; i++){
				coord.push(parts[p].r[i][j])
			}
			parts[p].CoordInterp.push( new THREE.LinearInterpolant(
			    new Float32Array(parts.time),
			    new Float32Array(coord),
			    1,
			    new Float32Array( 1 )
			));
		}
	});

    var foo = [];
    for (var i = 1; i <= parts.time.length; i++) {
        foo.push(i);
    }
    parts.iTimeInterp = new THREE.LinearInterpolant(
        new Float32Array(parts.time),
        new Float32Array(foo),
        1,
        new Float32Array( 1 )
    );
}

function getPointsParams(time){
	var p0 = [];
	var rgbaColors = [];
	var pointSize = [];
	partsKeys.forEach( function(p,i) {

		iTime = parts.iTimeInterp.evaluate(time)[0];
		// let's remember why we're comparing iTime to a length 
		// I think iTime is the index of the interpolated value
		// so I think this conditional is asking whether there are enough position elements in the array to do the necessary interpolation (below)??  This is probably only necessary for a special use case, but it's not hurting anything to keep it in.
		if (parts[p].r.length >= iTime){
		//add one additional vertex interpolated to the exact time
			for (var j=0; j<3; j++) p0.push(parts[p].CoordInterp[j].evaluate(time)[0]);
			
			rgbaColors.push(params[p+"ColorUse"].r);
			rgbaColors.push(params[p+"ColorUse"].g);
			rgbaColors.push(params[p+"ColorUse"].b);
			rgbaColors.push(1.);

			pointSize.push(params[p+"PointSize"]);
		}
	})	

	return {
		'positions': p0,
		'colors':rgbaColors,
		'size':pointSize
	}
}
function initPointsMesh(){

	// make the buffer geometry
	var geoP = new THREE.BufferGeometry();
	var points = getPointsParams(params.timeYr)

	// itemSize = 3 because there are 3 values (components) per vertex
	geoP.setAttribute( 'position', new THREE.BufferAttribute( Float32Array.from(points.positions), 3 ) );
	geoP.setAttribute( 'rgbaColor', new THREE.BufferAttribute( Float32Array.from(points.colors), 4 ) );
	geoP.setAttribute( 'pointSize', new THREE.BufferAttribute( Float32Array.from(points.size), 1 ) );

	const material = new THREE.ShaderMaterial( {
		uniforms: {
			alpha: {value: params.pointsAlpha},
		},

		vertexShader: myVertexShader,
		fragmentShader: myFragmentShader,
		depthWrite:false,
		depthTest: false,
		transparent:true,
		alphaTest: false,
	} );

	pointsMesh = new THREE.Points( geoP, material );
	pointsMesh.position.set(0,0,0);
	scene.add(pointsMesh);

}



function updatePoints(){

	if (params.pointsNow) params.pointsPrev = JSON.parse(JSON.stringify(params.pointsNow));
	params.pointsNow = getPointsParams(params.timeYr)

	// is there a way that we can update the attributes within the for loop above (rather than redefining here)?
	pointsMesh.geometry.attributes.position = new THREE.BufferAttribute( Float32Array.from(params.pointsNow.positions), 3 );
	pointsMesh.geometry.attributes.rgbaColor = new THREE.BufferAttribute( Float32Array.from(params.pointsNow.colors), 4 );
	pointsMesh.geometry.attributes.pointSize = new THREE.BufferAttribute( Float32Array.from(params.pointsNow.size), 1 );
	pointsMesh.material.uniforms.alpha.value = params.pointsAlpha;
}


function getLinesParams(p, time, lineLength = params.lineLengthYr){
	var positions = [];
	var cc = [];
	//add one additional vertex interpolated to the exact end of the tail
	if (time - lineLength > 0){
		for (var j=0; j<3; j++) cc[j] = parts[p].CoordInterp[j].evaluate(time - lineLength)[0];
		if (!checkNull(cc[0]) && !checkNull(cc[1]) && !checkNull(cc[2])) positions.push(cc[0], cc[1], cc[2]);
	}

	parts[p].r.forEach(function(c, j) {
		// three-fatline complains if there are null values passed
		if (!checkNull(c[0]) && !checkNull(c[1]) && !checkNull(c[2])){
			if (parts.time[j] <= time && parts.time[j] >= (time - lineLength)){
				positions.push(c[0], c[1], c[2])
			}
		}
	});

	cc = [];
	iTime = parts.iTimeInterp.evaluate(time)[0];
	if (parts[p].r.length >= iTime){
	//add one additional vertex interpolated to the exact time
		for (var j=0; j<3; j++) cc[j] = parts[p].CoordInterp[j].evaluate(time)[0];
		if (!checkNull(cc[0]) && !checkNull(cc[1]) && !checkNull(cc[2])) positions.push(cc[0], cc[1], cc[2]);
	};

	return positions;
}

function initLineMesh(){
	partsKeys.forEach(function(p,i) {

      	//geometry
		var geo = new THREE.LineGeometry();
		var positions = getLinesParams(p, params.maxTime, params.maxTime); //  give it the full line to start then cut back the end 

		geo.setPositions(positions);
		geo.instanceCount = (params.timeYr - params.partsMinTime[p])/(params.partsMaxTime[p] - params.partsMinTime[p])*geo._maxInstanceCount;

		matLine = new THREE.LineMaterial( {
			color: new THREE.Color("rgb(" + parseInt(params[p+"ColorUse"].r*255) +"," + parseInt(params[p+"ColorUse"].g*255) + "," + parseInt(params[p+"ColorUse"].b*255) + ")"),
			linewidth: params.lineWidth, 
			minInstanceIndex: 0., 
			resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // resolution of the viewport (very important to set! and will need to be updated if screen size changes)
			opacity: params.lineAlpha,
			transparent: true,
		} );

		line = new THREE.Line2( geo, matLine );

		linesMesh[p] = line;
		scene.add(line);

		// get the initial instanceStart and InstanceEnd values (is there a better way to do this?)
		linesMesh[p].instanceStart0 = [];
		linesMesh[p].instanceStartChanged = [];
		linesMesh[p].instanceEnd0 = [];
		linesMesh[p].instanceEndChanged = [];
		for (var i=0; i<positions.length - 3; i+=3) {
			linesMesh[p].instanceStart0.push([ positions[i], positions[i + 1], positions[i + 2] ]);
			linesMesh[p].instanceStartChanged.push(true);
			linesMesh[p].instanceEnd0.push([   positions[i + 3], positions[i + 4], positions[i + 5] ]);	
			linesMesh[p].instanceEndChanged.push(true);

		}
	});

}

function updateLines(){
	// some resources:
	//https://discourse.threejs.org/t/the-length-of-positions-of-linesegmentsgeometry-is-fixed-to-24/20375
	//https://discourse.threejs.org/t/out-of-control-memory-when-updating-position-of-lines-within-animate-function/33740
	//https://jsfiddle.net/prisoner849/h1tzc4jn/

	partsKeys.forEach(function(p,i) {


		linesMesh[p].material.visible = true;

		//this will change the length of the lines so that they go from t=0 to the point
		var count = Math.ceil((params.timeYr - params.partsMinTime[p])/(params.partsMaxTime[p] - params.partsMinTime[p])*linesMesh[p].geometry._maxInstanceCount);
		count = Math.max(0, count) + 1;

		linesMesh[p].geometry.instanceCount = count;
		if (count > 0){
			linesMesh[p].geometry.attributes.instanceEnd.setXYZ(
				count - 1,
				params.pointsNow.positions[i*3],
				params.pointsNow.positions[i*3 + 1],
				params.pointsNow.positions[i*3 + 2]
			);
			linesMesh[p].geometry.attributes.instanceEnd.needsUpdate = true;
			linesMesh[p].instanceEndChanged[count - 1] = true;

		}

		// if the user moves the time too quickly, then instanceEnd won't reach the actual points.  So we need to reset them
		// we really only need to do this if the value has changed, but I don't think this will change the speed
		if (count != params.prevCount[p] ){
			for (var j = 1; j < count - 1; j += 1){
				if (linesMesh[p].instanceEndChanged[j] && linesMesh[p].instanceEnd0[j]){
					linesMesh[p].geometry.attributes.instanceEnd.setXYZ(
						j, 
						linesMesh[p].instanceEnd0[j][0], 
						linesMesh[p].instanceEnd0[j][1], 
						linesMesh[p].instanceEnd0[j][2]
					);
					linesMesh[p].instanceEndChanged[j] = false;
					linesMesh[p].geometry.attributes.instanceEnd.needsUpdate = true;
				}
			}
		}

		params.prevCount[p] = 0 + count;

		
		// // I think the only way to have lines that change the starting point is to redefine the positions during each timestep
		// // see bottom of this discussion : https://discourse.threejs.org/t/fat-lines-setting-geometry-data-does-not-work/14448/14
		// var positions = getLinesParams(p, params.timeYr); 
		// if (positions.length > 0) {
		// 	linesMesh[p].geometry.setPositions(positions);
		// 	linesMesh[p].geometry.instanceCount = linesMesh[p].geometry._maxInstanceCount;
		// } else {
		// 	linesMesh[p].material.visible = false;
		// }

		linesMesh[p].material.minInstanceIndex = count - params.lineLength;
		linesMesh[p].material.linewidth = params.lineWidth;
		linesMesh[p].material.opacity = params.lineAlpha;
		linesMesh[p].material.color = new THREE.Color("rgb(" + parseInt(params[p+"ColorUse"].r*255) +"," + parseInt(params[p+"ColorUse"].g*255) + "," + parseInt(params[p+"ColorUse"].b*255) + ")");
		linesMesh[p].material.needsUpdate = true;

	})
}