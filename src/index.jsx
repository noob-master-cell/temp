import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind CSS and global styles
import AppWrapper from "./AppWrapper.jsx"; // Your main App component wrapper

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
