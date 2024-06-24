let navmenu;
let socket;
let notificationBar;
let fieldContainer;
let notifications = [];
const MSLDEF = Object.freeze({
	A: "length",
	B: "width",
	C: "Penalty.areaWidth",
	D: "Goal.width",
	E: "Penalty.areaLength",
	F: "Goal.height",
	G: "cornercircle_diameter",
	H: "centercircle_diameter",
	I: "Penalty.distToBackline",
	J: "Penalty.diameter",
	K: "field_markings_width",
	L: "boundary_distance",
	Q: "Penalty.penalty_to_restart_spot"
});

// /* 					// **** location Bordeaux ****
let FieldSettings = {
	"length": 21960,			 			// A of MSL-field dimension definition
	"width": 13980,							// B of MSL-field dimension definition
	"cornercircle_diameter": 750,			// G of MSL-field dimension definition
	"centercircle_diameter": 3990,			// H of MSL-field dimension definition
	"field_markings_width": 125,			// K of MSL-field dimension definition
	"boundary_distance": 800,				// L of MSL-field dimension definition
	"Goal.width": 2250,						// D of MSL-field dimension definition
	"Goal.height": 1000,					// F of MSL-field dimension definition
	"Penalty.areaWidth": 6900,				// C of MSL-field dimension definition
	"Penalty.areaLength": 2250,				// E of MSL-field dimension definition
	"Penalty.distToBackline": 3670,			// I of MSL-field dimension definition
	"Penalty.diameter": 0, 					// J of MSL-field dimension definition
	"Penalty.penalty_to_restart_spot": 0	// Q of MSL-field dimension definition - restart points near goal (used for goal kicks)
}
// */
 /*					// **** location locht ****
let FieldSettings = { //D in mm
	"length": 18141,			 			// A of MSL-field dimension definition
	"width": 12146,							// B of MSL-field dimension definition
	"cornercircle_diameter": 935,			// G of MSL-field dimension definition
	"centercircle_diameter": 4255,			// H of MSL-field dimension definition
	"field_markings_width": 135,			// K of MSL-field dimension definition
	"boundary_distance": 1000,				// L of MSL-field dimension definition
	"Goal.width": 3625,						// D of MSL-field dimension definition
	"Goal.height": 945,						// F of MSL-field dimension definition
	"Penalty.areaWidth": 6625,				// C of MSL-field dimension definition
	"Penalty.areaLength": 2256,				// E of MSL-field dimension definition
	"Penalty.distToBackline": 3130,			// I of MSL-field dimension definition
	"Penalty.diameter": 150, 				// J of MSL-field dimension definition
	"Penalty.penalty_to_restart_spot": 3500	// Q of MSL-field dimension definition - restart points near goal (used for goal kicks)

}
// */
document.addEventListener('DOMContentLoaded', function () {
	navmenu = document.getElementById("sidenav");
	notificationBar = document.getElementById("notificationBar");
	fieldContainer = document.getElementById("field-container");
	if (fieldContainer != null) { generateField() }
	document.getElementById('menuIcon').addEventListener("click", toggle_sidebar);
	socket = io();
	socket.on('Notifications_Add', Notifications_Add);
});
function Notifications_Add(data) {
	notifications.push(data);
}
function Notifications_Update(args) {
	notifications.forEach(msg => {
		let div = document.createElement("div");
		div.classList.add("flex", "row", msg.type);
		let span = document.createElement("span");
		span.innerHTML = msg.data;
		div.appendChild(span);
		div.onclick = (event, div) => {
			div = event.currentTarget;
			div.style.transform = "rotateX(90deg)";
			setTimeout(() => { div.outerHTML = ''; }, 1000)
		}
		notificationBar.appendChild(div);
	});
}

