import React, { useState, useEffect } from "react";
import qz from "qz-tray";
import {
  Printer,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const QzTrayTestPage = () => {
  const [qzStatus, setQzStatus] = useState("disconnected");
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [printStatus, setPrintStatus] = useState("");
  const [paperSize, setPaperSize] = useState("57mm");
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  // Connect to QZ Tray
  const connectToQz = async () => {
    try {
      setQzStatus("connecting");
      addLog("Connecting to QZ Tray...", "info");

      if (qz.websocket.isActive()) {
        addLog("Already connected to QZ Tray", "success");
        setQzStatus("connected");
        return;
      }

      await qz.websocket.connect();
      setQzStatus("connected");
      addLog("Successfully connected to QZ Tray!", "success");

      // Auto-fetch printers after connection
      await fetchPrinters();
    } catch (err) {
      setQzStatus("error");
      addLog(`Connection failed: ${err.message}`, "error");
      console.error("QZ Tray connection error:", err);
    }
  };

  // Disconnect from QZ Tray
  const disconnectFromQz = async () => {
    try {
      if (qz.websocket.isActive()) {
        await qz.websocket.disconnect();
        setQzStatus("disconnected");
        setPrinters([]);
        setSelectedPrinter("");
        addLog("Disconnected from QZ Tray", "info");
      }
    } catch (err) {
      addLog(`Disconnect error: ${err.message}`, "error");
    }
  };

  // Fetch available printers
  const fetchPrinters = async () => {
    try {
      addLog("Fetching available printers...", "info");
      const printerList = await qz.printers.find();
      setPrinters(printerList);
      addLog(`Found ${printerList.length} printer(s)`, "success");

      if (printerList.length > 0) {
        setSelectedPrinter(printerList[0]);
      }
    } catch (err) {
      addLog(`Failed to fetch printers: ${err.message}`, "error");
    }
  };

  // Test print using RAW commands (ESC/POS)
  const testPrintRaw = async () => {
    if (!selectedPrinter) {
      addLog("Please select a printer first", "error");
      return;
    }

    try {
      setPrintStatus("printing");
      addLog(`Sending RAW print to ${selectedPrinter}...`, "info");

      const config = qz.configs.create(selectedPrinter);

      // ESC/POS commands for thermal printer
      const data = [
        "\x1B\x40", // Initialize printer
        "\x1B\x61\x01", // Center alignment
        "\x1B\x21\x30", // Double height + Double width
        "QZ TRAY TEST\n",
        "\x1B\x21\x00", // Normal text
        "================================\n",
        "\x1B\x61\x00", // Left alignment
        "Date: " + new Date().toLocaleDateString() + "\n",
        "Time: " + new Date().toLocaleTimeString() + "\n",
        "--------------------------------\n",
        "Item              Qty    Amount\n",
        "--------------------------------\n",
        "Test Item 1        2      5,000\n",
        "Test Item 2        1      3,000\n",
        "Test Item 3        3      9,000\n",
        "--------------------------------\n",
        "\x1B\x61\x02", // Right alignment
        "Subtotal:         17,000\n",
        "Tax (5%):            850\n",
        "\x1B\x21\x10", // Double height
        "TOTAL:            17,850 Ks\n",
        "\x1B\x21\x00", // Normal text
        "\x1B\x61\x01", // Center alignment
        "--------------------------------\n",
        "Thank you for your purchase!\n",
        "\n\n\n",
        "\x1D\x56\x00", // Cut paper (full cut)
      ];

      await qz.print(config, data);
      setPrintStatus("success");
      addLog("RAW print sent successfully!", "success");
    } catch (err) {
      setPrintStatus("error");
      addLog(`RAW print failed: ${err.message}`, "error");
    }
  };

  // Test print using HTML (rendered as image)
  const testPrintHtml = async () => {
    if (!selectedPrinter) {
      addLog("Please select a printer first", "error");
      return;
    }

    try {
      setPrintStatus("printing");
      addLog(`Sending HTML print to ${selectedPrinter}...`, "info");

      const paperWidth = parseInt(paperSize) || 57;

      const config = qz.configs.create(selectedPrinter, {
        size: { width: paperWidth, height: null },
        units: "mm",
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                width: ${paperWidth - 8}mm;
                margin: 0;
                padding: 2mm;
              }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .title { font-size: 14px; font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 2mm 0; }
              .row { display: flex; justify-content: space-between; }
              .total { font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="center">
              <div class="title">QZ TRAY HTML TEST</div>
              <div class="divider"></div>
              <div>Date: ${new Date().toLocaleDateString()}</div>
              <div>Time: ${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="divider"></div>
            <div class="row"><span>Test Item 1 x2</span><span>5,000</span></div>
            <div class="row"><span>Test Item 2 x1</span><span>3,000</span></div>
            <div class="row"><span>Test Item 3 x3</span><span>9,000</span></div>
            <div class="divider"></div>
            <div class="row"><span>Subtotal</span><span>17,000</span></div>
            <div class="row"><span>Tax (5%)</span><span>850</span></div>
            <div class="divider"></div>
            <div class="row total"><span>TOTAL</span><span>17,850 Ks</span></div>
            <div class="divider"></div>
            <div class="center">Thank you!</div>
          </body>
        </html>
      `;

      const data = [
        {
          type: "html",
          format: "plain",
          data: htmlContent,
        },
      ];

      await qz.print(config, data);
      setPrintStatus("success");
      addLog("HTML print sent successfully!", "success");
    } catch (err) {
      setPrintStatus("error");
      addLog(`HTML print failed: ${err.message}`, "error");
    }
  };

  // Test print using pixel-based printing
  const testPrintPixel = async () => {
    if (!selectedPrinter) {
      addLog("Please select a printer first", "error");
      return;
    }

    try {
      setPrintStatus("printing");
      addLog(`Sending Pixel print to ${selectedPrinter}...`, "info");

      const paperWidth = parseInt(paperSize) || 57;

      const config = qz.configs.create(selectedPrinter, {
        size: { width: paperWidth, height: null },
        units: "mm",
        colorType: "grayscale",
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      // Create a simple receipt using pixel printing
      const data = [
        {
          type: "pixel",
          format: "html",
          data: `
          <div style="font-family: monospace; font-size: 10px; width: ${
            paperWidth - 8
          }mm; padding: 2mm;">
            <div style="text-align: center; font-size: 14px; font-weight: bold;">PIXEL PRINT TEST</div>
            <hr style="border-top: 1px dashed black;">
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Time: ${new Date().toLocaleTimeString()}</div>
            <hr style="border-top: 1px dashed black;">
            <div style="display: flex; justify-content: space-between;"><span>Item 1</span><span>5,000</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Item 2</span><span>3,000</span></div>
            <hr style="border-top: 1px dashed black;">
            <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>TOTAL</span><span>8,000 Ks</span></div>
            <hr style="border-top: 1px dashed black;">
            <div style="text-align: center;">Thank you!</div>
          </div>
        `,
        },
      ];

      await qz.print(config, data);
      setPrintStatus("success");
      addLog("Pixel print sent successfully!", "success");
    } catch (err) {
      setPrintStatus("error");
      addLog(`Pixel print failed: ${err.message}`, "error");
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qz.websocket.isActive()) {
        qz.websocket.disconnect();
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (qzStatus) {
      case "connected":
        return "text-green-600";
      case "connecting":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (qzStatus) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "connecting":
        return <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Printer className="w-7 h-7" />
          QZ Tray Thermal Printer Test
        </h1>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`font-medium ${getStatusColor()}`}>
                Status: {qzStatus.charAt(0).toUpperCase() + qzStatus.slice(1)}
              </span>
            </div>
            <div className="flex gap-2">
              {qzStatus !== "connected" ? (
                <button
                  onClick={connectToQz}
                  disabled={qzStatus === "connecting"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect to QZ Tray
                </button>
              ) : (
                <button
                  onClick={disconnectFromQz}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Printer Selection */}
          {qzStatus === "connected" && (
            <div className="flex items-center gap-4">
              <label className="font-medium">Printer:</label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a printer</option>
                {printers.map((printer, index) => (
                  <option key={index} value={printer}>
                    {printer}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchPrinters}
                className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                title="Refresh printers"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Paper Size Selection */}
        {qzStatus === "connected" && (
          <div className="mb-6">
            <label className="font-medium block mb-2">Paper Size:</label>
            <div className="flex gap-2">
              {["57mm", "58mm", "80mm"].map((size) => (
                <button
                  key={size}
                  onClick={() => setPaperSize(size)}
                  className={`px-4 py-2 rounded-lg border ${
                    paperSize === size
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Print Buttons */}
        {qzStatus === "connected" && (
          <div className="mb-6">
            <h2 className="font-medium mb-3">Test Print Options:</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testPrintRaw}
                disabled={!selectedPrinter || printStatus === "printing"}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🖨️ RAW Print (ESC/POS)
              </button>
              <button
                onClick={testPrintHtml}
                disabled={!selectedPrinter || printStatus === "printing"}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📄 HTML Print
              </button>
              <button
                onClick={testPrintPixel}
                disabled={!selectedPrinter || printStatus === "printing"}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🖼️ Pixel Print
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Make sure QZ Tray is installed and running on your computer</li>
            <li>Click "Connect to QZ Tray" to establish connection</li>
            <li>Select your thermal printer from the dropdown</li>
            <li>Choose paper size (57mm, 58mm, or 80mm)</li>
            <li>Click one of the print test buttons</li>
          </ol>
          <div className="mt-3 text-sm text-blue-600">
            <strong>Note:</strong> Download QZ Tray from{" "}
            <a
              href="https://qz.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              https://qz.io/download/
            </a>
          </div>
        </div>

        {/* Logs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Logs:</h2>
            <button
              onClick={clearLogs}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                      ? "text-green-400"
                      : "text-gray-300"
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QzTrayTestPage;
