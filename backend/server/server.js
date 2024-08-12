const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('./database');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3005; // Define the port here

// Middleware
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://netorking-new.vercel.app'], // Remove the trailing slash in the deployed frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true // Allow cookies and other credentials
}));

// Database connection
let db;
connectToDb((err) => {
    if (!err) {
        db = getDb();
        app.listen(port, () => {
            console.log(`App listening on port ${port}`);
        });
    } else {
        console.error('Failed to connect to the database');
    }
});

// User registration endpoint
app.post('/register', async (req, res) => {
    console.log('Request received at /register');
    console.log('Request body:', req.body);

    const { username, first_name, last_name, gender, email, password, phone_number, education, photo, skills, recovery_q1, recovery_q2 } = req.body;

    try {
        // Create user object
        const newUser = {
            user_name: username,
            first_name,
            last_name,
            gender,
            email,
            password,
            phone_number,
            education,
            photo
        };

        // Insert new user into users collection
        const result = await db.collection('users').insertOne(newUser);

        if (result.acknowledged && result.insertedId) {
            const userId = result.insertedId;

            // Insert skills into skills collection
            const skillsData = skills.map(skill => ({ user_id: userId, skill }));
            await db.collection('skills').insertMany(skillsData);

            // Insert recovery questions into recovery_questions collection
            const recoveryData = {
                user_id: userId,
                question1: recovery_q1.question,
                answer1: recovery_q1.answer,
                question2: recovery_q2.question,
                answer2: recovery_q2.answer
            };
            await db.collection('recovery_questions').insertOne(recoveryData);

            // Return the new user object with just the user fields
            res.json({ message: 'Registration successful', user: newUser });
        } else {
            console.error('Failed to insert user into the database');
            res.status(500).send('Error registering user');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Error registering user');
    }
});

// Verify user function for login
const verifyUser = async (email, password, callback) => {
    try {
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            console.log('No user found with this email:', email);
            return callback(null, { message: 'Wrong email or password.' });
        }

        if (password !== user.password) {
            return callback(null, { message: 'Wrong email or password.' });
        } else {
            const userObject = {
                user_id: user._id,
                user_name: user.user_name,
                first_name: user.first_name,
                last_name: user.last_name,
                gender: user.gender,
                email: user.email,
                password: user.password,
                phone_number: user.phone_number,
                education: user.education,
                photo: user.photo
            };

            callback(null, userObject);
        }
    } catch (err) {
        console.error('Database query error:', err);
        return callback(err);
    }
};

// Add login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log("server side :");
    console.log(email, password);
    verifyUser(email, password, (err, result) => {
        console.log("err:", err);
        console.log(result);
        if (err) {
            return res.status(500).send('An error occurred. Please try again.');
        }
        if (result.message) {
            return res.status(401).send(result.message);
        }

        res.json({ message: 'Login successful', user: result });
    });
});

// Endpoint to handle forgot password
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return res.status(404).send('Email not found');
        }

        const recoveryData = await db.collection('recovery_questions').findOne({ user_id: user._id });

        if (!recoveryData) {
            return res.status(404).send('Recovery questions not found');
        }

        res.json({ questions: { question1: recoveryData.question1, question2: recoveryData.question2 } });
    } catch (err) {
        console.error('Error fetching user or recovery questions:', err);
        return res.status(500).send('Error fetching user or recovery questions');
    }
});

// Endpoint to verify recovery answers
app.post('/verify-answers', async (req, res) => {
  const { email, answers } = req.body;

  try {
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(404).send('Email not found');
    }

    const password = user.password;
    const recoveryData = await db.collection('recovery_questions').findOne({ user_id: user._id });

    if (!recoveryData) {
      return res.status(404).send('Recovery answers not found');
    }

    const { answer1, answer2 } = recoveryData;
    if (answers.answer1 === answer1 && answers.answer2 === answer2) {
      res.json({ correct: true, password });
    } else {
      res.json({ correct: false });
    }
  } catch (err) {
    console.error('Error fetching user or recovery answers:', err);
    return res.status(500).send('Error fetching user or recovery answers');
  }
});

