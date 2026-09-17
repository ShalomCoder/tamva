import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/tables.css";
import "./styles/charts.css";
import "./styles/dashboard.css";
import "./styles/risk.css";
import "./styles/network.css";
import "./styles/integrations.css";
import "./styles/auth.css";
import "./styles/responsive.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
