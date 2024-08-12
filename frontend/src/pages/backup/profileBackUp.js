import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';
import { useUser } from './UserContext';

function ProfilePage() {
  const { currentUser } = useUser();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/user/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError('Error fetching user details');
        console.error('Error fetching user details:', err);
      }
    };

    fetchUser();
  }, [userId]);

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="flex-grow p-6">
      <h1 className="text-3xl mb-6">Profile Page</h1>
      {user.photo && <img src={user.photo} alt={`${user.user_name}'s profile`} className="mb-4 rounded-full w-32 h-32 object-cover" />}
      <p><strong>User Name:</strong> {user.user_name}</p>
      <p><strong>First Name:</strong> {user.first_name}</p>
      <p><strong>Last Name:</strong> {user.last_name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Phone Number:</strong> {user.phone_number}</p>
      <p><strong>Education:</strong> {user.education}</p>
      <p><strong>Gender:</strong> {user.gender}</p>
    </div>
  );
}

export default ProfilePage;
