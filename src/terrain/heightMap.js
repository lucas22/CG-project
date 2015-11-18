// Height map generator
//---------------------
// Reads an 8-bit binary file and turns the information into a 3D surface
// by Lucas Parzianello

function heightMap() {
	// Getting image properties
	var img = new Image();
	img.src = "scene/s01.bin";
	hmWidth = 64;	//img.width;
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
			console.log(byteArrayImg[2400]);
			terrainBuilder();
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

// Mesh construction
function terrainBuilder () {
	var a=0, b=0, x, z, k, up=true;
	while(true){
		x = a;
		z = b;
		vTerrain.push(vec3(x,z,getHeight(x,z)));

		x = a;
		z = b+1;
		vTerrain.push(vec3(x,z,getHeight(x,z)));

		if(x==(hmWidth-1) && z==(hmHeight-1)) break;
		
		if ((x==0 && b!=0) || x==hmWidth-1){ // extra vertice
			x = a;
			z = b+2;
			vTerrain.push(vec3(x,z,getHeight(x,z)));
			up = !up;
			b++;
		}

		if(up) a++;
		else a--;
	}
	for (k=0; k<vTerrain.length; k++){
		vTerrain[k][0] = (vTerrain[k][0]-32)*0.12;
		vTerrain[k][1] = (vTerrain[k][1]-72)*0.12;
		vTerrain[k][2] /= 50;
	}
	
}
function getHeight(x, z){
	return byteArrayImg[(z*hmWidth)+x];
}