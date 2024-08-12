import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

const CommentsSidebar = ({ title, content, onClose }) => {
  const [enrichedContent, setEnrichedContent] = useState([]);

  useEffect(() => {
    console.log(content);
    const fetchUsername = async (userId) => {
      try {
        const response = await axios.get(`/user/${userId}`);
        return response.data.user_name;
      } catch (error) {
        console.error('Error fetching username:', error);
        return 'Unknown User';
      }
    };
  
    const enrichContent = async () => {
      const enriched = await Promise.all(content.map(async (item) => {
        let username ;
        
        if(title==='Comments')
       {  username = await fetchUsername(item.user_id);}
      else
       {   username = await fetchUsername(item.user);}

        return { ...item, username };
      }));
      setEnrichedContent(enriched);
    };

    enrichContent();
  }, [content]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end">
      <div className="bg-white w-1/3 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-red-500">Close</button>
        </div>
        <div className="space-y-4">
          {enrichedContent.map((item, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded">
              <strong>{item.username}:</strong> {item.comment_content || 'Liked'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommentsSidebar;
