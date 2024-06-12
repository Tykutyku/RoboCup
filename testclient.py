import random
from socket import socket, AF_INET, SOCK_DGRAM
from time import sleep

sobj = socket(AF_INET, SOCK_DGRAM)

ip = "127.0.0.1"
port = 5050
msg = str("{\"id\":\"0\",\"pos\":{ \"x\":0,\"y\":0,\"rz\":0}}")
bytemsg = int.from_bytes(b'0x00',"big")
bytesSend = None
while True:
    bytesSend = sobj.sendto(b'\x00\x00\x00\x00\xff\xff\xff\xff', (ip, port))
    if(bytesSend < 0):
        print("couldn't send bytes, did is the server running")
        exit()