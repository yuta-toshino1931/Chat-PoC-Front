import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
// import { OpenAPI } from "./api/core/OpenAPI";

// APIのURLを設定
// OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL;
// console.log(OpenAPI.BASE);

// Vite React App のエントリーポイント
// id="root" のDOMに対してReactをマウントする
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
