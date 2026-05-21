import axios from 'axios';

const getUserData = async (uid) => {
  if (!uid) return null;

  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    
    // Hit the Express backend to fetch the user profile from MongoDB
    const response = await axios.get(`${backendUrl}/api/users/${uid}`);
    
    if (response.data) {
      return response.data;
    } else {
      console.log('User document not found in MongoDB');
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data from MongoDB:", error.response?.data || error.message);
    return null; // Return null if an error occurs so the UI doesn't crash
  }
};

export default getUserData;