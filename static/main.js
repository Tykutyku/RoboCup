const ROBOT_SIZE = 300 //mm

let navmenu;
let socket;
let notificationBar;
let fieldContainer;
let robotContainer;
let notifications = [];
const MSLDEF = Object.freeze({
	A: "Field.length",
	B: "Field.width",
	C: "PenaltyArea.width",
	D: "GoalArea.width",
	E: "PenaltyArea.length",
	F: "GoalArea.length",
	G: "Field.cornercircle_diameter",
	H: "Field.centercircle_diameter",
	I: "PenaltySpot.distToBackline",
	J: "PenaltySpot.diameter",
	K: "Field.field_markings_width",
	L: "Field.boundary_distance",
	Q: "PenaltySpot.penalty_to_restart_spot",
});

document.addEventListener('DOMContentLoaded', function () {
	socket = io();
	navmenu = document.getElementById("sidenav");
	notificationBar = document.getElementById("notificationBar");
	fieldContainer = document.getElementById("field-container");
	robotContainer = document.createElementNS("http://www.w3.org/2000/svg","g");
	robotContainer.id = "robotContainer";
	if (fieldContainer != null) {
		fetch("/data/fieldSettings_Request").then(
			response => {
				if (response.status >= 200 && response.status <= 299) { return response.json() }
				else if (response.status == 409) { throw Error(response.statusText); }
			}).then(FS => Field_generate(FS))
			.catch((error) => Notifications_Add({ "data": error, "type": "Error" }));
		socket.on('fieldSettings_Update', Field_SettingsUpdate);
	}
	document.getElementById('menuIcon').addEventListener("click", toggle_sidebar);
	socket.on('Notifications_Add', Notifications_Add);
});

function Notifications_Add(data) {
	notifications.push(data);
	Notifications_Update();
}
function Notifications_Update() {
	while (msg = notifications.pop()) {
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
	}
}

function Field_SettingsUpdate(data) {
	Field_generate(data);
}

function Field_changeSettings_click() {
	let fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.onchange = () => {
		let data = fileInput.files[0];
		fetch('/data/fieldSettings_upload', { method: 'PUT', body: data });
	}
	fileInput.click();
}

function toggle_sidebar() {
	if (navmenu.classList.contains("expanded")) {
		navmenu.classList.remove("expanded");
	} else {
		navmenu.classList.add("expanded");
	}
}
function Field_drawRobot(x, y, rz) {
	let triangle = document.createElementNS("http://www.w3.org/2000/svg","polygon");
	triangle.setAttribute("points",`${x},${y + -ROBOT_SIZE / 2} ${x + -ROBOT_SIZE / 2},${y + ROBOT_SIZE / 2} ${x + ROBOT_SIZE / 2},${y + ROBOT_SIZE / 2}`);
	triangle.setAttribute("fill","#F00");
	triangle.setAttribute("style",`transform:rotate(${rz}rad)`);
	robotContainer.appendChild(triangle);
}
function Field_generate(FS) {
	let strokeWidth = FS[MSLDEF.K];
	fieldContainer.innerHTML = `
	<svg viewbox="-${FS[MSLDEF.A] / 2 + FS[MSLDEF.L]} -${FS[MSLDEF.B] / 2 + FS[MSLDEF.L]} ${FS[MSLDEF.A] + FS[MSLDEF.L] * 2} ${FS[MSLDEF.B] + FS[MSLDEF.L] * 2}" preserveAspectRatio="xMidYMid" xmlns="http://www.w3.org/2000/svg">
	<!--main field lines-->
	<rect x="${-FS[MSLDEF.A] / 2 + strokeWidth / 2}" y="${-FS[MSLDEF.B] / 2 + strokeWidth / 2}" width="${FS[MSLDEF.A] - strokeWidth}" height="${FS[MSLDEF.B] - strokeWidth}" stroke="#FFF" fill-opacity="0" stroke-width="${strokeWidth}"/>
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
	<circle cx="${-FS[MSLDEF.A] / 2 + FS[MSLDEF.I]}" r="${FS[MSLDEF.J] / 2}" cy="0" fill="#FFF"/>
	<!--goal drawings Right-->
	<rect x="${FS[MSLDEF.A] / 2 + strokeWidth / 2 - FS[MSLDEF.E]}" y="${-FS[MSLDEF.C] / 2 + strokeWidth / 2}" width="${FS[MSLDEF.E] - strokeWidth}" height="${FS[MSLDEF.C] - strokeWidth}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0"/>
	<rect x="${FS[MSLDEF.A] / 2 + strokeWidth / 2 - FS[MSLDEF.F]}" y="${-FS[MSLDEF.D] / 2 + strokeWidth / 2}" width="${FS[MSLDEF.F] - strokeWidth}" height="${FS[MSLDEF.D] - strokeWidth}" stroke="#FFF" stroke-width="${strokeWidth}" fill-opacity="0"/>
	<circle cx="${FS[MSLDEF.A] / 2 - FS[MSLDEF.I]}" r="${FS[MSLDEF.J] / 2}" cy="0" fill="#FFF"/>
	</svg>
	`;
	fieldContainer.children[0].appendChild(robotContainer);
}