require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const { ethers } = require('ethers');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MQTT_BROKER_URL = 'mqtt://broker.hivemq.com';
const MQTT_CONTROL_TOPIC = 'bbd-smarthome/control';

const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
	console.log(`[${new Date().toISOString()}] MQTT connected to ${MQTT_BROKER_URL}`);
});

mqttClient.on('error', (err) => {
	console.error(`[${new Date().toISOString()}] MQTT error:`, err.message);
});

// Blockchain setup (ethers.js v6)
const GANACHE_PROVIDER_URL = 'http://127.0.0.1:7545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Minimal ABI for addLog function
const CONTRACT_ABI = [
	{
		type: 'function',
		name: 'addLog',
		inputs: [
			{ name: 'action', type: 'string' },
			{ name: 'user', type: 'string' },
			{ name: 'timestamp', type: 'uint256' },
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
];

let provider;
let wallet;
let contract;

if (PRIVATE_KEY && CONTRACT_ADDRESS) {
	try {
		provider = new ethers.JsonRpcProvider(GANACHE_PROVIDER_URL);
		wallet = new ethers.Wallet(PRIVATE_KEY, provider);
		contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
		console.log(`[${new Date().toISOString()}] Blockchain: Ganache connected at ${GANACHE_PROVIDER_URL}`);
		console.log(`[${new Date().toISOString()}] Blockchain: Wallet loaded, contract ready at ${CONTRACT_ADDRESS}`);
	} catch (err) {
		console.warn(`[${new Date().toISOString()}] Blockchain setup warning:`, err.message);
	}
} else {
	console.warn(`[${new Date().toISOString()}] Blockchain disabled: PRIVATE_KEY or CONTRACT_ADDRESS not set in .env`);
}

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
	})
);

app.use(express.json());

// Minimal request logging for easier debugging.
app.use((req, res, next) => {
	const start = Date.now();

	res.on('finish', () => {
		const durationMs = Date.now() - start;
		console.log(
			`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`
		);
	});

	next();
});

app.get('/', (req, res) => {
	res.status(200).json({ status: 'Server is healthy and running' });
});

app.post('/api/device/control', (req, res) => {
	const { device, command, user } = req.body || {};

	if (!device || !command || !user) {
		return res.status(400).json({
			error: 'Invalid payload. device, command, and user are required',
		});
	}

	const payload = command;

	mqttClient.publish(MQTT_CONTROL_TOPIC, payload, async (err) => {
		if (err) {
			return res.status(500).json({ error: 'Failed to publish device command' });
		}

		let transactionHash = null;

		// Blockchain logging
		if (contract && provider && wallet) {
			try {
				const action = `${device} ${command}`;
				const timestamp = Math.floor(Date.now() / 1000);

				console.log(`[${new Date().toISOString()}] Blockchain: Calling addLog('${action}', '${user}', ${timestamp})`);

				const tx = await contract.addLog(action, user, timestamp);
				transactionHash = tx.hash;

				console.log(`[${new Date().toISOString()}] Blockchain: Transaction sent, hash: ${transactionHash}`);

				const receipt = await tx.wait();

				console.log(`[${new Date().toISOString()}] Blockchain: Transaction confirmed, block: ${receipt.blockNumber}`);
			} catch (blockchainErr) {
				console.error(`[${new Date().toISOString()}] Blockchain error (non-fatal):`, blockchainErr.message);
				// Don't crash the server; still return success for MQTT publish
			}
		}

		const responsePayload = {
			success: true,
			message: 'Device command published successfully',
			topic: MQTT_CONTROL_TOPIC,
		};

		if (transactionHash) {
			responsePayload.transactionHash = transactionHash;
		}

		res.status(200).json(responsePayload);
	});
});

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
	console.error(`[${new Date().toISOString()}] Error:`, err.message);

	if (res.headersSent) {
		return next(err);
	}

	res.status(err.status || 500).json({
		error: 'Internal server error',
	});
});

app.listen(PORT, () => {
	console.log(`[${new Date().toISOString()}] Server started on port ${PORT}`);
});

