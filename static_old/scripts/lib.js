function transformCoordinates(robotX, robotY) {
	var scale = 10;  
	var offsetX = (230 / 2) - 5;
	var offsetY = (150 / 2) - 5;
	var svgX = (robotY * scale) + offsetX; 
	var svgY = (robotX * -scale) + offsetY;
	return { x: svgX, y: svgY };
}
