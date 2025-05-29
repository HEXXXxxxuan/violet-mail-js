
USE email_system;


SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS login;
DROP TABLE IF EXISTS user_info;
SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE user_info (
  user_id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) NOT NULL,
  email varchar(100) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY username (username),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE login (
  login_id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  password_hash varchar(255) NOT NULL,
  last_login datetime DEFAULT NULL,
  PRIMARY KEY (login_id),
  KEY user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES user_info (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE emails (
  email_id int(11) NOT NULL AUTO_INCREMENT,
  sender_id int(11) NOT NULL,
  recipient_id int(11) NOT NULL,
  subject varchar(255) NOT NULL,
  body text NOT NULL,
  sent_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read tinyint(4) DEFAULT 0,
  PRIMARY KEY (email_id),
  KEY sender_id (sender_id),
  KEY recipient_id (recipient_id),
  FOREIGN KEY (sender_id) REFERENCES user_info (user_id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES user_info (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO user_info (username, first_name, last_name, email) VALUES
('user1', 'donald', 'biden', 'donald@example.com'),
('user2', 'obama', 'putin', 'obama@example.com'),
('testuser', 'Test', 'User', 'test@example.com');


INSERT INTO login (user_id, password_hash) VALUES
(1, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');


INSERT INTO emails (sender_id, recipient_id, subject, body, is_read) VALUES
(1, 2, 'Welcome to Violet Mail!', 'Hi obama,\n\nWelcome to our new email system! This is a test message.\n\nBest regards,\ndonald', 0),
(2, 1, 'Re: Welcome to Violet Mail!', 'Hi donald,\n\nThank you for the welcome message! The new system looks great.\n\nRegards,\nobama', 0),
(1, 2, 'Meeting Tomorrow', 'obama,\n\nDont forget about our meeting tomorrow at 2 PM.\n\nSee you then!\ndonald', 0),
(3, 1, 'System Test', 'Hi donald,\n\nThis is a test email from the test user account.\n\nEverything seems to be working perfectly!\n\nBest,\nTest User', 0);