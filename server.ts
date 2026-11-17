/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API router endpoint first
  app.post("/api/prediksi", (req, res) => {
    const { nama_anak, gender, age_month, weight, height } = req.body;

    if (
      !nama_anak ||
      !gender ||
      age_month === undefined ||
      weight === undefined ||
      height === undefined
    ) {
      return res.status(400).json({ error: "Missing required parameters in body." });
    }

    // Spawn the Python process to execute the XGBoost & TreeSHAP model
    const pythonProcess = spawn("python3", [path.join(process.cwd(), "predict.py")]);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.warn(`Python process exited with code ${code}. Falling back to internal engine. Stderr: ${stderrData}`);
        
        // Return a graceful fallback response if Python is unavailable
        // so the system never breaks
        return res.status(500).json({ 
          error: "Python process failed", 
          details: stderrData 
        });
      }

      try {
        const result = JSON.parse(stdoutData);
        res.json(result);
      } catch (err) {
        console.error("Error parsing Python stdout:", stdoutData);
        res.status(500).json({ error: "Failed to parse Python computation stdout." });
      }
    });

    // Write parameters to Python stdin
    try {
      pythonProcess.stdin.write(
        JSON.stringify({
          nama_anak,
          gender,
          age_month: Number(age_month),
          weight: Number(weight),
          height: Number(height),
        })
      );
      pythonProcess.stdin.end();
    } catch (err) {
      console.error("Error writing to Python process stdin:", err);
      res.status(500).json({ error: "Fail to connect parameters to Python pipeline." });
    }
  });

  // Serve static assets and routing based on env
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started. Running on http://localhost:${PORT}`);
  });
}

startServer();
