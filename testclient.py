import random
import threading
import sys
from socket import socket, AF_INET, SOCK_DGRAM
from time import sleep

DEBUG = False
MAX_VEL = 30
POLLING_RATE = 10 #Hz
ACCEL_MULT = 20
IP = "127.0.0.1"
PORT = 5050

sobj = socket(AF_INET, SOCK_DGRAM)

robot_id = 1
robot_x = 0
robot_y = 0
robot_rz = 0
velo_x = 0
velo_y = 0
deca_x = 0
deca_y = 0
if(len(sys.argv) > 1):
	if("--id" in sys.argv):
		id_i = sys.argv.index("--id")
		if(len(sys.argv) > id_i):
			robot_id = int(sys.argv[id_i+1])

print(f"faking robot {robot_id}")
# msg = b'\x01\x0F\x0F\x0F\x0f\x0f\x0f\x0f'

bytemsg = int.from_bytes(b'0x00',"big")
bytesSend = None

def clamp(num, min_value, max_value):
   return max(min(num, max_value), min_value)

def randomize_pos():
	rand = round(random.random() - .5, 4) * ACCEL_MULT
	globals()['velo_y'] = clamp(velo_y + rand if -11000 <= robot_y + velo_y <= 11000 else 0, -MAX_VEL, MAX_VEL)
	globals()['robot_y'] = clamp(int(robot_y + velo_y),-11000,11000)
	rand = round(random.random() - .5, 4) * ACCEL_MULT 
	globals()['velo_x'] = clamp(velo_x + rand if -7000 <= robot_x + velo_x <= 7000 else 0, -MAX_VEL, MAX_VEL)
	globals()['robot_x'] = clamp(int(robot_x + velo_x),-7000, 7000)
	if(DEBUG):
		print(f"{robot_x}\t{velo_x:.2f}\t{robot_y}\t{velo_y:.2f}")

def loop():
	randomize_pos()
	msg = bytearray()
	msg += (robot_id.to_bytes(1))
	msg += (robot_x.to_bytes(4 ,signed=True))
	msg += (robot_y.to_bytes(4 ,signed=True))
	msg += (robot_rz.to_bytes(4))
	msg += (deca_x.to_bytes(4 ,signed=True))
	msg += (deca_y.to_bytes(4 ,signed=True))
	bytesSend = sobj.sendto(msg, (IP, PORT))
	print(f"x:{robot_x}   \ny:{robot_y}   \nxv:{velo_x:.2f}   \nyv:{velo_y:.2f}   \n",end="\033[F\033[F\033[F\033[F")
	threading.Timer(1/POLLING_RATE, loop).start()
loop()