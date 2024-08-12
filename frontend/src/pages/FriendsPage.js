import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useUser } from './UserContext';

function FriendsPage() {
  const { currentUser } = useUser();
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const fetchFriends = async () => {
      try {
        const response = await axios.post('/fetch-friends', { user_id: currentUser.user_id });
        console.log('Fetched friends:', response.data.friends);
        setFriends(response.data.friends);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    const fetchFollowers = async () => {
      try {
        const response = await axios.post('/fetch-followers', { friend_id: currentUser.user_id });
        console.log('Fetched followers:', response.data.followers);
        setFollowers(response.data.followers);
      } catch (error) {
        console.error('Error fetching followers:', error);
      }
    };

    fetchFriends();
    fetchFollowers();
  }, [currentUser]);

  const fetchFriends = async () => {
    try {
      const response = await axios.post('/fetch-friends', { user_id: currentUser.user_id });
      console.log('Fetched friends:', response.data.friends);
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await axios.post('/fetch-followers', { friend_id: currentUser.user_id });
      console.log('Fetched followers:', response.data.followers);
      setFollowers(response.data.followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const removeFollow = async (friendId) => {
    try {
      const response = await axios.post('/remove-follow', { user_id: currentUser.user_id, friend_id: friendId, currentUser });
      if (response.data.message === 'Friend removed successfully') {
        setMessage('Friend removed successfully');
        await fetchFriends();
      } else {
        setMessage('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setMessage('Failed to remove friend');
    }
  };
  
  

  const removeFollower = async (followerId) => {
    try {
      const response = await axios.post('/remove-follower', { user_id: currentUser.user_id, follower_id: followerId });
      if (response.data.message === 'Follower removed successfully') {
        setMessage('Follower removed successfully');
        await fetchFollowers();
      } else {
        setMessage('Failed to remove follower');
      }
    } catch (error) {
      console.error('Error removing follower:', error);
      setMessage('Failed to remove follower');
    }
  };

  const followUser = async (userId) => {
    try {
      const response = await axios.post('/follow', { user_id: currentUser.user_id, friend_id: userId, currentUser });
      if (response.data.message === 'Friend added successfully') {
        setMessage('Friend added successfully');
        await fetchFriends();
        await fetchFollowers();
        // Add notification for the followed user
        const notificationContent = `${currentUser.user_name} started to follow you`;
        await axios.post('/add-follow-notification', { user_id: userId, notification_content: notificationContent });
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const searchUsers = async () => {
    try {
      const response = await axios.post('/search-users', { username: searchUsername });
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>; // Or a loading indicator
  }

  const visitProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="flex-grow p-6">
      <h1 className="text-3xl mb-6">Friends</h1>
      
      {message && <p className={`text-${message.includes('successfully') ? 'green' : 'red'}-500`}>{message}</p>}

      {/* Section 1: Search */}
      <div className="mb-6">
        <h2 className="text-2xl mb-4">Search</h2>
        <div className="flex mb-4">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-grow p-2 border rounded"
          />
          <button onClick={searchUsers} className="bg-blue-600 text-white px-4 py-2 rounded ml-2">Search</button>
        </div>
        {searchResults.length > 0 && (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Username</th>
                <th className="py-2 px-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map(user => (
                <tr key={user._id}>
                  <td className="py-2 px-4 border-b">{user.user_name}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => followUser(user._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                    >
                      Follow
                    </button>
                    <button
                      onClick={() => visitProfile(user._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Section 2: Following */}
      <div className="mb-6">
        <h2 className="text-2xl mb-4">Following</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Username</th>
              <th className="py-2 px-4 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {friends.map(friend => (
              <tr key={friend._id}>
                <td className="py-2 px-4 border-b">{friend.user_name}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => removeFollow(friend._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => visitProfile(friend._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3: Followers */}
      <div className="mb-6">
        <h2 className="text-2xl mb-4">Followers</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Username</th>
              <th className="py-2 px-4 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {followers.map(follower => (
              <tr key={follower._id}>
                <td className="py-2 px-4 border-b">{follower.user_name}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => removeFollower(follower._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => visitProfile(follower._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FriendsPage;
