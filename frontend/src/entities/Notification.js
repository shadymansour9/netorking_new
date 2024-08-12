import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useUser } from './UserContext';

function NotificationsPage() {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.post('/fetch-notifications', { user_id: currentUser.user_id });
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  // Render notifications
  return (
    <div className="flex-grow p-6">
      <h1 className="text-3xl mb-6">Notifications</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Notification Content</th>
            <th className="py-2 px-4 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map(notification => (
            <tr key={notification._id}>
              <td className={`py-2 px-4 border-b ${notification.seen ? 'text-gray-500' : 'font-bold'}`}>{notification.notification_content}</td>
              <td className="py-2 px-4 border-b">
                {!notification.seen && (
                  <button
                    onClick={() => markAsSeen(notification._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Mark as Seen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NotificationsPage;
