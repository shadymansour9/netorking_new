const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const { User } = require('../entities/User'); 



const app = express();
const port = 3003; // Ensure this port is free and consistent

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend
}));

// Create a connection to the database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'networking' // Replace with your database name
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected as id ' + db.threadId);
});


function verifyUser(email, password, callback) {
  const query = 'SELECT * FROM user WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return callback(err);
    }
    if (results.length === 0) {
      console.log('No user found with this email:', email);
      return callback(null, { message: 'Wrong email or password.' });
    }

    const user = results[0];
    if(password !== user.password) {
      return callback(null, { message: 'Wrong email or password.' });
    } else {
      const userObject = new User(
        user.user_id,
        user.user_name,
        user.first_name,
        user.last_name,
        user.email,
        user.password,
        user.phone_number,
        user.education,
        { question: null, answer: null },
        { question: null, answer: null },
        [],
        [],
        [],
        [],
        [],
        user.photo
      );

      callback(null, userObject);
    }
  });
}

// Endpoint to fetch user details by user_id
app.get('/user/:userId', (req, res) => {
  const userId = req.params.userId;

  const fetchUserQuery = 'SELECT * FROM user WHERE user_id = ?';

  db.query(fetchUserQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user details:', err);
      return res.status(500).send('Error fetching user details');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = results[0];
    res.json({
      user_name: user.user_name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      education: user.education,
      photo: user.photo,
      gender: user.gender
    });
  });
});


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


// Endpoint to fetch notifications
app.post('/fetch-notifications', (req, res) => {
  const { user_id } = req.body;
  const fetchNotificationsQuery = 'SELECT notification_id, notification_content, seen FROM notifications WHERE user_id = ?';

  db.query(fetchNotificationsQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).send('Error fetching notifications');
    }
    res.json({ notifications: results });
  });
});

// Endpoint to mark a notification as seen
app.post('/mark-notification-seen', (req, res) => {
  const { notification_id } = req.body;
  const markAsSeenQuery = 'UPDATE notifications SET seen = 1 WHERE notification_id = ?';

  db.query(markAsSeenQuery, [notification_id], (err, results) => {
    if (err) {
      console.error('Error marking notification as seen:', err);
      return res.status(500).send('Error marking notification as seen');
    }
    res.json({ message: 'Notification marked as seen' });
  });
});


// Endpoint to add a new post
app.post('/add-post', (req, res) => {
  const { user_id, post_content, post_date, likes_num, comments_num } = req.body;

  const query = 'INSERT INTO posts (user_id, post_content, post_date, likes_num, comments_num) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [user_id, post_content, post_date, likes_num, comments_num], (err, results) => {
    if (err) {
      console.error('Error adding post:', err);
      return res.status(500).send({ message: 'Failed to add post' });
    }

    res.json({ message: 'Post added successfully', post_id: results.insertId });
  });
});

