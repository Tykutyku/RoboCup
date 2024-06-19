import socket
import sys
import json
import pyqtgraph as pg
import threading
import pandas as pd
from flask_socketio import SocketIO
from flask import Flask, render_template, jsonify, request, make_response, abort, send_file, redirect

POLLING_RATE = 60 # Hz
DEBUG = [] #['UPS']
serverSocket = None

app = Flask(__name__,template_folder='new_frontend/')

socketio = SocketIO(app)
running = True
ups = 0

position_data_msl = {}
position_data_csv = {}
position_data_realtime = {}
position_data_decawave = {}

@app.route("/", endpoint='template')
@app.route("/<page>/")
def home(page=None):
    sidebar = None
    extra_style = None
    header_content = None
    if(page is None): #set default to current-game
        page = "current-game"
    if(not os.path.exists("./new_frontend/"+page)):
        return  abort(404)
    if(os.path.exists("./new_frontend/"+page+"/sidebar.html")):
        sidebar=page+"/sidebar.html"
    if(os.path.exists("./new_frontend/"+page+"/style.css")):
        extra_style=page+"/style.css"
    if(os.path.exists("./new_frontend/"+page+"/header.html")):
        header_content="./new_frontend/"+page+"/header.html"
    return render_template('/index.html', page=page, sidebar=sidebar, header_content=header_content, extra_style=extra_style)

# TODO maybe not needed vvv
@app.route("/<file>", endpoint='resources')
def get_resources(file):
    return send_file(file)


@app.route('/upload', methods=['POST'])
def upload_file():
	if 'file' not in request.files:
		return redirect(request.url)
	file = request.files['file']
	if file.filename == '':
		return redirect(request.url)
	if file and allowed_file(file.filename):
		data_type = file.filename.split('.')[-1]
		try:
			if data_type == 'csv':
				df = pd.read_csv(file)
				process_csv_data(df, file)
			elif data_type == 'msl':
				data = json.load(file)
				if not process_msl_data(data):
					return jsonify({"message": "Error processing MSL data"}), 500
			return '''
	<script type="text/javascript">
	window.top.window.uploadComplete({result});
	</script>
	'''.format(result=json.dumps({"message": "File processed"}))
		except Exception as e:
			return jsonify({"message": str(e)}), 500
	return jsonify({"message": "File type not allowed"}), 400

