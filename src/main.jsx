import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./state/ThemeContext.jsx";
import { ChildrenProvider } from "./state/ChildrenContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ChildrenProvider>
          <App />
        </ChildrenProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