// Endpoint to add a new post
app.post('/add-post', async (req, res) => {
  const { user_id, post_content, post_date, likes_num, comments_num } = req.body;

  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(user_id) });

    if (!user) {
      return res.status(404).send('User not found');
    }

    const newPost = {
      user_id,
      username: user.user_name, // Add username to the post document
      post_content,
      post_date,
      likes_num,
      comments_num
    };

    const result = await db.collection('posts').insertOne(newPost);

    if (result.acknowledged && result.insertedId) {
      res.json({ message: 'Post added successfully', post_id: result.insertedId });
    } else {
      console.error('Failed to add post');
      res.status(500).send({ message: 'Failed to add post' });
    }
  } catch (err) {
    console.error('Error adding post:', err);
    return res.status(500).send({ message: 'Failed to add post' });
  }
});

// Endpoint to fetch posts with user information
app.get('/posts', async (req, res) => {
  try {
    const posts = await db.collection('posts').find().toArray();
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    return res.status(500).send({ message: 'Failed to fetch posts' });
  }
});

/*
app.get('/fetch-data', async (req, res) => {
  try {
    const posts = await db.collection('posts').find().toArray();
    const comments = await db.collection('comments').find().toArray();
    const likes = await db.collection('likes').find().toArray();
    const users = await db.collection('users').find().toArray();

    // Map through comments to rename _id to comment_id
    const formattedComments = comments.map(comment => ({
      ...comment,
      comment_id: comment._id.toString(), // Assign _id to comment_id and convert to string
      _id: undefined, // Optionally remove _id to avoid confusion
    }));

    res.json({ posts, comments: formattedComments, likes, users });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send({ message: 'Failed to fetch data' });
  }
});
*/

app.get('/fetch-data', async (req, res) => {
  try {
    const posts = await db.collection('posts').find().sort({ post_date: -1 }).toArray(); // Sort by post_date descending
    const comments = await db.collection('comments').find().toArray();
    const likes = await db.collection('likes').find().toArray();
    const users = await db.collection('users').find().toArray();

    // Map through comments to rename _id to comment_id
    const formattedComments = comments.map(comment => ({
      ...comment,
      comment_id: comment._id.toString(), // Assign _id to comment_id and convert to string
      _id: undefined, // Optionally remove _id to avoid confusion
    }));

    res.json({ posts, comments: formattedComments, likes, users });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send({ message: 'Failed to fetch data' });
  }
});


app.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  console.log(`Received request to fetch user details for userId: ${userId}`);

  try {
    // Check if userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      console.error(`Invalid userId: ${userId}`);
      return res.status(400).send('Invalid user ID');
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { user_name: 1, first_name: 1, last_name: 1, email: 1, phone_number: 1, education: 1, photo: 1, gender: 1 } }
    );
    console.log('Fetched user:', user);

    if (!user) {
      console.error(`User not found for userId: ${userId}`);
      return res.status(404).send('User not found');
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user details:', err);
    return res.status(500).send('Error fetching user details');
  }
});

app.get('/post/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // You may also need to enrich the post data with likes and comments
    const likes = await db.collection('likes').find({ post_id: new ObjectId(postId) }).toArray();
    const comments = await db.collection('comments').find({ post_id: new ObjectId(postId) }).toArray();

    res.json({
      ...post,
      likes,
      likes_num: likes.length,
      comments,
      comments_num: comments.length,
    });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).send('Error fetching post');
  }
});




// Function to add like notification ++++++++++++
async function addLikeNotification(postId, currentUser) {
  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      throw new Error('Post not found');
    }

    const notification = {
      user_id: post.user_id,
      notification_content: `${currentUser.user_name} has liked your post`,
      seen: false,
      date: new Date()
    };

    await db.collection('notifications').insertOne(notification);
    console.log('Like notification added successfully');
  } catch (err) {
    console.error('Error adding like notification:', err);
  }
}

// Function to add unlike notification  ++++++++++++++++++
async function removeLikeNotification(postId, currentUser) {
  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      throw new Error('Post not found');
    }

    const notification = {
      user_id: post.user_id,
      notification_content: `${currentUser.user_name} has removed the like from your post`,
      seen: false,
      date: new Date()
    };

    await db.collection('notifications').insertOne(notification);
    console.log('Unlike notification added successfully');
  } catch (err) {
    console.error('Error adding unlike notification:', err);
  }
}






