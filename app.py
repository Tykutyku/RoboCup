# Flask app will be initialized

from flask import Flask, render_template
from sqlalchemy import create_engine, String, Column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

app = Flask(__name__)

@app.route("/")
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run()