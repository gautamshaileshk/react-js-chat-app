import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const Register = ({socket}) => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://192.168.43.228:5010/register-user", {
        userName,
        password,
      });
      console.log(response)
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("sender_id",response.data.userId)
      socket.emit("sender_id",  response.data.userId);
      setMessage(`User registered with ID: ${response.data.userId}`);
      navigate("/chat");
    } catch (error) {
      setMessage("Failed to create user");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://192.168.43.228:5010/login", {
        userName,
        password,
      });
      console.log(response);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("sender_id",response.data.userId)
      socket.emit("sender_id",  response.data.userId);
      setMessage(`Logged in as ${userName}`);
      navigate("/chat");
    } catch (error) {
      setMessage("Invalid username or password");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="submit-button">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <p className="toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button className="toggle-button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
        {message && (
          <div className="error-container">
            <div className={`message ${message.includes("Failed") || message.includes("Invalid") ? "error" : "success"}`}>
            {message}
          </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Register;