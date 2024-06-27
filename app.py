from crypt import methods
import json
import os
import socket
import sys
import threading
from enum import Enum
from flask_socketio import SocketIO
from flask import Flask, render_template, jsonify, request, redirect, send_file

POLLING_RATE = 60  # Hz
DEBUG = []  # ['UPS']

app = Flask(__name__)  # ,template_folder="templates_old",static_folder="static_old")

running = True
serverSocket = None
socketio = SocketIO(app)
ups = 0

DataType = Enum("PositionData", ["Realtime", "MSL", "CSV"])
MSGType = Enum("MSGType", ["Info", "Warn", "Error"])

fieldSettings = {
	"Field.length": 18141,
	"Field.width": 12146,
	"Field.boundary_distance": 1000,
	"Field.centercircle_diameter": 4255,
	"Field.cornercircle_diameter": 935,
	"Field.field_markings_width": 135,
	"GoalArea.width": 3625,
	"GoalArea.length": 945,
	"PenaltyArea.width": 6625,
	"PenaltyArea.length": 2256,
	"PenaltySpot.distToBackline": 3130,
	"PenaltySpot.diameter": 150,
	"PenaltySpot.penalty_to_restart_spot": 3500,
}
positionData = {DataType.Realtime: {}, DataType.CSV: {}, DataType.MSL: {}}


@app.route("/", endpoint="templates")
@app.route("/<page>/")
def home(page=None):
	sidebar = None
	extra_style = None
	header_content = None
	if page is None:
		page = "Realtime"
	elif not os.path.exists("./templates/" + page):
		socketio.emit(
			"Notifications_Update", {"type": "Error", "data": "page not found"}
		)
		return redirect("/")
	if os.path.exists("./templates/" + page + "/sidebar.html"):
		sidebar = "./sidebar.html"
	if os.path.exists("./templates/" + page + "/style.css"):
		extra_style = "./style.css"
	if os.path.exists("./templates/" + page + "/header.html"):
		header_content = True
	return render_template(
		"/index.html",
		page=page,
		sidebar=sidebar,
		header_content=header_content,
		extra_style=extra_style,
	)
@app.route("/<page>/<file>")
def fileFetch(page,file):
	return send_file(f"./templates/{page}/{file}")
	pass
@app.route("/data/fieldSettings_upload", methods=["PUT"])
def fieldSettings_upload():
	if request.data is None:
		return print("error no file uploaded")
	data = request.data.decode("UTF-8").split("\n")
	section = ""
	if len(data) < 0:
		return jsonify({"message":"data length was 0, did you upload a file?"}),409
	for line in data:
		if (line == "") | line.startswith("#"):
			continue
		elif line.startswith("["):
			section = line.strip("[]")
		elif "=" in line:
			line = line.split("=")
			if f"{section}.{line[0].strip()}" in fieldSettings.keys():
				globals()["fieldSettings"][f"{section}.{line[0].strip()}"] = int(
					float(line[1].strip().split(" ")[0]) * 1000
				)
	# Notifications_Add(MSGType.Info,f"field updated")
	socketio.emit("fieldSettings_Update", fieldSettings)
	return jsonify({"message": "file OK"}), 500

@app.route("/data/fieldSettings_Request")
def fieldSettings_Request():
	return jsonify(fieldSettings)


@socketio.on("connect")
def socket_connect(msg):
	pass

def Notifications_Add(type, msg):
	socketio.emit("Notifications_Add", {"type": type.name, "data": msg})
	pass

@socketio.on("Notification_dismissed")
def Notification_dismissed(data):
	pass

def decawave_server_loop():
	while True:
		# TODO this should not be a trycatch it is bad for performance but there is no available function for sockets :(
		try:
			msg, client = serverSocket.recvfrom(2048)
		except BlockingIOError:
			break
		msg = bytearray(msg)
		R_id = int.from_bytes(msg[0:1], "big")
		positionData[DataType.Realtime][R_id] = {
			"robot": {
				"x": int.from_bytes(msg[1:5], "big", signed=True),
				"y": int.from_bytes(msg[5:9], "big", signed=True),
				"rz": int.from_bytes(msg[9:13], "big"),
			},
			"decawave": {
				"x": int.from_bytes(msg[13:17], "big", signed=True),
				"y": int.from_bytes(msg[17:21], "big", signed=True),
			},
		}
	globals()["ups"] += 1
	with app.app_context():
		socketio.emit("realtimeData_Update", positionData[DataType.Realtime])
	threading.Timer(1 / POLLING_RATE, decawave_server_loop).start()


def debugTime():
	print(f"updates/second: {ups}")
	globals()["ups"] = 0
	threading.Timer(1, debugTime).start()


# *** main ***
if __name__ == "__main__":
	app.run(debug=True)
	socketio.run(host="0.0.0.0", port=5051)
	if len(sys.argv) > 1:
		if "--printUPS" in sys.argv:
			DEBUG.append("UPS")

if serverSocket == None:
	serverSocket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	serverSocket.bind(("0.0.0.0", 5050))
	serverSocket.setblocking(False)
	threading.Timer(0.005, decawave_server_loop).start()
if "UPS" in DEBUG:
	threading.Timer(1, debugTime).start()
