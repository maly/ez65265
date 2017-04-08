#!/usr/bin/env node

var SerialPort = require('serialport');

var portList = [];

SerialPort.list(function (err, ports) {
  //console.log(err,ports)
  ports.forEach(function(port) {
  	if (port.vendorId!='0403' && port.vendorId!='0x0403') return
  	if (port.productId!='6001' && port.productId!='0x6001') return
    //console.log(port.comName);
    //console.log(port.manufacturer);
    portList.push({id:port.comName})
  });
});

var port = null;
var wssend = null;

var openPort = function(portName) { port = new SerialPort(portName, {
  parser: SerialPort.parsers.readline('\r'),
  baudRate: 9600
});


// open errors will be emitted as an error event 
port.on('error', function(err) {
  console.log('Error: ', err.message);
})

port.on('data', function (data) {
  console.log('Data: ' + data);
  if (wssend) wssend.sendText(data)
});

}
/*
port.on('open', function() {
  port.write('h\r', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written');
  });
});
 
 */
////------ HTTP

var express = require('express');

var app = express();

app.get('/conn/:port', function (req, res) {
  if (port) {
  	console.log("Connected")
  	res.send("Connected"); return;
  }
  var port = decodeURIComponent(req.params.port);
  console.log("Try to connect",port)
  openPort(port)
  res.send("Connecting")
})

app.get('/list.js', function(req, res) {
  res.set("Content-Type", "script/javascript; charset=utf-8");
  res.send("var portList = "+JSON.stringify(portList)+";")
});

app.use(express.static(__dirname + "/public"))


app.get('/', function(req, res) {
    res.send('Hello World!')
});
app.listen(65265);


////------ WebSocket

var ws = require("nodejs-websocket")

// Scream server example: "hi" -> "HI!!!"
var server = ws.createServer(function (conn) {
	console.log("WS New connection")
	wssend = conn;
	conn.on("text", function (str) {
		console.log("Received "+str)
		if (port) port.write(str)
		//conn.sendText(str.toUpperCase()+"!!!")
	})
	conn.on("close", function (code, reason) {
		//console.log("Connection closed")
		wssend=null;
	})
	conn.on('error', function(err) {
  		console.log('WS Error: ', err.message);
	})
}).listen(6502)


//OPEN!

var opn = require('opn');

// opens the url in the default browser 
//opn('http://sindresorhus.com');

// specify the app to open in 
opn('http://localhost:65265/index.html', {app: 'chrome'});