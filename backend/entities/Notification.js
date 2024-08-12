class Notification {
    constructor(notification_id, user_id, notification_content, seen = false) {
        this.notification_id = notification_id;
        this.user_id = user_id;
        this.notification_content = notification_content;
        this.seen = seen;
    }

    markAsSeen() {
        this.seen = true;
    }
}

module.exports = { Notification };
