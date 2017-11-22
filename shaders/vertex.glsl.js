var myVertexShader = `

uniform float uVertexScale;

void main(void) {
	
    gl_PointSize = uVertexScale;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}

`;