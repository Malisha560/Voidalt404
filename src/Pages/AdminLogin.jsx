import React, { useState } from "react";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Email:", email);
    console.log("Password:", password);
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* LEFT SIDE */}
        <div className="login-illustration">

          {/* Decorative curves */}
          <svg
            className="decorative-lines"
            viewBox="0 0 500 600"
            preserveAspectRatio="none"
          >
            <path
              className="line line-yellow"
              d="M-20 100
                 C70 80, 90 120, 130 180
                 C180 255, 220 260, 270 250
                 C330 238, 325 160, 325 100
                 C325 50, 350 20, 390 0"
            />

            <path
              className="line line-green"
              d="M-20 105
                 C65 85, 90 125, 135 185
                 C185 255, 220 270, 275 255
                 C335 240, 330 160, 330 100
                 C330 45, 355 15, 395 -5"
            />

            <path
              className="line line-yellow lower"
              d="M-20 520
                 C60 520, 120 500, 180 465
                 C240 430, 280 445, 335 450
                 C405 455, 440 445, 510 380"
            />

            <path
              className="line line-green lower"
              d="M210 600
                 C200 550, 190 515, 220 470
                 C250 425, 290 420, 340 425
                 C405 435, 455 420, 510 375"
            />
          </svg>

          {/* Mountains */}
          <div className="mountains">
            <div className="mountain mountain-back"></div>
            <div className="mountain mountain-front"></div>
          </div>

          {/* Hills */}
          <div className="hills">
            <div className="hill hill-one"></div>
            <div className="hill hill-two"></div>
          </div>

          {/* Tree */}
          <div className="tree">
            <div className="tree-top"></div>
            <div className="tree-trunk"></div>
          </div>

          {/* Temple */}
          <div className="temple">
            <div className="temple-roof"></div>
            <div className="temple-body"></div>
            <div className="temple-base"></div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-form-section">
          <form className="login-form" onSubmit={handleSubmit}>

            <h1>Sign in to your Admin Account</h1>

            <div className="input-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <a href="#" className="forgot-password">
              Forgot your password?
            </a>

            <button type="submit" className="sign-in-button">
              Sign In
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;