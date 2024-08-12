// src/components/AddPost.js
import React, { useState } from 'react';
import axios from '../api/axios';

const AddPost = ({ fetchPosts }) => {
  const [postContent, setPostContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/posts', { content: postContent });
      setPostContent('');
      fetchPosts();
    } catch (error) {
      console.error('Error adding post', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        placeholder="What's on your mind?"
      />
      <button type="submit">Post</button>
    </form>
  );
};

export default AddPost;
