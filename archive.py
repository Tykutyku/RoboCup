import threading
import json
from flask import Flask, render_template, jsonify, request
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtCore import QUrl
from PyQt5.QtWebEngineWidgets import QWebEngineView
import pyqtgraph as pg

app = Flask(__name__)

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/robot_positions")
def robot_positions():
    file_path = 'example_data/20180618_085311.B.msl'
    robot_id_query = request.args.get('robot_id', default=None, type=int)
    positions = [] 
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
            for item in data:
                robots = item.get("worldstate", {}).get("robots", [])
                for robot in robots:
                    robot_id = robot.get("id") # check if robot match to the query
                    if robot_id_query is not None and robot_id != robot_id_query: #hmm
                        continue

                    pose = robot.get("pose", [])
                    if len(pose) >= 2:  
                        x, y = pose[0], pose[1]
                        positions.append({"id": robot_id, "x": x, "y": y})          
        return jsonify(positions)

    except Exception as e:
        # log the exception (optional)
        print(f"An error occurred: {e}", file=sys.stderr)
        
        # return a generic error message to the client
        return jsonify({"error": "An error occurred processing your request."}), 500


def run_flask():
    app.run(debug=False, port=5000)

if __name__ == '__main__':
    threading.Thread(target=run_flask).start() # create new thread allowing to run flask in background  without blocking execution of other code

    # PyQt application 
    app = QApplication(sys.argv) # initialize app with allow command-line
    mainWindow = QMainWindow() # creates main window
    webEngineView = QWebEngineView() # creates widget to display web pages
    webEngineView.load(QUrl("http://localhost:5000"))
    mainWindow.setCentralWidget(webEngineView) 
    mainWindow.show() # displays main window 
    sys.exit(app.exec_()) # start app waiting for user interaction with ensures app will exit when terminated