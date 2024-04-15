from concurrent.futures import thread
import sys
import threading
import json
import os
from pathlib import Path
from flask import Flask, render_template, jsonify, request, make_response, abort, send_file
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtCore import QUrl
from PyQt5.QtWebEngineWidgets import QWebEngineView
import pyqtgraph as pg

app = Flask(__name__,template_folder='new_frontend/')
position_data = {}; 

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
@app.route("/<file>", endpoint='resources')
def get_resources(file):
    return send_file(file)

@app.route("/robot_positions")
def robot_positions():
    robot_id_query = request.args.get('robot_id', default=None, type=int)
    if robot_id_query is None:
        return  make_response("invalid argument",400)
    if position_data.get(robot_id_query) is None:
        return make_response("robot id did not exist in data",400)
    positions = position_data.get(robot_id_query)
    return jsonify(positions)
    
def import_data_file():
    file_path = 'example_data/20180618_085311.B.msl'
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
            for item in data:
                robots = item.get("worldstate", {}).get("robots", [])
                for robot in robots:
                    robot_id = robot.get("id") # check if robot match to the query
                    pose = robot.get("pose", [])
                    if len(pose) >= 2:  
                        x, y = pose[0], pose[1]
                        if position_data.get(robot_id) is None:
                            position_data[robot_id] = []
                        position_data[robot_id].append({ "x":x, "y":y })
                        # positions.append({ "x": x, "y": y})
    except Exception as e:
        # log the exception (optional)
        print(f"An error occurred: {e}", file=sys.stderr)
    print("done importing")
def run_flask():
    app.run(debug=False, port=5000)

if __name__ == '__main__':
    threading.Thread(target=import_data_file).start()
    threading.Thread(target=app.run(debug=False, port=5000)).start() # create new thread allowing to run flask in background  without blocking execution of other code
    # PyQt application 
    QTapp = QApplication(sys.argv) # initialize app with allow command-line
    # mainWindow = QMainWindow() # creates main window
    webEngineView = QWebEngineView() # creates widget to display web pages
    webEngineView.load(QUrl("http://localhost:5000"))
    # mainWindow.setCentralWidget(webEngineView) 
    # mainWindow.show() # displays main window 
    sys.exit(QTapp.exec_()) # start app waiting for user interaction with ensures app will exit when terminated


