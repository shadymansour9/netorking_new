// src/components/EditPost.js
import React, { useState } from 'react';
import axios from '../api/axios';

const EditPost = ({ post, fetchPosts, setEditing }) => {
  const [postContent, setPostContent] = useState(post.content);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/posts/${post.id}`, { content: postContent });
      fetchPosts();
      setEditing(false);
    } catch (error) {
      console.error('Error editing post', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
      />
      <button type="submit">Save</button>
      <button type="button" onClick={() => setEditing(false)}>Cancel</button>
    </form>
  );
};

export default EditPost;