// Endpoint to add like to a post
app.post('/add-like', async (req, res) => {
  const { post_id, user } = req.body;
  const user_id = user.user_id;

  try {
    const existingLike = await db.collection('likes').findOne({ post_id: new ObjectId(post_id), user_id: new ObjectId(user_id) });

    if (existingLike) {
      res.status(400).send({ message: 'User has already liked this post' });
    } else {
      // User has not liked the post, add like
      await db.collection('likes').insertOne({ post_id: new ObjectId(post_id), user_id: new ObjectId(user_id) });
      await db.collection('posts').updateOne({ _id: new ObjectId(post_id) }, { $inc: { likes_num: 1 } });

      // Add like notification
      await addLikeNotification(post_id, user);

      res.json({ message: 'Like added successfully' });
    }
  } catch (err) {
    console.error('Error adding like:', err);
    res.status(500).send({ message: 'Failed to add like' });
  }
});

// Function to check if the current user liked a post
async function checkIfLiked(post_id, user_id) {
  try {
    const existingLike = await db.collection('likes').findOne({
      post_id: new ObjectId(post_id),
      user_id: new ObjectId(user_id)
    });

    return !!existingLike; // Return true if a like exists, false otherwise
  } catch (err) {
    console.error('Error checking if liked:', err);
    throw err;
  }
}

// Endpoint to check if the current user liked a post
app.post('/check-if-liked', async (req, res) => {
  const { post_id, user } = req.body;
  const user_id = user.user_id;

  try {
    const hasLiked = await checkIfLiked(post_id, user_id);
    res.json({ liked: hasLiked });
  } catch (err) {
    res.status(500).send({ message: 'Failed to check if liked' });
  }
});


// Endpoint to remove like from a post
app.post('/remove-like', async (req, res) => {
  const { post_id, user } = req.body;
  const user_id = user.user_id;

  try {
    const existingLike = await db.collection('likes').findOne({ post_id: new ObjectId(post_id), user_id: new ObjectId(user_id) });

    if (!existingLike) {
      res.status(400).send({ message: 'User has not liked this post' });
    } else {
      // User already liked the post, remove like
      await db.collection('likes').deleteOne({ post_id: new ObjectId(post_id), user_id: new ObjectId(user_id) });
      await db.collection('posts').updateOne({ _id: new ObjectId(post_id) }, { $inc: { likes_num: -1 } });

      // Add unlike notification
      await removeLikeNotification(post_id, user);

      res.json({ message: 'Like removed successfully' });
    }
  } catch (err) {
    console.error('Error removing like:', err);
    res.status(500).send({ message: 'Failed to remove like' });
  }
});



// Function to add comment notification
async function addCommentNotification(postId, currentUser, commentContent) {
  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      throw new Error('Post not found');
    }

    const notification = {
      user_id: post.user_id,
      notification_content: `${currentUser.user_name} added a comment to your post: ${commentContent}`,
      seen: false,
      date: new Date()
    };

    await db.collection('notifications').insertOne(notification);
    console.log('Comment notification added successfully');
  } catch (err) {
    console.error('Error adding comment notification:', err);
  }
}



// Endpoint to add a new comment and notification
app.post('/add-comment', async (req, res) => {
  const { post_id, user_id, comment_content, comment_date, user } = req.body;

  try {
    await db.collection('comments').insertOne({
      post_id: new ObjectId(post_id),
      user_id: new ObjectId(user_id),
      comment_content,
      comment_date
    });

    await db.collection('posts').updateOne(
      { _id: new ObjectId(post_id) },
      { $inc: { comments_num: 1 } }
    );

    // Add the notification
    await addCommentNotification(post_id, user, comment_content);

    res.json({ message: 'Comment added successfully' });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).send({ message: 'Failed to add comment' });
  }
});

// Function to add a notification for deleting a comment
async function addDeleteCommentNotification(postId, currentUser, commentContent) {
  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      throw new Error('Post not found');
    }

    const notification = {
      user_id: post.user_id, // Notification goes to the user who created the post
      notification_content: `${currentUser.user_name} has deleted the comment: "${commentContent}" from your post`,
      seen: false,
      date: new Date()
    };

    await db.collection('notifications').insertOne(notification);
    console.log('Delete comment notification added successfully');
  } catch (err) {
    console.error('Error adding delete comment notification:', err);
  }
}



// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id) {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

app.post('/delete-comment', async (req, res) => {
  const { post_id, comment_id } = req.body;

  try {
    // Ensure both post_id and comment_id are valid ObjectId
    if (!ObjectId.isValid(post_id) || !ObjectId.isValid(comment_id)) {
      return res.status(400).send('Invalid post ID or comment ID');
    }

    const postObjectId = new ObjectId(post_id);
    const commentObjectId = new ObjectId(comment_id);

    const comment = await db.collection('comments').findOne({ _id: commentObjectId });
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    await db.collection('comments').deleteOne({ _id: commentObjectId });

    const postUpdateResult = await db.collection('posts').findOneAndUpdate(
      { _id: postObjectId },
      { $inc: { comments_num: -1 } },
      { returnDocument: 'after' }
    );

    if (!postUpdateResult.value) {
      return res.status(404).send('Post not found');
    }

    await addDeleteCommentNotification(post_id, { user_name: req.body.current_user_name }, comment.comment_content);

    res.json({ message: 'Comment deleted successfully', post: postUpdateResult.value });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).send('Failed to delete comment');
  }
});

async function addDeleteCommentNotification(postId, currentUser, commentContent) {
  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) throw new Error('Post not found');

    const notification = {
      user_id: post.user_id,
      notification_content: `${currentUser.user_name} has deleted the comment: "${commentContent}" from your post`,
      seen: false,
      date: new Date(),
    };

    await db.collection('notifications').insertOne(notification);
  } catch (error) {
    console.error('Error adding delete comment notification:', error);
  }
}






app.post('/toggle-like', async (req, res) => {
  const { post_id, user } = req.body;
  const user_id = user.user_id;

  try {
      const existingLike = await db.collection('likes').findOne({ post_id: new ObjectId(post_id), user_id: new ObjectId(user_id) });

      if (existingLike) {
          // User already liked the post, remove like
          await db.collection('likes').deleteOne({ post_id: new ObjectId(post_id), user_id: new ObjectId(user_id) });
          await db.collection('posts').updateOne({ _id: new ObjectId(post_id) }, { $inc: { likes_num: -1 } });

          // Add unlike notification
          const unlikeNotification = {
              user_id: existingLike.user_id,
              notification_content: `${user.user_name} has removed the like from your post`,
              seen: false,
              date: new Date()
          };
          await db.collection('notifications').insertOne(unlikeNotification);

          res.json({ message: 'Like removed successfully' });
      } else {
          // User has not liked the post, add like
          await db.collection('likes').insertOne({ post_id: new ObjectId(post_id), user_id: new ObjectId(user_id) });
          await db.collection('posts').updateOne({ _id: new ObjectId(post_id) }, { $inc: { likes_num: 1 } });

          // Add like notification
          const likeNotification = {
              user_id: existingLike.user_id,
              notification_content: `${user.user_name} has liked your post`,
              seen: false,
              date: new Date()
          };
          await db.collection('notifications').insertOne(likeNotification);

          res.json({ message: 'Like added successfully' });
      }
  } catch (err) {
      console.error('Error toggling like:', err);
      res.status(500).send({ message: 'Failed to toggle like' });
  }
});

/*
app.post('/fetch-notifications', async (req, res) => {
  const { user_id } = req.body;
  console.log('Received user_id:', user_id);

  try {
    // Since user_id is stored as a string in your database, we query with it directly
    const notifications = await db.collection('notifications').find({ user_id: user_id }).toArray();
    console.log('Fetched notifications:', notifications);
    res.json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).send('Error fetching notifications');
  }
});
*/

app.post('/fetch-notifications', async (req, res) => {
  const { user_id } = req.body;
  console.log('Received user_id:', user_id);

  try {
    const notifications = await db.collection('notifications').find({ user_id: user_id }).sort({ date: -1 }).toArray(); // Sort by date descending
    console.log('Fetched notifications:', notifications);
    res.json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).send('Error fetching notifications');
  }
});