// Function to add like notification
function addLikeNotification(postId, currentUser) {
  return new Promise((resolve, reject) => {
    const fetchPostUserQuery = 'SELECT user_id FROM posts WHERE post_id = ?';
    db.query(fetchPostUserQuery, [postId], (err, results) => {
      if (err) {
        return reject(err);
      }
      if (results.length === 0) {
        return reject(new Error('Post not found'));
      }
      const postUserId = results[0].user_id;
      const notificationContent = `${currentUser.user_name} has liked your post`;
      const seen = false;

      const addNotificationQuery = 'INSERT INTO notifications (user_id, notification_content, seen) VALUES (?, ?, ?)';
      db.query(addNotificationQuery, [postUserId, notificationContent, seen], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  });
}
// Function to add comment notification
function addCommentNotification(postId, currentUser, commentContent) {
  return new Promise((resolve, reject) => {
    const fetchPostUserQuery = 'SELECT user_id FROM posts WHERE post_id = ?';
    db.query(fetchPostUserQuery, [postId], (err, results) => {
      if (err) {
        return reject(err);
      }
      if (results.length === 0) {
        return reject(new Error('Post not found'));
      }
      const postUserId = results[0].user_id;
      const notificationContent = `${currentUser.user_name} added a comment to your post: ${commentContent}`;
      const seen = false;

      const addNotificationQuery = 'INSERT INTO notifications (user_id, notification_content, seen) VALUES (?, ?, ?)';
      db.query(addNotificationQuery, [postUserId, notificationContent, seen], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  });
}


// Endpoint to add a new comment and notification
app.post('/add-comment', (req, res) => {
  const { post_id, user_id, comment_content, comment_date, user } = req.body;

  const addCommentQuery = 'INSERT INTO comments (post_id, user_id, comment_content, comment_date) VALUES (?, ?, ?, ?)';
  const updatePostQuery = 'UPDATE posts SET comments_num = comments_num + 1 WHERE post_id = ?';

  db.query(addCommentQuery, [post_id, user_id, comment_content, comment_date], (err, results) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).send({ message: 'Failed to add comment' });
    }

    db.query(updatePostQuery, [post_id], (updateErr) => {
      if (updateErr) {
        console.error('Error updating post comments count:', updateErr);
        return res.status(500).send({ message: 'Failed to update post comments count' });
      }

      // Add the notification
      addCommentNotification(post_id, user, comment_content)
        .then(() => res.json({ message: 'Comment added successfully' }))
        .catch(err => {
          console.error('Error adding notification:', err);
          res.status(500).send({ message: 'Failed to add notification' });
        });
    });
  });
});


// Endpoint to toggle like on a post and add a notification
app.post('/toggle-like', (req, res) => {
  const { post_id, user } = req.body;
  const user_id = user.user_id;

  const checkLikeQuery = 'SELECT * FROM likes WHERE post_id = ? AND user_id = ?';
  const addLikeQuery = 'INSERT INTO likes (post_id, user_id) VALUES (?, ?)';
  const removeLikeQuery = 'DELETE FROM likes WHERE post_id = ? AND user_id = ?';
  const incrementLikeQuery = 'UPDATE posts SET likes_num = likes_num + 1 WHERE post_id = ?';
  const decrementLikeQuery = 'UPDATE posts SET likes_num = likes_num - 1 WHERE post_id = ?';

  db.query(checkLikeQuery, [post_id, user_id], (err, results) => {
    if (err) {
      console.error('Error checking like:', err);
      return res.status(500).send({ message: 'Failed to toggle like' });
    }

    if (results.length > 0) {
      // User already liked the post, remove like
      db.query(removeLikeQuery, [post_id, user_id], (removeErr) => {
        if (removeErr) {
          console.error('Error removing like:', removeErr);
          return res.status(500).send({ message: 'Failed to toggle like' });
        }

        db.query(decrementLikeQuery, [post_id], (decrementErr) => {
          if (decrementErr) {
            console.error('Error decrementing likes count:', decrementErr);
            return res.status(500).send({ message: 'Failed to toggle like' });
          }

          res.json({ message: 'Like toggled successfully' });
        });
      });
    } else {
      // User has not liked the post, add like
      db.query(addLikeQuery, [post_id, user_id], (addErr) => {
        if (addErr) {
          console.error('Error adding like:', addErr);
          return res.status(500).send({ message: 'Failed to toggle like' });
        }

        db.query(incrementLikeQuery, [post_id], (incrementErr) => {
          if (incrementErr) {
            console.error('Error incrementing likes count:', incrementErr);
            return res.status(500).send({ message: 'Failed to toggle like' });
          }

          // Add the notification
          addLikeNotification(post_id, user)
            .then(() => res.json({ message: 'Like toggled successfully' }))
            .catch(err => {
              console.error('Error adding notification:', err);
              res.status(500).send({ message: 'Failed to add notification' });
            });
        });
      });
    }
  });
});

// Endpoint to search users by username
app.post('/search-users', (req, res) => {
  const { username } = req.body;

  const searchUsersQuery = 'SELECT user_id, user_name FROM user WHERE user_name LIKE ?';
  db.query(searchUsersQuery, [`%${username}%`], (err, results) => {
    if (err) {
      console.error('Error searching users:', err);
      return res.status(500).send('Error searching users');
    }

    res.json({ users: results });
  });
});

// Function to add follow notification
function addFollowNotification(userId, currentUser) {
  return new Promise((resolve, reject) => {
    const notificationContent = `${currentUser.user_name} started to follow you`;
    const seen = false;

    const addNotificationQuery = 'INSERT INTO notifications (user_id, notification_content, seen) VALUES (?, ?, ?)';
    db.query(addNotificationQuery, [userId, notificationContent, seen], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

// Function to add follow notification
function addFollowNotification(userId, currentUser) {
  return new Promise((resolve, reject) => {
    const notificationContent = `${currentUser.user_name} started to follow you`;
    const seen = false;

    const addNotificationQuery = 'INSERT INTO notifications (user_id, notification_content, seen) VALUES (?, ?, ?)';
    db.query(addNotificationQuery, [userId, notificationContent, seen], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

// Endpoint to add a friend and create notification
app.post('/add-friend', (req, res) => {
  const { user_id, friend_id, currentUser } = req.body;

  const addFriendQuery = 'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)';
  db.query(addFriendQuery, [user_id, friend_id], (err, results) => {
    if (err) {
      console.error('Error adding friend:', err);
      return res.status(500).send('Error adding friend');
    }

    const fetchFriendQuery = 'SELECT user_id, user_name FROM user WHERE user_id = ?';
    db.query(fetchFriendQuery, [friend_id], (fetchErr, friendResults) => {
      if (fetchErr) {
        console.error('Error fetching friend:', fetchErr);
        return res.status(500).send('Error fetching friend');
      }

      // Add follow notification
      addFollowNotification(friend_id, currentUser)
        .then(() => {
          res.json({ message: 'Friend added successfully', friend: friendResults[0] });
        })
        .catch(notificationErr => {
          console.error('Error adding follow notification:', notificationErr);
          res.status(500).send('Error adding follow notification');
        });
    });
  });
});



// Endpoint to fetch followers of the current user
app.post('/fetch-followers', (req, res) => {
  const { friend_id } = req.body;

  const fetchFollowersQuery = `
    SELECT u.user_id, u.user_name
    FROM friends f
    JOIN user u ON f.user_id = u.user_id
    WHERE f.friend_id = ?
  `;

  db.query(fetchFollowersQuery, [friend_id], (err, results) => {
    if (err) {
      console.error('Error fetching followers:', err);
      return res.status(500).send('Error fetching followers');
    }

    res.json({ followers: results });
  });
});

// Endpoint to fetch all posts, comments, likes, and users
app.get('/fetch-data', (req, res) => {
  const fetchPosts = 'SELECT * FROM posts';
  const fetchComments = 'SELECT * FROM comments';
  const fetchLikes = 'SELECT * FROM likes';
  const fetchUsers = 'SELECT * FROM user';

  const postsPromise = new Promise((resolve, reject) => {
    db.query(fetchPosts, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });

  const commentsPromise = new Promise((resolve, reject) => {
    db.query(fetchComments, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });

  const likesPromise = new Promise((resolve, reject) => {
    db.query(fetchLikes, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });

  const usersPromise = new Promise((resolve, reject) => {
    db.query(fetchUsers, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });

  Promise.all([postsPromise, commentsPromise, likesPromise, usersPromise])
    .then(([posts, comments, likes, users]) => {
      res.json({ posts, comments, likes, users });
    })
    .catch(err => {
      console.error('Error fetching data:', err);
      res.status(500).send('Error fetching data');
    });
});


// User registration endpoint
app.post('/register', async (req, res) => {
  const { username, first_name, last_name, gender, email, password, phone_number, education, photo, skills, recovery_q1, recovery_q2 } = req.body;

  try {
    // Insert user details into the user table
    const userQuery = 'INSERT INTO user (user_name, first_name, last_name, gender, email, password, phone_number, education, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(userQuery, [username, first_name, last_name, gender, email, password, phone_number, education, photo], (err, userResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error registering user');
      }
      const userId = userResults.insertId;

      // Insert skills into the skills table
      const skillQueries = skills.map(skill => 'INSERT INTO skills (user_id, skill) VALUES (?, ?)');
      skillQueries.forEach((query, index) => {
        db.query(query, [userId, skills[index]], (skillErr) => {
          if (skillErr) {
            console.error(skillErr);
            return res.status(500).send('Error registering skills');
          }
        });
      });

      // Insert recovery questions into the recovery table
      const recoveryQuery = 'INSERT INTO recovery (user_id, email, question1, answer1, question2, answer2) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(recoveryQuery, [userId, email, recovery_q1.question, recovery_q1.answer, recovery_q2.question, recovery_q2.answer], (recoveryErr) => {
        if (recoveryErr) {
          console.error(recoveryErr);
          return res.status(500).send('Error registering recovery questions');
        }

        // If all successful, return the new user
        const user = {
          user_id: userId,
          user_name: username,
          first_name,
          last_name,
          gender,
          email,
          password,
          phone_number,
          education,
          photo,
          skills,
          recovery_q1,
          recovery_q2
        };
        res.json({ message: 'Registration successful', user });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error registering user');
  }
});



/*
// Endpoint to fetch friends of the current user
app.post('/fetch-friends', (req, res) => {
  const { user_id } = req.body;

  const fetchFriendIdsQuery = 'SELECT friend_id FROM friends WHERE user_id = ?';
  const fetchFriendsQuery = 'SELECT * FROM user WHERE user_id IN (?)';

  db.query(fetchFriendIdsQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching friend ids:', err);
      return res.status(500).send('Error fetching friend ids');
    }

    const friendIds = results.map(row => row.friend_id);
    if (friendIds.length === 0) {
      return res.json({ friends: [] });
    }

    db.query(fetchFriendsQuery, [friendIds], (err, friends) => {
      if (err) {
        console.error('Error fetching friends:', err);
        return res.status(500).send('Error fetching friends');
      }

      const friendsData = friends.map(friend => ({
        user_id: friend.user_id,
        user_name: friend.user_name
      }));

      res.json({ friends: friendsData });
    });
  });
});
*/

// server.js
app.post('/fetch-friends', (req, res) => {
  const { user_id } = req.body;

  const fetchFriendIdsQuery = 'SELECT friend_id FROM friends WHERE user_id = ?';
  const fetchFriendsQuery = 'SELECT * FROM user WHERE user_id IN (?)';

  db.query(fetchFriendIdsQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching friend ids:', err);
      return res.status(500).send('Error fetching friend ids');
    }

    const friendIds = results.map(row => row.friend_id);
    if (friendIds.length === 0) {
      return res.json({ friends: [] });
    }

    db.query(fetchFriendsQuery, [friendIds], (err, friends) => {
      if (err) {
        console.error('Error fetching friends:', err);
        return res.status(500).send('Error fetching friends');
      }

      res.json({ friends });
    });
  });
});




// Endpoint to remove a friend
app.post('/remove-friend', (req, res) => {
  const { user_id, friend_id } = req.body;

  const deleteFriendQuery = 'DELETE FROM friends WHERE user_id = ? AND friend_id = ?';

  db.query(deleteFriendQuery, [user_id, friend_id], (err, results) => {
    if (err) {
      console.error('Error removing friend:', err);
      return res.status(500).send({ message: 'Failed to remove friend' });
    }

    res.json({ message: 'Friend removed successfully' });
  });
});

// Endpoint to handle forgot password
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  const getUserQuery = 'SELECT user_id FROM user WHERE email = ?';
  db.query(getUserQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).send('Error fetching user');
    }

    if (results.length === 0) {
      return res.status(404).send('Email not found');
    }

    const userId = results[0].user_id;
    const getRecoveryQuery = 'SELECT question1, question2 FROM recovery WHERE user_id = ?';
    db.query(getRecoveryQuery, [userId], (recoveryErr, recoveryResults) => {
      if (recoveryErr) {
        console.error('Error fetching recovery questions:', recoveryErr);
        return res.status(500).send('Error fetching recovery questions');
      }

      if (recoveryResults.length === 0) {
        return res.status(404).send('Recovery questions not found');
      }

      res.json({ questions: recoveryResults[0] });
    });
  });
});

// Endpoint to verify recovery answers
app.post('/verify-answers', (req, res) => {
  const { email, answers } = req.body;

  const getUserQuery = 'SELECT user_id, password FROM user WHERE email = ?';
  db.query(getUserQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).send('Error fetching user');
    }

    if (results.length === 0) {
      return res.status(404).send('Email not found');
    }

    const userId = results[0].user_id;
    const password = results[0].password;
    const getRecoveryQuery = 'SELECT answer1, answer2 FROM recovery WHERE user_id = ?';
    db.query(getRecoveryQuery, [userId], (recoveryErr, recoveryResults) => {
      if (recoveryErr) {
        console.error('Error fetching recovery answers:', recoveryErr);
        return res.status(500).send('Error fetching recovery answers');
      }

      if (recoveryResults.length === 0) {
        return res.status(404).send('Recovery answers not found');
      }

      const { answer1, answer2 } = recoveryResults[0];
      if (answers.answer1 === answer1 && answers.answer2 === answer2) {
        res.json({ correct: true, password });
      } else {
        res.json({ correct: false });
      }
    });
  });
});

// Endpoint to fetch user details by user_id
app.get('/user/:userId', (req, res) => {
  const userId = req.params.userId;

  const fetchUserQuery = 'SELECT user_name, first_name, last_name, email, phone_number, education, photo, gender FROM user WHERE user_id = ?';

  db.query(fetchUserQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user details:', err);
      return res.status(500).send('Error fetching user details');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    res.json(results[0]);
  });
});

// Endpoint to update user details
app.post('/update-user', (req, res) => {
  const { user_id, field, value } = req.body;
  const updateQuery = `UPDATE user SET ${field} = ? WHERE user_id = ?`;

  db.query(updateQuery, [value, user_id], (err, results) => {
    if (err) {
      console.error('Error updating user data:', err);
      return res.status(500).send('Error updating user data');
    }
    res.json({ message: 'User data updated successfully', value });
  });
});

// Endpoint to fetch skills by user_id
app.post('/fetch-skills', (req, res) => {
  const { user_id } = req.body;

  const fetchSkillsQuery = 'SELECT skill FROM skills WHERE user_id = ?';

  db.query(fetchSkillsQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching skills:', err);
      return res.status(500).send('Error fetching skills');
    }

    const skills = results.map(row => row.skill);
    res.json({ skills });
  });
});

