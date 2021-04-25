#!/usr/bin/env python

from simplejpeg import *

with open('dictionary.txt', 'rt') as f:
	g = open('dictionary.jpg', 'wt')
	content = f.read()

	g.write('const float dictionary[' + str(len(content)) + '] = float[' + str(len(content)) + '](')
	for char in content[:-1]:
		g.write(str(ord(char)) + '.,')
	g.write(str(ord(content[-1])) + '.);')

	g.close()
	f.close()
