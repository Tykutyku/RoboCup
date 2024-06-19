from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
socketio = SocketIO(app)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)