def process_csv_data(df, file):
	globals()['position_data_csv'] = {}
	globals()['position_data_decawave'] = {}
	try:
		robot_id = file.filename.split('-')[0][2:]
		for index, row in df.iterrows():
			liveseconds = row.get("liveseconds", 0)
			minutes, seconds = divmod(int(liveseconds // 1000), 60)

			if "robot.pos.x(m)" in df.columns and "robot.pos.y(m)" in df.columns and "robot.pos.rz(rad)" in df.columns:
				x = float(row["robot.pos.x(m)"])
				y = float(row["robot.pos.y(m)"])
				orientation = float(row["robot.pos.rz(rad)"])
				if robot_id not in position_data_csv:
					position_data_csv[robot_id] = []
				position_data_csv[robot_id].append({
					"x": x,
					"y": y,
					"orientation": orientation,
					"gametime": f"{minutes:02d}:{seconds:02d}"
				})
				print(f"Robot {robot_id} position: x={x}, y={y}, orientation={orientation}")

			if "robot.vel.x(m)" in df.columns and "robot.vel.y(m)" in df.columns and "robot.vel.rz(rad)" in df.columns:
				vel_x = float(row["robot.vel.x(m)"])
				vel_y = float(row["robot.vel.y(m)"])
				vel_rz = float(row["robot.vel.rz(rad)"])
				if robot_id not in position_data_csv:
					position_data_csv[robot_id] = []
				position_data_csv[robot_id].append({
					"vel_x": vel_x,
					"vel_y": vel_y,
					"vel_rz": vel_rz,
					"gametime": f"{minutes:02d}:{seconds:02d}"
				})
				print(f"Robot {robot_id} velocity: vel_x={vel_x}, vel_y={vel_y}, vel_rz={vel_rz}")

			if "decawave.x" in df.columns and "decawave.y" in df.columns:
				dx = float(row["decawave.x"])
				dy = float(row["decawave.y"])
				if robot_id not in position_data_decawave:
					position_data_decawave[robot_id] = []
				position_data_decawave[robot_id].append({
					"dx": dx,
					"dy": dy,
					"gametime": f"{minutes:02d}:{seconds:02d}"
				})
				print(f"Robot {robot_id} Decawave position: dx={dx}, dy={dy}")
	except KeyError as e:
		app.logger.error(f"Missing column in CSV data: {e}")
		return False
	except Exception as e:
		app.logger.error(f"An error occurred while processing CSV data: {e}")
		return False
	return True

def process_msl_data(data):
	globals()['position_data_msl'] = {}
	try:
		for item in data:
			gametimeMs = item.get("gametimeMs", 0)
			minutes, seconds = divmod(gametimeMs // 1000, 60)
			robots = item.get("worldstate", {}).get("robots", [])
			for robot in robots:
				robot_id = robot.get("id")
				pose = robot.get("pose", [])
				targetPose = robot.get("targetPose", [])
				if len(pose) >= 2:
					x, y, orientation = pose[0], pose[1], pose[2]
					if len(targetPose) >= 2:
						tx, ty, torientation = targetPose[0], targetPose[1], targetPose[2]
					if robot_id not in position_data_msl:
						position_data_msl[robot_id] = []
					position_data_msl[robot_id].append({
						"x": x,
						"y": y,
						"orientation": orientation,
						"target_x": tx,
						"target_y": ty,
						"target_orientation": torientation,
						"gametime": f"{minutes:02d}:{seconds:02d}"
					})
	except Exception as e:
		print(f"An error occurred while processing MSL data: {e}", file=sys.stderr)
		return False
	return position_data_msl

# TODO fix with regex
def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['csv', 'msl']

# remove, do with JS
@app.route('/robot_positions', methods=['GET'])
def get_robot_positions():
	robot_id = request.args.get('robot_id', type=int)
	position_type = request.args.get('type')
	start = request.args.get('start', default=0, type=int)
	count = request.args.get('count', default=20, type=int)

	if robot_id not in position_data_msl:
		return jsonify({"error": "Robot not found"}), 404

	positions = position_data_msl.get(robot_id, [])
	paginated_positions = positions[start:start + count]

	if position_type == "self":
		paginated_positions = [{"x": pos["x"], "y": pos["y"], "gametime": pos["gametime"]} for pos in paginated_positions]
	elif position_type == "target":
		paginated_positions = [{"target_x": pos["target_x"], "target_y": pos["target_y"], "gametime": pos["gametime"]} for pos in paginated_positions]
	elif position_type == "both":
		paginated_positions = paginated_positions

	return jsonify(paginated_positions)

# TODO remove, do with JS
@app.route('/robot_positions_csv', methods=['GET'])
def get_robot_positions_csv():
	data_type = request.args.get('type')
	if data_type == 'self':
		response_data = {'self': position_data_csv}
	elif data_type == 'decawave':
		response_data = {'decawave': position_data_decawave}
	elif data_type == 'both':
		response_data = {
			'self': position_data_csv,
			'decawave': position_data_decawave
		}
	else:
		return jsonify({"error": "Invalid data type"}), 400
	app.logger.debug(f"Data being returned for {data_type}: {response_data}")
	return jsonify(response_data)

# TODO remove, do with JS
@app.route('/all_robots', methods=['GET'])
def all_robots():
	return jsonify({"robots": list(position_data_msl.keys())})

def decawave_server_loop():
		msg, client = serverSocket.recvfrom(2048)
		msg = bytearray(msg)
		R_id = int.from_bytes(msg[0:1],"big")
		position_data_realtime[R_id] = {
			"robot": {
			"x": int.from_bytes(msg[1:5],"big", signed=True) / 1000,
			"y": int.from_bytes(msg[5:9],"big", signed=True) / 1000,
			"rz": int.from_bytes(msg[9:13],"big"),
			},
			"decawave":{
				"x":int.from_bytes(msg[13:17],"big", signed=True) / 1000,
				"y":int.from_bytes(msg[17:21],"big", signed=True) / 1000,
			}
		}
		threading.Timer(0.005,decawave_server_loop).start()

# *** main ***
if __name__ == '__main__':
	app.run(debug=True)
	socketio.run(host='0.0.0.0', port=5051)
	if(len(sys.argv) > 1):
		if("--printUPS" in sys.argv):
			DEBUG.append('UPS')

if(serverSocket == None):
	serverSocket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	serverSocket.bind(('0.0.0.0',5050))
	threading.Timer(0.005,decawave_server_loop).start()
