import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const apiVersion = process.env.OPENAI_API_VERSION;

const isProd = process.env.NODE_ENV === "production";   // ←★追加

// Configure Vite middleware for React client
let vite;
if (!isProd) {
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  // 本番はビルド済み静的ファイルを配信
  app.use(
    express.static(path.resolve(__dirname, "dist/client"), { index: false }),
  );
}

// API route for token generation
app.get("/token", async (req, res) => {
  try {

    // Generate ephemeral token for the client
    // see: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/realtime-audio-webrtc
    const response = await fetch(
      `${endpoint}openai/realtimeapi/sessions?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: deploymentName,
          voice: "verse",
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;
  try {
    let template, render;

    if (!isProd) {
      // 開発時: index.html を変換して動的インポート
      template = await vite.transformIndexHtml(
        url,
        fs.readFileSync("./client/index.html", "utf-8"),
      );
      ({ render } = await vite.ssrLoadModule("./client/entry-server.jsx"));
    } else {
      // 本番時: ビルド成果物を使用
      template = fs.readFileSync(
        path.resolve(__dirname, "dist/client/index.html"),
        "utf-8",
      );
      ({ render } = await import("./dist/server/index.js"));
    }

    const appHtml = await render(url);
    const html = template.replace("<!--ssr-outlet-->", appHtml.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    if (!isProd && vite) vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
