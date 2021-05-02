#!/usr/bin/env python
import png
from numpy import *

def floatToVec2(index, width):
	x = index % width
	y = (index - x) / width
	return (x,y)

def vec2ToFloat(index, width):
	(x,y) = index
	return x + y * width

def stringIndex(string):
	assert(len(string) < 256)
	return ([chr(0)] + [chr(i+1) for i,char in enumerate(string) if char == '\n'])[:-1]

with open('dictionary.txt', 'rt') as f:
	# Read dictionary from file.
	content = f.read()

	# Prepend index
	searchIndex = stringIndex(content)
	content = chr(len(searchIndex)) + chr(0).join(searchIndex) + content

	# Fill encoded data to have a length that is a multiple of 4
	content += ''.join([chr(92)] * ((4-(len(content) % 4)) % 4))

	# Encode data into image
	imageSize = int(ceil(sqrt(len(content)/4.)))
	imageData = []
	for i in range(imageSize):
		row = []
		for j in range(imageSize):
			index = vec2ToFloat((j,i), imageSize)
			entryData = list(map(ord, content[4*index:4*(index+1)]))
			if entryData == []: entryData = [0,0,0,0]
			row += entryData
		imageData += [ row ]

	print(imageData)

	# Save imageData
	png.from_array(imageData, 'RGBA', {"width":imageSize, "height":imageSize}).save('dictionary.png')

	f.close()