// Endpoint to add a skill
app.post('/add-skill', (req, res) => {
  const { user_id, skill } = req.body;

  const addSkillQuery = 'INSERT INTO skills (user_id, skill) VALUES (?, ?)';

  db.query(addSkillQuery, [user_id, skill], (err, results) => {
    if (err) {
      console.error('Error adding skill:', err);
      return res.status(500).send('Error adding skill');
    }
    res.json({ message: 'Skill added successfully' });
  });
});

// Endpoint to remove a skill
app.post('/remove-skill', (req, res) => {
  const { user_id, skill } = req.body;

  const removeSkillQuery = 'DELETE FROM skills WHERE user_id = ? AND skill = ?';

  db.query(removeSkillQuery, [user_id, skill], (err, results) => {
    if (err) {
      console.error('Error removing skill:', err);
      return res.status(500).send('Error removing skill');
    }
    res.json({ message: 'Skill removed successfully' });
  });
});



app.post('/fetch-chat-history', (req, res) => {
  const { currentUserId, chatWithUserId } = req.body;

  const fetchChatHistoryQuery = `
    SELECT message
    FROM messages
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY timestamp ASC
  `;

  db.query(fetchChatHistoryQuery, [currentUserId, chatWithUserId, chatWithUserId, currentUserId], (err, results) => {
    if (err) {
      console.error('Error fetching chat history:', err);
      return res.status(500).send('Error fetching chat history');
    }

    res.json({ messages: results.map(row => row.message) });
  });
});




// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html')); // Adjust path as needed
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
