import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { SendHorizontal } from "lucide-react";

const ChatPage = ({ socket }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const currentUserId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [chatPartnerName, setChatPartnerName] = useState(null);
  const [chatPartnerId, setChatPartnerId] = useState(null);
  const [isTyping, setIsTyping] = useState(false); // Track typing status
  const [partnerTyping, setPartnerTyping] = useState(false); // Track partner's typing status

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          "http://192.168.43.228:5010/get-users"
        );
        const currentUserId = localStorage.getItem("userId");

        // Filter out the current user
        const filteredUsers = response.data.filter(
          (user) => user._id !== currentUserId
        );

        setUsers(filteredUsers); // Set the filtered users
        console.log(filteredUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit("user_connected", currentUserId);

    socket.on("receive_message", (data) => {
      console.log("Received message:", data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });
    socket.on("typing", (userId) => {
      if (userId === chatPartnerId) {
        setPartnerTyping(true);
      }
    });
    socket.on("stop_typing", (userId) => {
      if (userId === chatPartnerId) {
        setPartnerTyping(false); // Partner stopped typing
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [socket, currentUserId, chatPartnerId]);

  const sendMessage = () => {
    if (message.trim() && chatPartnerId) {
      const messageData = {
        message,
        userId: currentUserId, // Sender's ID
        chatPartnerId: chatPartnerId, // Receiver's ID
        timestamp: new Date().toISOString(),
      };

      console.log("Sending message:", messageData);
      socket.emit("send_message", messageData);

      // Update the messages state immediately
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setMessage(""); // Clear the input field
    } else {
      console.log("Cannot send message: chat partner not selected");
    }
  };

  // const handleCharPartner = async (user) => {
  //   setChatPartnerName(user.userName);
  //   setChatPartnerId(user._id); // Fix: Use user._id instead of user_id
  //   console.log("Selected chat partner:", user);
  //   try {
  //     // Fetch chat history
  //     const response = await axios.get(
  //       "http://192.168.43.228:5010/get-messages",
  //       {
  //         params: {
  //           userId: currentUserId,
  //           chatPartnerId: user._id,
  //         },
  //       }
  //     );

  //     console.log(response.data);
  //     // Set the chat history in the messages state
  //     setMessages(response.data);
  //   } catch (err) {
  //     console.error("Failed to fetch chat history:", err);
  //   }
  // };
  const handleCharPartner = async (user) => {
    setChatPartnerName(user.userName);
    setChatPartnerId(user._id);

    console.log("Selected chat partner:", user);
    try {
      // Fetch chat history
      const response = await axios.get(
        "http://192.168.43.228:5010/get-messages",
        {
          params: {
            userId: currentUserId,
            chatPartnerId: user._id,
          },
        }
      );

      // Ensure messages are in the correct format
      const formattedMessages = response.data.map((msg) => ({
        message: msg.message,
        userId: msg.senderId, // Convert senderId to userId
        chatPartnerId: msg.receiverId, // Convert receiverId to chatPartnerId
        timestamp: msg.timestamp,
      }));

      console.log("Fetched chat history:", formattedMessages);
      setMessages(formattedMessages);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(); // Send the message
    }
  };
  // handle typing status
  const handleInputChange = (e) => {
    const message = e.target.value;
    setMessage(message);
    if (!isTyping && message.trim()) {
      socket.emit("typing", chatPartnerId);
      setIsTyping(true);
    } else {
      setIsTyping(false);
      socket.emit("stop_typing", currentUserId);
    }
  };

  return (
    <div className="chat-container">
      <h1>Talk's</h1>
      <div className="chat-area">
        <div className="user-list">
          <div>
            {users.map((user, index) => (
              <div
                key={index}
                className={`user ${chatPartnerId === user._id ? "active" : ""}`}
                onClick={() => handleCharPartner(user)}
              >
                {user.userName}
              </div>
            ))}
          </div>
          <div
            onClick={() => {
              localStorage.removeItem("userId");
              navigate("/");
            }}
            className="logout-btn"
          >
            Logout
          </div>
        </div>
        <div className="chat-box">
          <div className="current-partner">
            {chatPartnerName
              ? chatPartnerName.toUpperCase()
              : "Select User to Chat"}
          </div>
          <div className="messages-container">
            {messages
              .filter(
                (msg) =>
                  (msg.userId === currentUserId &&
                    msg.chatPartnerId === chatPartnerId) || // Messages sent by current user to chat partner
                  (msg.userId === chatPartnerId &&
                    msg.chatPartnerId === currentUserId) // Messages received from chat partner
              )
              .map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.userId === currentUserId ? "sent" : "received"
                  }`}
                >
                  {msg.message}
                </div>
              ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              // onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress} // Add key press handler
              placeholder="Type a message..."
              disabled={!chatPartnerName}
            />
            <button onClick={sendMessage} disabled={!chatPartnerName}>
              <SendHorizontal />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
