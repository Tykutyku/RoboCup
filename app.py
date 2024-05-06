import os
import sys
import threading
import json
import webbrowser
from flask import Flask, request, jsonify, render_template, redirect, url_for, make_response
import pandas as pd
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtCore import QUrl
from PyQt5.QtWebEngineWidgets import QWebEngineView
import pyqtgraph as pg

app = Flask(__name__)
position_data = {}; 
position_data_csv = {}
position_data_decawave = {}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/templates/fromJSON.html')
def msl():
    return render_template('fromJSON.html')

@app.route('/templates/fromCSV.html')
def csv():
    return render_template('fromCSV.html')

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
    try:
        # Extract robot ID from the file name
        robot_id = file.filename.split('-')[0][2:]

        # Loop through each row in the DataFrame
        for index, row in df.iterrows():
            
            if "wm.self.pos.x" in df.columns and "wm.self.pos.y" in df.columns:
                x = float(row["wm.self.pos.x"])
                y = float(row["wm.self.pos.y"])
 

                # Check if robot_id already exists in the position_data dictionary
                if robot_id not in position_data_csv:
                    position_data_csv[robot_id] = []

                print(f"Robot {robot_id} position: x={x}, y={y}")

                # Append new position data for the robot
                position_data_csv[robot_id].append({'x': x, 'y': y})

            # Find columns starting with "hw.dw.result.robot_fc.pos" and extract x and y coordinates
            hw_dw_columns = "hw.dw.result.robot_fc.pos"
            if f"{hw_dw_columns}.x" in df.columns and f"{hw_dw_columns}.y" in df.columns:
                dx = float(row[f"{hw_dw_columns}.x"])
                dy = float(row[f"{hw_dw_columns}.y"])

                # Check if robot_id already exists in the position_data dictionary
                if robot_id not in position_data_decawave:
                    position_data_decawave[robot_id] = []

                # Append new decawave data for the robot
                position_data_decawave[robot_id].append({'dx': dx, 'dy': dy})

    except KeyError as e:
        print(f"Missing column in CSV data: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"An error occurred while processing CSV data: {e}", file=sys.stderr)
        return False
    return True


def process_msl_data(data):
    try:
        # Already a Python dictionary 
        for item in data:
            robots = item.get("worldstate", {}).get("robots", [])
            for robot in robots:
                robot_id = robot.get("id") # Check if robot matches the query
                pose = robot.get("pose", [])
                if len(pose) >= 2:  
                    x, y = pose[0], pose[1]
                    # Check if robot_id already exists in the position_data dictionary
                    if robot_id not in position_data:
                        position_data[robot_id] = []
                    # Append new position data for the robot
                    position_data[robot_id].append({"x": x, "y": y})
    except Exception as e:
                # Logging the exception 
        print(f"An error occurred while processing MSL data: {e}", file=sys.stderr)
        return False
    return True


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['csv', 'msl']

@app.route('/robot_positions', methods=['GET'])
def get_robot_positions():
    robot_id = request.args.get('robot_id', type=int)
    if robot_id not in position_data:
        return jsonify({"error": "Robot not found"}), 404

    return jsonify(position_data.get(robot_id, []))

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
    
    # Add logging to debug the response data
    app.logger.debug(f"Data being returned for {data_type}: {response_data}")
    return jsonify(response_data)

    


@app.route('/all_robots', methods=['GET'])
def all_robots():
    return jsonify({"robots": list(position_data.keys())})

if __name__ == '__main__':
    app.run(debug=True)
