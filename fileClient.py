import random
import threading
import sys
from socket import socket, AF_INET, SOCK_DGRAM
from time import sleep
import pandas

DEBUG = False
MAX_VEL = 30
ACCEL_MULT = 2
IP = "127.0.0.1"
PORT = 5050

sobj = socket(AF_INET, SOCK_DGRAM)

robot_id = 1

bytemsg = int.from_bytes(b'0x00',"big")
bytesSend = None

def process_csv_data(df, file):
	globals()['position_data_csv'] = {}
	

lineI = 0

# def loop():
# 	msg = bytearray()
# 	msg += (robot_id.to_bytes(1))
# 	msg += (robot_x.to_bytes(4 ,signed=True))
# 	msg += (robot_y.to_bytes(4 ,signed=True))
# 	msg += (robot_rz.to_bytes(4))
# 	msg += (deca_x.to_bytes(4 ,signed=True))
# 	msg += (deca_y.to_bytes(4 ,signed=True))
# 	bytesSend = sobj.sendto(msg, (IP, PORT))
# 	if(bytesSend < 0):
# 		print("couldn't send bytes, did is the server running")
# 		exit()
# 	threading.Timer(0.005, loop).start()
# loop()


if(len(sys.argv) > 1):
	try:
		with open(sys.argv[1]) as file:
			df = pandas.read_csv(file)
			process_csv_data(df, file)
	except FileNotFoundError as e:
		print(f"FileNotFoundError: {e.strerror}: \'{e.filename}\'")
		exit()
else:
	print("usage: python fileClient.py targetFile")
	exit()