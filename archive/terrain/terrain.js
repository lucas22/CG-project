"use strict";

// General
var canvas, gl, cindex, program, maxNumPoints = 100000;

// Mesh and texturing
var hmWidth, hmHeight;	// Heigth map image properties
var vTerrain = [], byteArrayImg = [];	// terrain shape vars
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];
var texCoordsArray = [], terTexture;	// terrain texture vars
var vControlVertexBuffer = [], tBuffer = [];

// Projection
var m_inc, mvpMatrix, mvpMatrixLoc, rotationMatrix;
var m_curquat, trackballMove = false;
var m_mousex = 1, m_mousey = 1;

//-------------------------------

function mouseMotion( x,  y) {
	var lastquat;
	if (m_mousex != x || m_mousey != y)
	{
		lastquat = trackball(
			  (2.0*m_mousex - canvas.width) / canvas.width,
			  (canvas.height - 2.0*m_mousey) / canvas.height,
			  (2.0*x - canvas.width) / canvas.width,
			  (canvas.height - 2.0*y) / canvas.height);
		m_curquat = add_quats(lastquat, m_curquat);
		m_mousex = x;
		m_mousey = y;
	}
}

function configureTexture( image ) {
	var texture;
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    
    //Flips the source data along Y axis when texImage2D or texSubImage2D are called when param is true. The initial value for param is false.
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

window.onload = function init() {
	/// Initialize canvas
	{
    canvas = document.getElementById( "gl-canvas" );
	
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
	
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );	// gray background
    gl.enable(gl.DEPTH_TEST);
    
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	}
	
	//textureCoord();
	heightMap("scene/s01.bin", 0.2);	// Builds mesh from heightmap file
	
	
	/// Initialize buffers
	{
	// Colors
	cindex = gl.getUniformLocation(program,"cindex");
	
	// Vertices
	vControlVertexBuffer = gl.createBuffer();
    var vPosition = gl.getAttribLocation( program, "vPosition" );
	
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	// Textures
	tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
	
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    //gl.enableVertexAttribArray( vTexCoord );	// <- MAKES RENDER DISAPPEAR
	
	// Projection
	m_curquat = trackball(0, 0, 0, 0);
    rotationMatrix = mat4();
    mvpMatrix = mat4();
    mvpMatrixLoc = gl.getUniformLocation(program, "mvpMatrix");
    gl.uniformMatrix4fv(mvpMatrixLoc, false, flatten(mvpMatrix));
	}

	/// User interaction
    canvas.addEventListener("mousedown", function(event){
        m_mousex = event.clientX - event.target.getBoundingClientRect().left;
        m_mousey = event.clientY - event.target.getBoundingClientRect().top;
        trackballMove = true;
    });

    canvas.addEventListener("mouseup", function(event){
        trackballMove = false;
    });

    canvas.addEventListener("mousemove", function(event){
      if (trackballMove) {
        var x = event.clientX - event.target.getBoundingClientRect().left;
        var y = event.clientY - event.target.getBoundingClientRect().top;
        mouseMotion(x, y);
      }
    } );
	
	/// Initialize environment
	
	/*
	var image = new Image();
    image.onload = function() {
		configureTexture( image );
    }
    image.src = "textures/grass.png"
	*/
	var image = document.getElementById("texImage");
	
    configureTexture( image );
	
	//console.log(texCoordsArray.length, vTerrain.length)
	
    setTimeout(function(){render()}, 100); // wait 100ms to call render()
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	//console.log("render");
	// Set camera
	m_inc = mult(mat4(), build_rotmatrix(m_curquat));
	var m_mv = mult(m_inc, rotationMatrix);
	m_mv = mult(m_mv, translate(-0.5, -0.5, 0));
	mvpMatrix = mult(ortho(-0.5, 0.5, -0.5, 0.5, -50, 100), m_mv);		// Parallel
	//mvpMatrix = mult(perspective(60, 1.0,  -10, 10), m_mv);	// Perspective
	gl.uniformMatrix4fv(mvpMatrixLoc, false, flatten(mvpMatrix));
	
	//console.log(texCoordsArray.length, vTerrain.length)
	
	// Draw terrain
	gl.uniform1i(cindex, 1);
	gl.bindBuffer( gl.ARRAY_BUFFER, vControlVertexBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(vTerrain), gl.STATIC_DRAW );
    gl.vertexAttribPointer( vTerrain, 3, gl.FLOAT, false, 0, 0 );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vTerrain.length);
	
	// Draw points
	gl.uniform1i(cindex, 2);
	gl.drawArrays(gl.POINTS, 0, vTerrain.length);
	
    requestAnimFrame( render );
}
