const { Recovery_Question } = require('./Recovery_Question.js');
const { Skill } = require('./Skill.js');
const { Friend } = require('./Friend.js');
const { Post } = require('./Post.js');
const { Notification } = require('./Notification.js');

class User {
    constructor(
        user_id, user_name, first_name, last_name, email, password, phone_number, education,
        recovery_q1, recovery_q2, skills = [], friends = [], posts = [], notifications = [], suggestions = [], photo
    ) {
        this.user_id = user_id;
        this.user_name = user_name;
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.password = password;
        this.phone_number = phone_number;
        this.education = education;
        this.recovery_q1 = new Recovery_Question(recovery_q1.question, recovery_q1.answer);
        this.recovery_q2 = new Recovery_Question(recovery_q2.question, recovery_q2.answer);
        this.skills = skills.map(skill => new Skill(skill));
        this.friends = friends.map(friend => new Friend(friend.user_id, friend.friend_id));
        this.posts = posts.map(post => new Post(post.user_id, post.post_id, post.post_content, post.post_date, post.likes, post.comments));
        this.notifications = notifications.map(notification => new Notification(notification.notification_id, notification.user_id, notification.notification_content, notification.seen));
        this.suggestions = suggestions.map(suggestion => new User(
            suggestion.user_id, suggestion.first_name, suggestion.last_name, suggestion.email, suggestion.password, suggestion.phone_number, suggestion.education,
            suggestion.recovery_q1, suggestion.recovery_q2, suggestion.skills, suggestion.friends, suggestion.posts, suggestion.notifications, suggestion.suggestions, suggestion.photo
        ));
        this.photo = photo;
    }
}

module.exports = { User };
