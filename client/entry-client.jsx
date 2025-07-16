import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import liff from "@line/liff";
import App from "./components/App";
import "./base.css";

// LIFF初期化処理
async function initializeLiff() {
  try {
    const liffId = import.meta.env.VITE_LIFF_ID || process.env.LIFF_ID;
    
    if (!liffId) {
      console.warn("LIFF_ID is not set");
      return;
    }

    await liff.init({ liffId });
    console.log("LIFF initialized successfully");
  } catch (error) {
    console.error("LIFF initialization failed:", error);
  }
}

// LIFF初期化後にReactアプリをレンダリング
initializeLiff().then(() => {
  ReactDOM.hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
