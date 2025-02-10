import { useEffect, useState } from "react";
import styles from "./users.module.css"
import axios from "axios";
const AllUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          "http://192.168.43.228:5010/get-users"
        );
        setUsers(response.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);
  return (
    <>
      <div>
        <div className="all-user-list">
          {users.map((user, index) => (
            <div key={index} className="user-item">
              {user.userName}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default AllUsers;
