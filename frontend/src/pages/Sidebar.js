import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';

const Sidebar = () => {
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  if (!currentUser) {
    return null; // Or a loading indicator
  }

  return (
    <div className="bg-gray-800 text-white w-64 p-6 flex flex-col">
      <div className="mb-6">
        <img src="/logo.png" alt="Logo" className="w-full h-auto" />
      </div>
      <nav className="flex-grow">
        <Link to="/home" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Home</Link>
        <Link to={`/profile/${currentUser.user_id}`} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Profile</Link>
        <Link to="/settings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Settings</Link>
        <Link to="/notifications" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Notifications</Link>
        <Link to="/messages" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Messages</Link>
        <Link to="/friends" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Friends</Link>
        <button
          onClick={handleLogout}
          className="block w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
        >
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
