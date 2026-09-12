import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import illustration from "../assets/logo-illustration.jpeg";
import "./AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const session = await loginUser({ email, password, role });
      localStorage.setItem("auth_session", JSON.stringify(session));
      navigate(role === "admin" ? "/admin" : "/invigilator", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-illustration">
          <img src={illustration} alt="Mountain landscape illustration" />
        </div>

        {/* RIGHT SIDE */}
        <div className="login-form-section">
          <form className="login-form" onSubmit={handleSubmit}>

            <h1>Sign in to your Account</h1>

            <div className="role-switch" aria-label="Choose account type">
              <span>Account type</span>
              <button
                type="button"
                className={role === "admin" ? "role-option active" : "role-option"}
                onClick={() => setRole("admin")}
                aria-pressed={role === "admin"}
              >
                Admin
              </button>
              <button
                type="button"
                className={role === "invigilator" ? "role-option active" : "role-option"}
                onClick={() => setRole("invigilator")}
                aria-pressed={role === "invigilator"}
              >
                Invigilator
              </button>
            </div>

            <div className="input-group">
              <input
                type="email"
                placeholder="Email Address"
                aria-label="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                aria-label="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <a href="#" className="forgot-password">
              Forgot your password?
            </a>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" className="sign-in-button" disabled={submitting}>
              {submitting ? "Signing In..." : "Sign In"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;