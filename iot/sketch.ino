#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include "DHTesp.h"

// --- Configuration ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";
const char* topic_control = "bbd-smarthome/control"; 
const char* topic_status = "bbd-smarthome/status";   

WiFiClient espClient;
PubSubClient client(espClient);
Servo myServo;
DHTesp dht;

// --- Pins ---
const int servoPin = 18;
const int ledPin = 2;
const int dhtPin = 4;
const int fanPin = 5;
const int buzzerPin = 19;

// --- System State ---
bool mcbActive = true; 
unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.print("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void triggerAlarm() {
  tone(buzzerPin, 1000, 500); 
}

void callback(char* topic, byte* payload, unsigned int length) {
  String cmd;
  for (int i = 0; i < length; i++) {
    cmd += (char)payload[i];
  }
  
  Serial.print("\n>>> Command Received: ");
  Serial.println(cmd);

  // --- 1. MCB MASTER OVERRIDE ---
  if (cmd == "MCB_OFF") {
    mcbActive = false;
    myServo.write(0);           
    digitalWrite(ledPin, LOW);  
    digitalWrite(fanPin, LOW);  
    triggerAlarm();             
    Serial.println("CRITICAL: MCB TRIPPED! System Halted.");
    return; 
  } 
  else if (cmd == "MCB_ON") {
    mcbActive = true;
    tone(buzzerPin, 2000, 200); 
    Serial.println("SYSTEM RESTORED: MCB Online.");
    return;
  }

  // --- 2. STANDARD LOGIC ---
  if (!mcbActive) {
    Serial.println("ERROR: Command ignored. MCB is OFF.");
    return;
  }

  if (cmd == "DOOR_OPEN") {
    myServo.write(90);
    Serial.println("Action: Door Unlocked");
  } else if (cmd == "DOOR_CLOSE") {
    myServo.write(0);
    Serial.println("Action: Door Locked");
  } else if (cmd == "LIGHT_ON") {
    digitalWrite(ledPin, HIGH);
    Serial.println("Action: Lights On");
  } else if (cmd == "LIGHT_OFF") {
    digitalWrite(ledPin, LOW);
    Serial.println("Action: Lights Off");
  } else if (cmd == "FAN_ON") {
    digitalWrite(fanPin, HIGH);
    Serial.println("Action: Fan Spinning");
  } else if (cmd == "FAN_OFF") {
    digitalWrite(fanPin, LOW);
    Serial.println("Action: Fan Stopped");
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to HiveMQ...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("Connected!");
      client.subscribe(topic_control);
    } else {
      Serial.print("Failed. Retrying in 5s...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  myServo.attach(servoPin);
  myServo.write(0); 
  
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW); 
  
  pinMode(fanPin, OUTPUT);
  digitalWrite(fanPin, LOW); 
  
  pinMode(buzzerPin, OUTPUT);

  dht.setup(dhtPin, DHTesp::DHT22);
  
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    float temp = dht.getTemperature();
    float hum = dht.getHumidity();
    
    String payload = "{\"temp\": " + String(temp, 1) + ", \"hum\": " + String(hum, 1) + ", \"mcb_status\": " + String(mcbActive ? "true" : "false") + "}";
    client.publish(topic_status, payload.c_str());
  }
}