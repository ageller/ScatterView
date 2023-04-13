var myVertexShader = `

attribute float pointSize; 
attribute vec4 rgbaColor;

varying vec4 vColor;

void main(void) {
	
    gl_PointSize = pointSize;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    vColor = rgbaColor;
}

`;