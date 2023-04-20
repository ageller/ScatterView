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

	var points = getPointsParams(params.timeYr)

	// is there a way that we can update the attributes within the for loop above (rather than redefining here)?
	pointsMesh.geometry.attributes.position = new THREE.BufferAttribute( Float32Array.from(points.positions), 3 );
	pointsMesh.geometry.attributes.rgbaColor = new THREE.BufferAttribute( Float32Array.from(points.colors), 4 );
	pointsMesh.geometry.attributes.pointSize = new THREE.BufferAttribute( Float32Array.from(points.size), 1 );
	pointsMesh.material.uniforms.alpha.value = params.pointsAlpha;
}

function getLinesParams(p, time, lineLength = params.lineLengthYr){
	var positions = [];

	// //add one additional vertex interpolated to the exact end of the tail
	// if (time - lineLength > 0){
	// 	for (var j=0; j<3; j++) positions.push(parts[p].CoordInterp[j].evaluate(time - lineLength)[0]);
	// }

	parts[p].r.forEach(function(c, j) {
		if (parts.time[j] <= time && parts.time[j] >= (time - lineLength)){
			positions.push(c[0], c[1], c[2])
		}
	});

	// iTime = parts.iTimeInterp.evaluate(time)[0];
	// if (parts[p].r.length >= iTime){
	// //add one additional vertex interpolated to the exact time
	// 	for (var j=0; j<3; j++) positions.push(parts[p].CoordInterp[j].evaluate(time)[0]);
	// };

	return positions;
}

function initLineMesh(){
	partsKeys.forEach(function(p,i) {

      	//geometry
		var geo = new THREE.LineGeometry();
		var positions = getLinesParams(p, params.maxTime, params.maxTime); //  give it the full line to start then cut back the end 

		geo.setPositions(positions);
		geo.instanceCount = (params.timeYr - params.minTime)/(params.maxTime - params.minTime)*geo._maxInstanceCount;

		matLine = new THREE.LineMaterial( {
			color: new THREE.Color("rgb(" + parseInt(params[p+"ColorUse"].r*255) +"," + parseInt(params[p+"ColorUse"].g*255) + "," + parseInt(params[p+"ColorUse"].b*255) + ")"),
			linewidth: params.lineWidth, 
			resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // resolution of the viewport (very important to set! and will need to be updated if screen size changes)
			opacity: params.lineAlpha,
			transparent: true,
		} );

		line = new THREE.Line2( geo, matLine );
		// line.computeLineDistances();
		// line.scale.set( 1, 1, 1 );

		linesMesh[p] = line;
		scene.add(line);
	});

}
function _LineGeometry_setPositions(array){
	// from three-fatline.js
	// converts [ x1, y1, z1,  x2, y2, z2, ... ] to pairs format
	var length = array.length - 3;
	var points = new Float32Array(2 * length);
	for (var i = 0; i < length; i += 3) {
		if (array[i]) points[2 * i] = array[i];
		if (array[i + 1]) points[2 * i + 1] = array[i + 1];
		if (array[i + 2]) points[2 * i + 2] = array[i + 2];
		if (array[i + 3]) points[2 * i + 3] = array[i + 3];
		if (array[i + 4]) points[2 * i + 4] = array[i + 4];
		if (array[i + 5]) points[2 * i + 5] = array[i + 5];
	}
	return points;
}
function updateLines(){
	// some resources:
	//https://discourse.threejs.org/t/the-length-of-positions-of-linesegmentsgeometry-is-fixed-to-24/20375
	//https://discourse.threejs.org/t/out-of-control-memory-when-updating-position-of-lines-within-animate-function/33740
	//https://jsfiddle.net/prisoner849/h1tzc4jn/
	partsKeys.forEach(function(p,i) {


		//this will properly change the length of the lines so that they go from t=0 to the point
		//I still need a way to change the starting point of the line to respect params.lineLength;
		linesMesh[p].geometry.instanceCount = (params.timeYr - params.minTime)/(params.maxTime - params.minTime)*linesMesh[p].geometry._maxInstanceCount;
		// linesMesh[p].geometry.index.count = params.lineLength;

		// this controls each instance (so not helpful)
		//linesMesh[p].geometry.setDrawRange(parseInt(params.timeYr - params.minTime - params.lineLength), parseInt(params.timeYr - params.minTime));
		// linesMesh[p].geometry.needsUpdate = true;


		linesMesh[p].material.linewidth = params.lineWidth;
		linesMesh[p].material.opacity = params.lineAlpha;
		linesMesh[p].material.color = new THREE.Color("rgb(" + parseInt(params[p+"ColorUse"].r*255) +"," + parseInt(params[p+"ColorUse"].g*255) + "," + parseInt(params[p+"ColorUse"].b*255) + ")");
		linesMesh[p].material.needsUpdate = true;

	})
}