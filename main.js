'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const https = require('https');
const config = require('./config');
const ipcMain = electron.ipcMain;

function request(path, method, body, cb) {
	cb = typeof body === 'function' && body;
	var postData,
		headers = { 'X-ChatWorkToken': config.token };
	
	if (typeof body === 'string') {
		postData = querystring.stringify({ body: body });
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
		headers['Content-Length'] = postData.length;
		console.log(postData);
	}
	
	var req = https.request({
		hostname: 'api.chatwork.com',
		method: method,
		path: '/v1' + path,
		headers: headers
	}, (res) => {
		console.log(`STATUS: ${res.statusCode}`);
		console.log(`HEADERS: ${JSON.stringify(res.headers, null, '  ')}`);
		res.on('data', (chunk) => {
			if (cb)
				cb(chunk);
		});
		res.on('end', () => {
		});
	});
	req.on('error', (e) => {
		console.log(`error: ${e.message}`);
	});
	
	if (postData) {
		req.write(postData);
	}

	req.end();
}

function getMessage(cb) {
	request('/rooms/' + config.rid + '/messages', 'GET', cb);
}

function postMessage(message, cb) {
	request('/rooms/' + config.rid + '/messages', 'POST', message, cb)
}

let mainWindow;
let timer;
let counter = 0;

function showMessage() {
	if (!mainWindow.isVisible()) {
		getMessage((chunk) => {
			chunk = JSON.parse(chunk);
			if (chunk.length > 0) {
				mainWindow.show();
				mainWindow.focus();
				mainWindow.webContents.send('message', chunk[0].body);
			}
		});
	}
}

function createWindow() {
	mainWindow = new BrowserWindow({
		title: 'AlertTest',
		width: 490,
		height: 300,
		skipTaskbar: true,
		resizable: false,
		titleBarStyle: 'hidden',
		frame: false,
		show: false,
		alwaysOnTop: true
	});
	
	mainWindow.loadURL('file://' + __dirname + '/index.html');
//	mainWindow.webContents.openDevTools();
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
	
	mainWindow.on('show', () => {
		console.log('show');
	});
	mainWindow.on('hide', () => {
		console.log('hide');
	});
	
	timer = setInterval(showMessage, 20 * 1000);
	
	var Tray = require('tray');
	var trayIcon = new Tray(__dirname + "/icon.png");
	var Menu = require('menu');
	var contextMenu = Menu.buildFromTemplate([
		{ label: 'Cose', click: () => { mainWindow.close(); } }
	]);
	
	trayIcon.setToolTip('AlertTest');
	trayIcon.setContextMenu(contextMenu);
	trayIcon.on('click', () => {
		mainWindow.show();
		mainWindow.focus();
	});
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});
