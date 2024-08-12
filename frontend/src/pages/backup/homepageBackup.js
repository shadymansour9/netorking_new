import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CommentsSidebar from './CommentsSidebar';
import { Post } from '../entities/Post';
import { Comment } from '../entities/Comment';
import { Like } from '../entities/Like';
import axios from '../api/axios';
import { useUser } from './UserContext';

function HomePage() {
  const location = useLocation();
  const { currentUser } = useUser();
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState([]);
  const [sidebarTitle, setSidebarTitle] = useState('');
  const [message, setMessage] = useState('');

  const fetchUsername = async (userId) => {
    try {
      const response = await axios.get(`/user/${userId}`);
      return response.data.user_name;
    } catch (error) {
      console.error('Error fetching username:', error);
      return 'Unknown User';
    }
  };

  const enrichPostsData = async (posts, comments, likes) => {
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const username = await fetchUsername(post.user_id);
      const postLikes = await Promise.all(likes.filter(like => like.post_id === post._id.toString()).map(async (like) => {
        const likeUsername = await fetchUsername(like.user_id);
        return { ...like, username: likeUsername };
      }));
      const postComments = await Promise.all(comments.filter(comment => comment.post_id === post._id.toString()).map(async (comment) => {
        const commentUsername = await fetchUsername(comment.user_id);
        return {
          ...comment,
          username: commentUsername,
          comment_id: comment.comment_id, // Use the comment_id
        };
      }));

      return new Post(
        post.user_id,
        username,
        post._id.toString(),
        post.post_content,
        post.post_date,
        postLikes.map(like => new Like(like.post_id, like.user_id, like.username)),
        postComments
      );
    }));

    setPosts(enrichedPosts);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/fetch-data');
        const { posts, comments, likes } = response.data;

        console.log("Fetched comments:", comments); // Log the raw comments to inspect structure

        await enrichPostsData(posts, comments, likes);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const addPost = async () => {
    if (postContent.trim()) {
      const newPost = {
        user_id: currentUser.user_id,
        username: currentUser.user_name,
        post_content: postContent,
        post_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        likes_num: 0,
        comments_num: 0
      };

      try {
        const response = await axios.post('/add-post', newPost);
        if (response.data.message === 'Post added successfully') {
          setMessage('Post added successfully');
          setPosts([
            new Post(
              currentUser.user_id,
              currentUser.user_name,
              response.data.post_id,
              postContent,
              new Date().toLocaleString(),
              [],
              []
            ),
            ...posts
          ]);
          setPostContent('');
        } else {
          setMessage('Failed to add post');
        }
      } catch (error) {
        console.error('Error adding post:', error);
        setMessage('Failed to add post');
      }
    }
  };

  const addLike = async (postId) => {
    try {
      const response = await axios.post('/add-like', { post_id: postId, user: currentUser });
      if (response.data.message.includes('successfully')) {
        const updatedPosts = posts.map(post => {
          if (post.post_id === postId) {
            post.likes.push(new Like(postId, currentUser.user_id, currentUser.user_name));
            post.likes_num += 1; // Update the likes count
          }
          return post;
        });
        setPosts(updatedPosts);
      }
    } catch (error) {
      console.error('Error adding like:', error);
    }
  };

  const updatePost = async (postId) => {
    try {
      const response = await axios.get(`/post/${postId}`);
      return response.data; // Assuming the response contains the updated post data
    } catch (error) {
      console.error('Error fetching updated post data:', error);
      return null;
    }
  };

  const removeLike = async (postId) => {
    try {
      const response = await axios.post('/remove-like', { post_id: postId, user: currentUser });
      if (response.data.message.includes('successfully')) {
        const updatedPost = await updatePost(postId); // Fetch the updated post data
        if (updatedPost) {
          const updatedPosts = posts.map(post => 
            post.post_id === postId ? updatedPost : post
          );
          setPosts(updatedPosts); // Update the posts state with the updated post data
        }
      }
    } catch (error) {
      console.error('Error removing like:', error);
    }
  };

  const addComment = async (postId, commentContent) => {
    const commentData = {
      post_id: postId,
      user_id: currentUser.user_id,
      comment_content: commentContent,
      comment_date: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    try {
      const response = await axios.post('/add-comment', { ...commentData, user: currentUser });
      if (response.data.message === 'Comment added successfully') {
        const updatedPosts = posts.map(post => {
          if (post.post_id === postId) {
            post.comments.push(new Comment(postId, currentUser.user_id, commentContent, `comment_${post.comments.length + 1}`, currentUser.user_name));
            post.comments_num += 1;
          }
          return post;
        });
        setPosts(updatedPosts);
      } else {
        setMessage('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setMessage('Failed to add comment');
    }
  };

  const deleteComment = async (postId, commentId, userId) => {
    try {
      const response = await axios.post('/delete-comment', {
        post_id: postId,
        comment_id: commentId,
        user_id: userId,
      });

      if (response.data.message === 'Comment deleted successfully') {
        const updatedPost = await updatePost(postId);
        if (updatedPost) {
          const updatedPosts = posts.map(post =>
            post.post_id === postId ? updatedPost : post
          );
          setPosts(updatedPosts);
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const showComments = (comments) => {
    setSidebarContent(comments);
    setSidebarTitle('Comments');
    setShowSidebar(true);
  };

  const showLikes = (likes) => {
    setSidebarContent(likes);
    setSidebarTitle('Likes');
    setShowSidebar(true);
  };

  const CommentSection = ({ post, addComment, addLike, removeLike, deleteComment, currentUser }) => {
    const [commentContent, setCommentContent] = useState('');
    const [enrichedComments, setEnrichedComments] = useState([]);
    const [userHasLiked, setUserHasLiked] = useState(false); // Default to false

    useEffect(() => {
      const checkIfUserLiked = async () => {
        try {
          const response = await axios.post('/check-if-liked', {
            post_id: post.post_id,
            user: currentUser,
          });
          setUserHasLiked(response.data.liked);
        } catch (error) {
          console.error('Error checking if user has liked:', error);
        }
      };

      checkIfUserLiked();
    }, [post.post_id, currentUser]);

    useEffect(() => {
      const enrichComments = async () => {
        const enriched = await Promise.all(post.comments.map(async (comment) => {
          const username = await fetchUsername(comment.user_id);
          return {
            ...comment,
            username,
            comment_id: comment.comment_id, // Use the comment_id
          };
        }));
        console.log("Enriched comments:", enriched); // Log to confirm comment_id is present
        setEnrichedComments(enriched);
      };

      enrichComments();
    }, [post.comments]);

    const handleToggleLike = async () => {
      if (userHasLiked) {
        await removeLike(post.post_id);
        setUserHasLiked(false);
      } else {
        await addLike(post.post_id);
        setUserHasLiked(true);
      }
    };

    const handleAddComment = () => {
      if (commentContent.trim()) {
        addComment(post.post_id, commentContent);
        setCommentContent('');
      }
    };

    const handleDeleteComment = async (commentId) => {
      try {
        const response = await axios.post('/delete-comment', {
          post_id: post.post_id,
          comment_id: commentId,
          user_id: currentUser.user_id,
          current_user_name: currentUser.user_name, // Pass the current user's name
        });
    
        if (response.data.message === 'Comment deleted successfully') {
          const updatedPost = await updatePost(post.post_id);
          if (updatedPost) {
            const updatedPosts = posts.map((post) =>
              post.post_id === post.post_id ? updatedPost : post
            );
            setPosts(updatedPosts);
          }
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    };
    

    return (
      <div className="flex flex-col mt-4">
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Write a comment..."
        />
        <div className="flex items-center mt-2">
          <button
            onClick={handleToggleLike}
            className="bg-blue-500 text-white px-3 py-1 rounded mr-4"
          >
            {userHasLiked ? 'Unlike' : 'Like'}
          </button>
          <button
            onClick={handleAddComment}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700 transition duration-300"
          >
            Add Comment
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {enrichedComments.map((comment, index) => (
            <div key={index} className="bg-gray-100 p-2 rounded flex justify-between items-center">
              <div>
                <strong>{comment.username}:</strong> {comment.comment_content}
              </div>
              <button
                onClick={() => handleDeleteComment(comment.comment_id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow p-6">
      <h1 className="text-3xl mb-6">Welcome to the Home Page</h1>

      <div className="mb-6">
        {message && <p className="text-red-500">{message}</p>}
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="What's on your mind?"
        />
        <button onClick={addPost} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">Post</button>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.post_id} className="bg-white p-6 rounded-lg shadow-md relative">
            <span className="absolute top-2 right-2 text-gray-600 text-sm">{post.post_date}</span>
            <h2 className="font-semibold mb-2">{post.username}</h2>
            <p>{post.post_content}</p>
            <div className="mt-4">
              <span
                onClick={() => showLikes(post.likes)}
                className="cursor-pointer text-blue-500 mr-4"
              >
                Likes: {post.likes.length}
              </span>
              <span
                onClick={() => showComments(post.comments)}
                className="cursor-pointer text-blue-500 mr-4"
              >
                Comments: {post.comments.length}
              </span>
            </div>
            <CommentSection
              post={post}
              addComment={addComment}
              addLike={addLike}
              removeLike={removeLike}
              deleteComment={deleteComment}
              currentUser={currentUser}
            />
          </div>
        ))}
      </div>
      {showSidebar && (
        <CommentsSidebar
          title={sidebarTitle}
          content={sidebarContent}
          onClose={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}

export default HomePage;
