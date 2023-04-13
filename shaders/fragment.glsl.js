var myFragmentShader = `
// precision mediump float;

varying vec4 vColor;

uniform float alpha;

void main(void) {
    gl_FragColor = vec4(vColor.rgb, vColor.a*alpha);

    // Get the distance vector from the center
    vec2 fromCenter = abs(gl_PointCoord - vec2(0.5));
    float dist = 2.*length(fromCenter) ;

    //limb darkenning
	float u = 0.56;
	float r2 = dist*dist;
	gl_FragColor.rgb *= (1. - u*(1. - sqrt(1. - r2)));
	if (r2 > 1.){
		discard;
	}
    
    //gl_FragColor.a *= 1. - dist;

}

`;