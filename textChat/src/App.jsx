import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";
import { BrowserRouter, Routes, Route,useNavigate } from "react-router-dom";
import Register from "./pages/register";
import ChatPage from "./pages/chat";
const socket = io("http://192.168.43.228:5010");
function App(){
    return <>
      <BrowserRouter>
      <AppContent/>
      </BrowserRouter>
    </>
}
function AppContent() {

  const navigate = useNavigate();
  useEffect(() => {
    const userlogin = localStorage.getItem("userId");
    if (userlogin) {
      navigate("/chat");
    }
  }, [navigate]); 



  return (
    <>
      <div className="container">
        <Routes>
          <Route path="/" element={<Register socket={socket}/>}/>
          <Route path="/chat" element={<ChatPage socket={socket}/>}/>
        </Routes>
      </div>
    </>
  );
}

export default App;
