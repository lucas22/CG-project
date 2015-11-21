"use strict";

// General
var canvas, gl, cindex, maxNumPoints = 100000;

// Mesh and texturing
var hmWidth, hmHeight;	// Heigth map image properties
var vTerrain = [], byteArrayImg = [];	// terrain shape vars
var texCoordsArray = [], terTexture;	// terrain texture vars
var vControlVertexBuffer = [];

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
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	}
	
	/// Initialize buffers
	{
	// Colors
	
	cindex = gl.getUniformLocation(program,"cindex");
	
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
	
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
	
	// Vertices
	vControlVertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vControlVertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumPoints, gl.STATIC_DRAW );
	
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
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
	heightMap("scene/s01.bin", 2);	// Builds mesh from heightmap file
	
    render();
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Set camera
	m_inc = mult(mat4(), build_rotmatrix(m_curquat));
	var m_mv = mult(m_inc, rotationMatrix);
	m_mv = mult(m_mv, translate(0, 5, 0));
	mvpMatrix = mult(ortho(-5, 5, -5, 5, -50, 100), m_mv);		// Parallel
	//mvpMatrix = mult(perspective(60, 1.0,  -10, 10), m_mv);	// Perspective
	gl.uniformMatrix4fv(mvpMatrixLoc, false, flatten(mvpMatrix));
	
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