// Endpoint to mark a notification as seen
app.post('/mark-notification-seen', async (req, res) => {
  const { notification_id } = req.body;
  console.log('Received notification_id:', notification_id);

  try {
    const result = await db.collection('notifications').updateOne(
      { _id: new ObjectId(notification_id) },
      { $set: { seen: true } }
    );
    console.log('Update result:', result);

    if (result.modifiedCount === 1) {
      res.json({ message: 'Notification marked as seen' });
    } else {
      res.status(404).send('Notification not found');
    }
  } catch (err) {
    console.error('Error marking notification as seen:', err);
    return res.status(500).send('Error marking notification as seen');
  }
});

// Endpoint to update user details
app.post('/update-user', async (req, res) => {
  const { user_id, field, value } = req.body;
  
  try {
    // Create the update object dynamically
    const updateObject = { [field]: value };

    // Update the user document in the 'users' collection
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(user_id) },
      { $set: updateObject }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: 'User data updated successfully', value });
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error('Error updating user data:', err);
    return res.status(500).send('Error updating user data');
  }
});

// Endpoint to fetch user details by user_id
app.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  console.log(`Received request to fetch user details for userId: ${userId}`);

  try {
    // Check if userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      console.error(`Invalid userId: ${userId}`);
      return res.status(400).send('Invalid user ID');
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { user_name: 1, first_name: 1, last_name: 1, email: 1, phone_number: 1, education: 1, photo: 1, gender: 1 } }
    );
    console.log('Fetched user:', user);

    if (!user) {
      console.error(`User not found for userId: ${userId}`);
      return res.status(404).send('User not found');
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user details:', err);
    return res.status(500).send('Error fetching user details');
  }
});

// Endpoint to fetch skills by user_id
app.post('/fetch-skills', async (req, res) => {
  const { user_id } = req.body;

  try {
    const results = await db.collection('skills').find({ user_id }).toArray();
    const skills = results.map(row => row.skill);
    res.json({ skills });
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).send('Error fetching skills');
  }
});

// Endpoint to add a skill
app.post('/add-skill', async (req, res) => {
  const { user_id, skill } = req.body;

  try {
    await db.collection('skills').insertOne({ user_id, skill });
    res.json({ message: 'Skill added successfully' });
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).send('Error adding skill');
  }
});

// Endpoint to remove a skill
app.post('/remove-skill', async (req, res) => {
  const { user_id, skill } = req.body;

  try {
    await db.collection('skills').deleteOne({ user_id, skill });
    res.json({ message: 'Skill removed successfully' });
  } catch (err) {
    console.error('Error removing skill:', err);
    res.status(500).send('Error removing skill');
  }
});

// Function to add follow notification
async function addFollowNotification(userId, currentUser) {
  try {
    const notification = {
      user_id: new ObjectId(userId),
      notification_content: `${currentUser.user_name} started to follow you`,
      seen: false,
      date: new Date()
    };

    await db.collection('notifications').insertOne(notification);
    console.log('Follow notification added successfully');
  } catch (err) {
    console.error('Error adding follow notification:', err);
    throw err;
  }
}

// Endpoint to add a friend and create notification
app.post('/follow', async (req, res) => {
  const { user_id, friend_id, currentUser } = req.body;

  try {
    // Add friend relationship
    await db.collection('friends').insertOne({ user_id: new ObjectId(user_id), friend_id: new ObjectId(friend_id) });

    // Fetch friend's information
    const friend = await db.collection('users').findOne({ _id: new ObjectId(friend_id) }, { projection: { user_id: 1, user_name: 1 } });

    if (!friend) {
      return res.status(404).send('Friend not found');
    }

    // Add follow notification
    await addFollowNotification(friend_id, currentUser);

    res.json({ message: 'Friend added successfully', friend: { user_id: friend._id, user_name: friend.user_name } });
  } catch (err) {
    console.error('Error adding friend:', err);
    res.status(500).send('Error adding friend');
  }
});

