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
        
        // Sort notifications by date in descending order
        const sortedNotifications = response.data.notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setNotifications(sortedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
  
    fetchNotifications();
  }, [currentUser]);
  

  const markAsSeen = async (notificationId) => {
    try {
      const response = await axios.post('/mark-notification-seen', { notification_id: notificationId });
      if (response.data.message === 'Notification marked as seen') {
        setNotifications(notifications.map(notification =>
          notification._id === notificationId ? { ...notification, seen: true } : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>; // Or a loading indicator
  }

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