function toggle_sidebar() {
	if (navmenu.classList.contains("expanded")) {
		navmenu.classList.remove("expanded");
	} else {
		navmenu.classList.add("expanded");
	}
}
function generateField() {
	let FS = FieldSettings;
	let strokeWidth = FS["field_markings_width"];
	fieldContainer.innerHTML = `
	<svg viewbox="-${FS[MSLDEF.A] / 2 + FS[MSLDEF.L]} -${FS[MSLDEF.B] / 2 + FS[MSLDEF.L]} ${FS[MSLDEF.A] + FS[MSLDEF.L] * 2} ${FS[MSLDEF.B] + FS[MSLDEF.L] * 2}" preserveAspectRatio="xMidYMid">
	<!--main field lines-->
	<rect x="${-FS[MSLDEF.A] / 2 + strokeWidth / 2}" y="${-FS[MSLDEF.B] / 2 + strokeWidth / 2}" width="${FS['length'] - strokeWidth}" height="${FS['width'] - strokeWidth}" stroke="#FFF" fill-opacity="0" stroke-width="${strokeWidth}"/>
	<line x1="0" x2="0" y1="-${FS[MSLDEF.B] / 2}" y2="${FS[MSLDEF.B] / 2}" stroke-width="${strokeWidth}" stroke="#FFF"/>
	<circle cx="0" cy="0" r="${FS[MSLDEF.H] / 2 - strokeWidth / 2}" stroke-width="${strokeWidth}" stroke="#FFF" fill-opacity="0"/>
	<path d="M ${-FS[MSLDEF.A] / 2} ${-FS[MSLDEF.B] / 2 + FS[MSLDEF.G]} q ${FS[MSLDEF.G]} 0 ${FS[MSLDEF.G]} -${FS[MSLDEF.G]}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0" />
	<path d="M ${FS[MSLDEF.A] / 2} ${-FS[MSLDEF.B] / 2 + FS[MSLDEF.G]} q -${FS[MSLDEF.G]} 0 -${FS[MSLDEF.G]} -${FS[MSLDEF.G]}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0" />
	<path d="M ${FS[MSLDEF.A] / 2} ${FS[MSLDEF.B] / 2 - FS[MSLDEF.G]} q -${FS[MSLDEF.G]} 0 -${FS[MSLDEF.G]} ${FS[MSLDEF.G]}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0" />
	<path d="M ${-FS[MSLDEF.A] / 2} ${FS[MSLDEF.B] / 2 - FS[MSLDEF.G]} q ${FS[MSLDEF.G]} 0 ${FS[MSLDEF.G]} ${FS[MSLDEF.G]}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0" />
	<circle cx="0" cy="0" r="${FS[MSLDEF.J] / 2}" Fill="#FFF"/>
	<!--goal drawings left-->
	<rect x="${-FS[MSLDEF.A] / 2 + strokeWidth / 2}" y="${-FS[MSLDEF.C] / 2 + strokeWidth / 2}" width="${FS[MSLDEF.E] - strokeWidth}" height="${FS[MSLDEF.C] - strokeWidth}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0"/>
	<rect x="${-FS[MSLDEF.A] / 2 + strokeWidth / 2}" y="${-FS[MSLDEF.D] / 2 + strokeWidth / 2}" width="${FS[MSLDEF.F] - strokeWidth}" height="${FS[MSLDEF.D] - strokeWidth}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0"/>
	<circle cx="${-FS[MSLDEF.A] / 2 + FS[MSLDEF.I]}" r="${FieldSettings[MSLDEF.J] / 2}" cy="0" fill="#FFF"/>
	<!--goal drawings Right-->
	<rect x="${FS[MSLDEF.A] / 2 + strokeWidth / 2 - FS[MSLDEF.E]}" y="${-FS[MSLDEF.C] / 2 + strokeWidth / 2}" width="${FS[MSLDEF.E] - strokeWidth}" height="${FS[MSLDEF.C] - strokeWidth}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0"/>
	<rect x="${FS[MSLDEF.A] / 2 + strokeWidth / 2 - FS[MSLDEF.F]}" y="${-FS[MSLDEF.D] / 2 + strokeWidth / 2}" width="${FS[MSLDEF.F] - strokeWidth}" height="${FS[MSLDEF.D] - strokeWidth}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0"/>
	<circle cx="${FS[MSLDEF.A] / 2 - FS[MSLDEF.I]}" r="${FieldSettings[MSLDEF.J] / 2}" cy="0" fill="#FFF"/>
	</svg>	
	`;
	/*
	*/
}