from dataclasses import fields
import random
import requests
import threading
import sys
import math
from socket import socket, AF_INET, SOCK_DGRAM
from time import sleep

DEBUG = False
MAX_VEL = 30
MAX_ROT = 1
POLLING_RATE = 60 #Hz
ACCEL_MULT = 100
ROT_ACCEL_MULT = 1
IP = "127.0.0.1"
PORT = 5050

sobj = socket(AF_INET, SOCK_DGRAM)

robot_id = 1
robot_x = 0
robot_y = 0
robot_rz = 0
velo_x = 0
velo_y = 0
velo_rz = 0
deca_x = 0
deca_y = 0
if(len(sys.argv) > 1):
	if("--id" in sys.argv):
		id_i = sys.argv.index("--id")
		if(len(sys.argv) > id_i):
			robot_id = int(sys.argv[id_i+1])

print(f"faking robot {robot_id}")
fieldSize = requests.get("http://localhost:5000/data/fieldSettings_Request")
fieldSize = fieldSize.json()
print(f"fieldsize {fieldSize["Field.length"]} {fieldSize["Field.width"]}")
field = {"length": fieldSize["Field.length"] / 2, "width": fieldSize["Field.width"] / 2}
bytemsg = int.from_bytes(b'0x00',"big")

def clamp(num, min_value, max_value):
   return max(min(num, max_value), min_value)

def randomize_pos():
	rand = round(random.random() - .5, 4) * ACCEL_MULT * (1 / POLLING_RATE)
	globals()['velo_y'] = clamp(velo_y + rand if -field["width"] <= robot_y + velo_y <= field["width"] else 0, -MAX_VEL, MAX_VEL)
	globals()['robot_y'] = int(clamp(int(robot_y + velo_y),-field["width"],field["width"]))
	rand = round(random.random() - .5, 4) * ACCEL_MULT * (1 / POLLING_RATE)
	globals()['velo_x'] = clamp(velo_x + rand if -field["length"] <= robot_x + velo_x <= field["length"] else 0, -MAX_VEL, MAX_VEL)
	globals()['robot_x'] = int(clamp(int(robot_x + velo_x),-field["length"], field["length"]))
	# rand = round(random.random() - .5, 4) * ROT_ACCEL_MULT
	# globals()['velo_rz'] = clamp(velo_rz + rand , -MAX_ROT, MAX_ROT)
	# globals()['robot_rz'] = ((robot_rz + velo_rz) % (math.pi * 2))

def loop():
	randomize_pos()
	msg = bytearray()
	msg += (robot_id.to_bytes(1))
	msg += (robot_x.to_bytes(4 ,signed=True))
	msg += (robot_y.to_bytes(4 ,signed=True))
	msg += (robot_rz.to_bytes(4))
	msg += (deca_x.to_bytes(4 ,signed=True))
	msg += (deca_y.to_bytes(4 ,signed=True))
	sobj.sendto(msg, (IP, PORT))
	print(f"x:{robot_x}    \ny:{robot_y}    \nrz:{robot_rz}    \nxv:{velo_x:.2f}    \nyv:{velo_y:.2f}    \nrzv:{velo_rz:.2f}",end="\033[F\033[F\033[F\033[F\033[F")
	threading.Timer(1/POLLING_RATE, loop).start()
loop()