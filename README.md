# Steps<p align="center">
  <img src="[INSERT_LINK_TO_YOUR_MAIN_DASHBOARD_SCREENSHOT_HERE]" alt="Smart Home Dashboard" width="100%">
</p>

<h1 align="center">Decentralized Smart Home Relayer System</h1>

<p align="center">
  <strong>A hybrid Web2/Web3 IoT architecture bridging ultra-fast hardware control with immutable blockchain security.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity">
  <img src="https://img.shields.io/badge/MQTT-660066?style=for-the-badge&logo=mqtt&logoColor=white" alt="MQTT">
</p>

---

## 📖 Overview
Modern IoT architectures force a compromise between speed and security. Centralized databases are fast but vulnerable to tampering, while standard Web3 decentralized applications (dApps) introduce severe latency and user friction (like MetaMask popups). 

This project solves the "Latency-Security Bottleneck" by introducing an **Admin Relayer Middleware**. When a user clicks a button, the system simultaneously publishes a lightweight MQTT payload for instantaneous physical actuation (<200ms) while asynchronously mining an unalterable security log to an Ethereum blockchain (~2s) in the background.

## ✨ Key Features
* ⚡ **Zero-Friction UI:** Control devices seamlessly without needing a Web3 wallet.
* 🔒 **Immutable Audit Trail:** Every state change is cryptographically signed and stored permanently on-chain.
* 🤖 **Dual-Stream Execution:** Parallel processing prevents slow blockchain consensus from lagging the physical hardware.
* 🔌 **Real-time Simulation:** Complete physical hardware emulation via Wokwi (ESP32, Servos, DHT22, Relays).

---

## 🏗️ System Architecture

1. **Frontend (React.js):** Provides a standard Web2 dashboard and a read-only Web3 ledger viewer.
2. **Backend Relayer (Node.js/Express):** The core routing engine. Secures the admin private key, formats commands, and handles dual-stream dispatch.
3. **Hardware (Wokwi/ESP32):** Subscribes to the HiveMQ public broker and actuates physical GPIO pins based on incoming payloads.
4. **Blockchain (Ganache/Solidity):** A local Ethereum testnet running the `HomeSecurity` smart contract to permanently record access logs.

---

## 🚀 Step-by-Step Running Guide

Follow these instructions strictly to run the full-stack architecture on your local machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* [Ganache](https://trufflesuite.com/ganache/) (Local Ethereum Workspace)
* A [Wokwi](https://wokwi.com) account

### Step 1: Clone and Install
Clone the repository and install the necessary dependencies for both the frontend and backend.
```bash
git clone [https://github.com/your-username/minorproject.git](https://github.com/your-username/minorproject.git)
cd minorproject

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
cd ..