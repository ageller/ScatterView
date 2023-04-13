


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

function initPointsMesh(){

	// make the buffer geometry
	var geoP = new THREE.BufferGeometry();
	var p0 = [];
	var rgbaColors = [];
	var pointSize = [];
	partsKeys.forEach( function(p,i) {

		iTime = parts.iTimeInterp.evaluate(params.minTime)[0];
		// let's remember why we're comparing iTime to a length 
		// I think iTime is the index of the interpolated value
		// so I think this conditional is asking whether there are enough position elements in the array to do the necessary interpolation (below)??  This is probably only necessary for a special use case, but it's not hurting anything to keep it in.
		if (parts[p].r.length >= iTime){
		//add one additional vertex interpolated to the exact time
			for (var j=0; j<3; j++) p0.push(parts[p].CoordInterp[j].evaluate(params.minTime)[0]);
			
			rgbaColors.push(params[p+"ColorUse"].r);
			rgbaColors.push(params[p+"ColorUse"].g);
			rgbaColors.push(params[p+"ColorUse"].b);
			rgbaColors.push(1.);

			pointSize.push(params[p+"PointSize"]);
		}
	})		
	// itemSize = 3 because there are 3 values (components) per vertex
	geoP.setAttribute( 'position', new THREE.BufferAttribute( Float32Array.from(p0), 3 ) );
	geoP.setAttribute( 'rgbaColor', new THREE.BufferAttribute( Float32Array.from(rgbaColors), 4 ) );
	geoP.setAttribute( 'pointSize', new THREE.BufferAttribute( Float32Array.from(pointSize), 1 ) );

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

	partsMesh = new THREE.Points( geoP, material );
	partsMesh.position.set(0,0,0);
	scene.add(partsMesh);

}

function updateParts(){

	var p0 = [];
	var rgbaColors = [];
	var pointSize = [];
	partsKeys.forEach( function(p,i) {

		iTime = parts.iTimeInterp.evaluate(params.timeYr)[0];
		// see above for discussion about this conditional
		if (parts[p].r.length >= iTime){
		//add one additional vertex interpolated to the exact time
			for (var j=0; j<3; j++) p0.push(parts[p].CoordInterp[j].evaluate(params.timeYr)[0]);
			
			rgbaColors.push(params[p+"ColorUse"].r);
			rgbaColors.push(params[p+"ColorUse"].g);
			rgbaColors.push(params[p+"ColorUse"].b);
			rgbaColors.push(1.);

			pointSize.push(params[p+"PointSize"]);

		}
	})

	// is there a way that we can update the attributes within the for loop above (rather than redefining here)?
	partsMesh.geometry.attributes.position = new THREE.BufferAttribute( Float32Array.from(p0), 3 );
	partsMesh.geometry.attributes.rgbaColor = new THREE.BufferAttribute( Float32Array.from(rgbaColors), 4 );
	partsMesh.geometry.attributes.pointSize = new THREE.BufferAttribute( Float32Array.from(pointSize), 1 );

}

function drawParts()
{
	// var geo, geoP, material, mesh, positions, index, pNow, iTime;

	// partsKeys.forEach( function(p,i) {


    //   	//geometry
	// 	// geo = new THREE.Geometry();

	// 	// //add one additional vertex interpolated to the exact end of the tail
	// 	// if (params.timeYr - params.lineLengthYr > 0){
	// 	// 	pNow = [];
	// 	// 	for (var j=0; j<3; j++) pNow.push(parts[p].CoordInterp[j].evaluate(params.timeYr - params.lineLengthYr)[0]);
	//     //     geo.vertices.push(new THREE.Vector3(pNow[0], pNow[1], pNow[2] ));
	// 	// }

	// 	// parts[p].r.forEach(function(c, j) {
	// 	// 	if (parts.time[j] <= params.timeYr && parts.time[j] >= (params.timeYr - params.lineLengthYr)){
	// 	// 		geo.vertices.push(new THREE.Vector3(c[0], c[1], c[2] ))
	// 	// 	}
	// 	// });

	// 	// iTime = parts.iTimeInterp.evaluate(params.timeYr)[0];
	// 	// if (parts[p].r.length >= iTime){
	// 	// //add one additional vertex interpolated to the exact time
	// 	// 	pNow = [];
	// 	// 	for (var j=0; j<3; j++) pNow.push(parts[p].CoordInterp[j].evaluate(params.timeYr)[0]);
	//     //     // geo.vertices.push(new THREE.Vector3(pNow[0], pNow[1], pNow[2] ));
	// 	// 	geoP.vertices.push(new THREE.Vector3(pNow[0], pNow[1], pNow[2] ));

	// 	// 	//the point for the star at the given time
	//     //   	material = new THREE.ShaderMaterial( {
	//     //         uniforms: {
	//     //             color: {value: params[p+"ColorUse"]},
	//     //             alpha: {value: params.pointsAlpha},
	//     //             oID: {value: 0},
	//     //             uVertexScale: {value: parseFloat(params[p+"PointSize"])},
	//     //         },

	//     //         vertexShader: myVertexShader,
	//     //         fragmentShader: myFragmentShader,
	//     //         depthWrite:false,
	//     //         depthTest: false,
	//     //         transparent:true,
	//     //         alphaTest: false,
	//     //     } );
	// 	// 	mesh = new THREE.Points(geoP, material);
	//     //     mesh.position.set(0,0,0);
	// 	// 	scene.add(mesh);

	//     //     partsMesh[p].push(mesh)
	//     // }


    //     // //the tail line for the star
    //     // material = new MeshLineMaterial({
	// 	// 	color: params[p+"ColorUse"],
	// 	// 	opacity: params.lineAlpha,
	// 	// 	lineWidth: params.lineWidth,
	// 	// 	sizeAttenuation: 0,
	// 	// 	depthWrite: true,
	// 	// 	depthTest: true,
	// 	// 	transparent: true,

    //     // });

    //     // var g = new MeshLine();
    //     // g.setGeometry(geo);
    //     // var mesh = new THREE.Mesh( g.geometry, material );
    //     // mesh.geometry.dynamic = true;
    //     // mesh.position.set(0,0,0);
    //     // scene.add(mesh)


    //     // partsMesh[p].push(mesh)

	// });
}
