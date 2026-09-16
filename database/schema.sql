CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE cases (
    case_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(255),
    crime_date DATE,
    crime_type VARCHAR(255)
);

CREATE TABLE victims (
    victim_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    occupation VARCHAR(255),
    cause_of_crime VARCHAR(255),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE suspects (
    suspect_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    occupation VARCHAR(255),
    relationship_to_victim VARCHAR(255),
    motive TEXT,
    alibi TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE crime_scenes (
    scene_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    name VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE evidence (
    evidence_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    description VARCHAR(255),
    location VARCHAR(255),
    evidence_type VARCHAR(255),
    date_found DATE,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE timeline_events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    event_time DATETIME,
    description TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE access_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    suspect_id INT,
    case_id INT NOT NULL,
    location VARCHAR(255),
    access_time DATETIME,
    exit_time DATETIME,
    FOREIGN KEY (suspect_id) REFERENCES suspects(suspect_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE phone_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    caller_suspect_id INT,
    receiver_suspect_id INT,
    call_time DATETIME,
    call_duration INT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (caller_suspect_id) REFERENCES suspects(suspect_id),
    FOREIGN KEY (receiver_suspect_id) REFERENCES suspects(suspect_id)
);

CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    suspect_id INT,
    amount DECIMAL(10,2),
    transaction_date DATETIME,
    description TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (suspect_id) REFERENCES suspects(suspect_id)
);

/*
CREATE TABLE notes (
    note_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT,
    creation_time DATETIME,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
*/

CREATE TABLE query_history (
    query_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    case_id INT,
    query_text TEXT,
    executed_at DATETIME,
    execution_status VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

/*
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    case_id INT,
    message TEXT,
    created_at DATETIME,
    read_status BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);
*/

/*
CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    case_id INT,
    action TEXT,
    created_at DATETIME,
    ip_address VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);
*/

CREATE TABLE player_progress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    case_id INT NOT NULL,
    status VARCHAR(255),
    score INT,
    last_played DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE final_accusations (
    accusation_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    case_id INT NOT NULL,
    accused_suspect_id INT,
    motive TEXT,
    explanation TEXT,
    submitted_at DATETIME,
    result VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (accused_suspect_id) REFERENCES suspects(suspect_id)
);

CREATE TABLE case_solutions (
    solution_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    culprit_suspect_id INT NOT NULL,
    motive TEXT,
    crime_method TEXT,
    explanation TEXT,

    UNIQUE (case_id),

    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (culprit_suspect_id) REFERENCES suspects(suspect_id)
);
