class Comment {
    constructor(post_id, user_id, comment_content, comment_id) {
        this.post_id = post_id;
        this.user_id = user_id;
        this.comment_content = comment_content;
        this.comment_id = comment_id;
    }
}

module.exports = { Comment };
