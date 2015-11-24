"use strict"
// Height map generator
/*---------------------
 * Reads an 8-bit binary file and turns the information into a 3D surface
 * Parameters:
 * 	hmSource: heightmap binary source file
 * 	heightMult: heigth multiplier (default = 1)
 * 	maxNumPoints: maximum of vertices that can be created (default = 1M)
 * by Lucas Parzianello - github.com/lucas22
*/

function heightMap(hmSource, heightMult=1, maxNumPoints=1000000) {
	// Getting image properties
	var img = new Image();
	img.src = hmSource;
	// TODO: unfix these values
	hmWidth = 64;	//img.width; // img.x not working 'cause hmSource is binary file
	hmHeight = 64;	//img.height;
		
	// Extracting info from image
	var oReq = new XMLHttpRequest();
	oReq.open("GET", img.src, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent) {
		var arrayBuffer = oReq.response;
		var binaryString = '';
		if (arrayBuffer) {
			byteArrayImg = new Uint8Array(arrayBuffer); // Data saved in byteArrayImg
			terrainBuilder(heightMult, maxNumPoints);
		}
		else {
			console.log("Error loading heightmap. Reloading page...")
			setTimeout(function(){
				location.reload();
			}, 2000);
		}
	};
	oReq.send(null);
}

// Mesh constructor
function terrainBuilder (heightMult, maxNumPoints) {
	var maxHeight = 0, nPoints=0, breakMesh=false, k;
	
	buildMesh();
	normHeights();
	console.log("DONE");
	return;
	//-----
	
	function getHeight(x, y) {	// returns the height of the coordinate
		return byteArrayImg[(y*hmWidth)+x];
	}
	function normHeights() {	// normalize all the heights and multiply them
		var ratio = heightMult/maxHeight;
		for (k=0; k<vTerrain.length; k++) vTerrain[k][2] *= ratio;
	}
	function pushVector (x, y){	// push data to position and texture arrays
		var z = getHeight(x,y), txt;
		x /= hmWidth;	// Normalize x and y to [0,1] interval
		y /= hmHeight;
		if(z > maxHeight) maxHeight = z;
		if(nPoints <= maxNumPoints){
			vTerrain.push(vec3(x,y,z));
			txt = vec2(x,y)
			texCoordsArray.push(txt);		// push texture coord
			if(txt[0]>1 || txt[1]>1) console.log(txt); // nothing should print here
			nPoints++;
		}
		else{
			console.log("Heightmap incomplete: over " + maxNumPoints + " points");	
			breakMesh=true;
		}
	}
	function buildMesh(){
		var a=0, b=0, up=true;
		while(true){
			pushVector(a, b);
			pushVector(a, b+1);
			
			if ((a==0 && b!=0) || a==hmWidth-1){ 		// end-line extra vertice
				if(a==(hmWidth-1) && (b+1)==(hmHeight-1)) break;	// reached end
				pushVector(a, b+2);
				up = !up;			// flips building direction
				b++;
			}
			if(up) a++;
			else a--;
			if(breakMesh) return;
		}
	}
}