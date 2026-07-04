import { useState, useEffect } from "react";
import { useParams } from "react-router";
import getUserData from "../../hooks/getUserData";
import useUserCollection from "../useUserCollection";

const MyProfile = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupType, setPopupType] = useState("");
    const [optionType, setOptionType] = useState([]);
    const [userInfo, setUserInfo] = useState("");
    const { userId } = useParams();
    const { collectionsData = {}, loading, error } = useUserCollection(userId);

    useEffect(() => {
        const fetchUserData = async () => {
            const userData = await getUserData(userId);
            setUserInfo(userData);
        };
        fetchUserData();
    }, [userId]);

    const openPopup = async (type) => {
        setPopupType(type);
        const usersList = collectionsData[type] || [];
        const newType = await Promise.all(
            usersList.map(async (user) => {
                const userData = await getUserData(user.id);
                return userData;
            })
        );
        setOptionType(newType);
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setOptionType([]);
    };

    return (
        <div className="bg-gray-100 min-h-screen  p-6">
            {/* Profile Card */}
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
                {/* Cover Image */}
                <div className="relative w-full h-48 mb-6">
                    <img
                        src={userInfo?.coverPhotoURL || "https://via.placeholder.com/150"}
                        className="w-full h-full object-cover rounded-lg"
                        alt="Cover"
                    />
                </div>

                {/* Profile Image and Info */}
                <div className="flex flex-col items-center space-y-4 mb-6">
                    <img
                        src={userInfo?.photoURL || "https://via.placeholder.com/150"}
                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                        alt="Profile"
                    />
                    <h2 className="text-3xl font-semibold text-gray-900">{userInfo?.displayName || "User Name"}</h2>
                    <p className="text-gray-500">{userInfo?.email || "No email available"}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-8 mb-6">
                    {["followers", "following", "friends"].map((type) => (
                        <button
                            key={type}
                            onClick={() => openPopup(type)}
                            className="text-lg text-blue-500 hover:underline focus:outline-none transition duration-300 transform hover:scale-105"
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)} ({collectionsData[type]?.length || 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* Popup */}
            {isPopupOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-80">
                        <h3 className="font-semibold text-xl mb-4 text-gray-900">
                            {popupType.charAt(0).toUpperCase() + popupType.slice(1)}
                        </h3>
                        <ul>
                            {optionType.map((user, index) => (
                                <li key={index} className="flex items-center space-x-4 py-2 border-b border-gray-200">
                                    <img
                                        className="w-12 h-12 rounded-full object-cover"
                                        src={user?.photoURL || "https://via.placeholder.com/40"}
                                        alt="Profile"
                                    />
                                    <span className="text-gray-800">{user?.displayName || "Unknown User"}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={closePopup}
                            aria-label="Close popup"
                            className="mt-4 bg-blue-500 text-white py-2 px-6 rounded-full hover:bg-blue-600 transition duration-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProfile;
