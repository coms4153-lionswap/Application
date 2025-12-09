import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import About from "./pages/About";
import Login from "./pages/Login";
import Items from "./pages/Items";
import Conversations from "./pages/Conversations";
import Profile from "./pages/Profile";
import Reservations from "./pages/Reservations";
import OAuthCallback from "./pages/OAuthCallback";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/items" element={<Items />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
