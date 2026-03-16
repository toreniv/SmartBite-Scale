#include <Arduino.h>
#include <HX711.h>

// =========================
// Pin Definitions
// =========================
const int HX711_DOUT_PIN = 4;
const int HX711_SCK_PIN  = 5;
const int TARE_BUTTON_PIN = 6;

// RGB LED pins - optional
const int LED_RED_PIN   = 9;
const int LED_GREEN_PIN = 10;
const int LED_BLUE_PIN  = 11;

// =========================
// HX711
// =========================
HX711 scale;

// חשוב - זה רק ערך התחלתי לדוגמה
// חייב לכייל בפועל
float calibrationFactor = -7050.0f;

// =========================
// Stream / Timing
// =========================
bool streamEnabled = true;
unsigned long lastSendTime = 0;
const unsigned long sendIntervalMs = 250;

// =========================
// Button debounce
// =========================
bool lastButtonReading = HIGH;
bool stableButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

// =========================
// Weight filter
// =========================
float filteredWeight = 0.0f;
bool filterInitialized = false;
const float alpha = 0.20f;

// =========================
// Serial command buffer
// =========================
String btBuffer = "";

// =========================
// RGB Helpers
// =========================
void setRGB(bool r, bool g, bool b) {
  digitalWrite(LED_RED_PIN,   r ? HIGH : LOW);
  digitalWrite(LED_GREEN_PIN, g ? HIGH : LOW);
  digitalWrite(LED_BLUE_PIN,  b ? HIGH : LOW);
}

void setStatusIdle() {
  // כחול - מוכן
  setRGB(0, 0, 1);
}

void setStatusStreaming() {
  // ירוק - משדר
  setRGB(0, 1, 0);
}

void setStatusError() {
  // אדום - שגיאה
  setRGB(1, 0, 0);
}

void setStatusTare() {
  // צהוב = אדום + ירוק
  setRGB(1, 1, 0);
}

// =========================
// Bluetooth send helper
// =========================
void sendBT(const String& msg) {
  Serial1.println(msg);
  Serial.print("BT >> ");
  Serial.println(msg);
}

// =========================
// Tare
// =========================
void tareScale() {
  setStatusTare();
  scale.tare();
  filteredWeight = 0.0f;
  filterInitialized = false;
  sendBT("TARE_DONE");
  delay(200);
  
  if (streamEnabled) {
    setStatusStreaming();
  } else {
    setStatusIdle();
  }
}

// =========================
// Read filtered weight
// =========================
float readWeightGrams() {
  if (!scale.is_ready()) {
    setStatusError();
    return filteredWeight;
  }

  float rawWeight = scale.get_units(3);

  // Noise floor
  if (abs(rawWeight) < 0.5f) {
    rawWeight = 0.0f;
  }

  if (!filterInitialized) {
    filteredWeight = rawWeight;
    filterInitialized = true;
  } else {
    filteredWeight = alpha * rawWeight + (1.0f - alpha) * filteredWeight;
  }

  return filteredWeight;
}

// =========================
// Command handler
// =========================
void handleCommand(String cmd) {
  cmd.trim();
  cmd.toUpperCase();

  Serial.print("CMD << ");
  Serial.println(cmd);

  if (cmd == "TARE") {
    tareScale();
  }
  else if (cmd == "STREAM_ON") {
    streamEnabled = true;
    setStatusStreaming();
    sendBT("STATUS:STREAM_ON");
  }
  else if (cmd == "STREAM_OFF") {
    streamEnabled = false;
    setStatusIdle();
    sendBT("STATUS:STREAM_OFF");
  }
  else if (cmd == "STATUS") {
    sendBT(String("STATUS:") + (streamEnabled ? "STREAM_ON" : "STREAM_OFF"));
  }
  else if (cmd == "PING") {
    sendBT("PONG");
  }
  else {
    setStatusError();
    sendBT("ERROR:UNKNOWN_COMMAND");
    delay(200);
    if (streamEnabled) {
      setStatusStreaming();
    } else {
      setStatusIdle();
    }
  }
}

// =========================
// Read commands from HC-06
// =========================
void readBluetoothCommands() {
  while (Serial1.available()) {
    char c = (char)Serial1.read();

    if (c == '\n' || c == '\r') {
      if (btBuffer.length() > 0) {
        handleCommand(btBuffer);
        btBuffer = "";
      }
    } else {
      btBuffer += c;
    }
  }
}

// =========================
// Check physical tare button
// =========================
void updateTareButton() {
  bool reading = digitalRead(TARE_BUTTON_PIN);

  if (reading != lastButtonReading) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != stableButtonState) {
      stableButtonState = reading;

      // Button pressed
      if (stableButtonState == LOW) {
        tareScale();
      }
    }
  }

  lastButtonReading = reading;
}

// =========================
// Setup
// =========================
void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);  // HC-06 default is usually 9600

  pinMode(TARE_BUTTON_PIN, INPUT_PULLUP);

  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_BLUE_PIN, OUTPUT);

  setStatusIdle();

  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale(calibrationFactor);
  scale.tare();

  Serial.println("SmartBite Scale system ready");
  sendBT("STATUS:READY");
}

// =========================
// Main loop
// =========================
void loop() {
  readBluetoothCommands();
  updateTareButton();

  if (millis() - lastSendTime >= sendIntervalMs) {
    lastSendTime = millis();

    float weight = readWeightGrams();

    Serial.print("Weight: ");
    Serial.println(weight, 2);

    if (streamEnabled) {
      setStatusStreaming();
      sendBT("WEIGHT:" + String(weight, 2));
    }
  }
}