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
	hmWidth = 64;	//img.width; // not working because hmSource is a binary file
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
	var maxHeight = 0, nPoints=0, over=false;
	
	buildMesh();
	normHeights();
	return;
	//-----
	
	function getHeight(x, z) {
		return byteArrayImg[(z*hmWidth)+x];
	}
	function normHeights() {
		var ratio = heightMult/maxHeight;
		for (k=0; k<vTerrain.length; k++) vTerrain[k][2] *= ratio;
	}
	function pushVector (x, z){
		var y = getHeight(x,z);
		x = (x - hmWidth/2) * 0.15;
		z = (z - hmWidth) * 0.15;
		if(y > maxHeight) maxHeight = y;
		if(nPoints <= maxNumPoints){
			vTerrain.push(vec3(x,z,y));
			nPoints++;
		}
		else{
			console.log("Heightmap incomplete: over " + maxNumPoints + " points");	
			over=true;
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
			if(over) return;
		}
	}
}