app.post('/remove-follow', async (req, res) => {
  const { user_id, friend_id, currentUser } = req.body;

  try {
    // Remove friend relationship
    const result = await db.collection('friends').deleteOne({ user_id: new ObjectId(user_id), friend_id: new ObjectId(friend_id) });

    if (result.deletedCount === 1) {
      await addUnfollowNotification(friend_id, currentUser);
      res.json({ message: 'Friend removed successfully' });
    } else {
      res.status(404).send('Friend not found');
    }
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).send('Error removing friend');
  }
});

app.post('/remove-follower', async (req, res) => {
  const { user_id, follower_id } = req.body;
  console.log('Request body:', req.body); // Log the entire request body
  console.log(`Attempting to remove follower: follower_id=${follower_id} from user_id=${user_id}`);

  try {
    // Convert IDs to ObjectId if they are not already
    const userIdObj = new ObjectId(user_id);
    const followerIdObj = new ObjectId(follower_id);

    // Remove the follower relationship
    const result = await db.collection('friends').deleteOne({ user_id: followerIdObj, friend_id: userIdObj });

    if (result.deletedCount === 1) {
      console.log(`Successfully removed follower: follower_id=${follower_id} from user_id=${user_id}`);
      res.json({ message: 'Follower removed successfully' });
    } else {
      console.log(`Follower not found: follower_id=${follower_id} from user_id=${user_id}`);
      res.status(404).send('Follower not found');
    }
  } catch (err) {
    console.error(`Error removing follower: follower_id=${follower_id} from user_id=${user_id}`, err);
    res.status(500).send('Error removing follower');
  }
});








// Endpoint to search users by username
app.post('/search-users', async (req, res) => {
  const { username } = req.body;

  try {
    const users = await db.collection('users').find(
      { user_name: { $regex: username, $options: 'i' } }, // Case-insensitive search
      { projection: { user_id: 1, user_name: 1 } }
    ).toArray();

    res.json({ users });
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).send('Error searching users');
  }
});



app.post('/fetch-followers', async (req, res) => {
  const { friend_id } = req.body;
  console.log('Fetching followers for friend_id:', friend_id);

  try {
    // Fetch follower documents
    const followers = await db.collection('friends').find({ friend_id: new ObjectId(friend_id) }).toArray();
    console.log('Follower documents:', followers);

    const followerIds = followers.map(follower => new ObjectId(follower.user_id));
    console.log('Follower IDs:', followerIds);

    if (followerIds.length === 0) {
      return res.json({ followers: [] });
    }

    // Fetch follower details
    const followersDetails = await db.collection('users').find({ _id: { $in: followerIds } }).toArray();
    console.log('Follower details:', followersDetails);

    res.json({ followers: followersDetails });
  } catch (err) {
    console.error('Error fetching followers:', err);
    res.status(500).send('Error fetching followers');
  }
});



// Endpoint to fetch friends of the current user
app.post('/fetch-friends', async (req, res) => {
  const { user_id } = req.body;
  console.log('Fetching friends for user_id:', user_id);

  try {
    // Fetch friend IDs
    const friends = await db.collection('friends').find({ user_id: new ObjectId(user_id) }).toArray();
    console.log('Friend documents:', friends);

    const friendIds = friends.map(friend => new ObjectId(friend.friend_id));
    console.log('Friend IDs:', friendIds);

    if (friendIds.length === 0) {
      return res.json({ friends: [] });
    }

    // Fetch friend details
    const friendsDetails = await db.collection('users').find({ _id: { $in: friendIds } }).toArray();
    console.log('Friend details:', friendsDetails);

    res.json({ friends: friendsDetails });
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).send('Error fetching friends');
  }
});


// Function to add unfollow notification
async function addUnfollowNotification(userId, currentUser) {
  try {
    const notification = {
      user_id: new ObjectId(userId),
      notification_content: `${currentUser.user_name} has unfollowed you`,
      seen: false,
      date: new Date()
    };

    await db.collection('notifications').insertOne(notification);
    console.log('Unfollow notification added successfully');
  } catch (err) {
    console.error('Error adding unfollow notification:', err);
    throw err;
  }
}











// Routes
app.get('/users', (req, res) => {
    db.collection('users')
        .find()
        .toArray()
        .then((documents) => {
            res.status(200).json(documents);
        })
        .catch((error) => {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Could not fetch the users' });
        });
});
