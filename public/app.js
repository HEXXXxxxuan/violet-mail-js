const { useState, useEffect } = React;

// API helper functions
const api = {
    async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    async get(url) {
        const response = await fetch(url);
        return response.json();
    }
};

// Login Component
function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await api.post('/api/login', { username, password });
            if (result.success) {
                onLogin(result.user);
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Connection error. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <h2>Violet Mail</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Username:</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label>Password:</label>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                    />
                </div>
                
                <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}

// Sidebar Component
function Sidebar({ user, currentPage, onPageChange, onLogout }) {
    return (
        <div className="sidebar">
            <nav className="sidebar-nav">
                <div 
                    className={`nav-item ${currentPage === 'inbox' ? 'active' : ''}`}
                    onClick={() => onPageChange('inbox')}
                >
                    <i className="fas fa-inbox"></i>
                    <span className="nav-text">Mailbox</span>
                </div>
                <div 
                    className={`nav-item ${currentPage === 'sent' ? 'active' : ''}`}
                    onClick={() => onPageChange('sent')}
                >
                    <i className="fas fa-paper-plane"></i>
                    <span className="nav-text">Sent</span>
                </div>
                <div className="nav-item">
                    <i className="fas fa-user"></i>
                    <span className="nav-text">{user.username}</span>
                </div>
                <div className="nav-item" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="nav-text">Logout</span>
                </div>
            </nav>
        </div>
    );
}

// Email List Component
function EmailList({ emails, onEmailClick, type = 'inbox' }) {
    if (emails.length === 0) {
        return (
            <div className="empty-state">
                <i className={type === 'inbox' ? 'fas fa-inbox' : 'fas fa-paper-plane'}></i>
                <p>No {type === 'inbox' ? 'emails in your inbox' : 'sent emails'}.</p>
            </div>
        );
    }

    return (
        <div className="email-list">
            {emails.map(email => (
                <div 
                    key={email.email_id}
                    className={`email-item ${email.is_read == 0 && type === 'inbox' ? 'unread' : ''}`}
                    onClick={() => onEmailClick(email)}
                >
                    <div className="email-sender">
                        {type === 'inbox' ? email.sender_name : `To: ${email.recipient_name}`}
                    </div>
                    <div className="email-subject">{email.subject}</div>
                    <div className="email-preview">
                        {email.body.substring(0, 50)}{email.body.length > 50 ? '...' : ''}
                    </div>
                    <div className="email-time">
                        {new Date(email.sent_time).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Compose Modal Component
function ComposeModal({ isOpen, onClose, onSend, replyTo = null }) {
    const [recipient, setRecipient] = useState(replyTo?.sender_name || '');
    const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (replyTo) {
            setRecipient(replyTo.sender_name);
            setSubject(`Re: ${replyTo.subject}`);
        } else {
            setRecipient('');
            setSubject('');
        }
        setMessage('');
    }, [replyTo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);

        try {
            const result = await api.post('/api/send-email', {
                recipient,
                subject,
                message
            });

            if (result.success) {
                alert('Email sent successfully!');
                setRecipient('');
                setSubject('');
                setMessage('');
                onClose();
                onSend();
            } else {
                alert('Failed to send: ' + result.message);
            }
        } catch (error) {
            alert('Error sending email. Please try again.');
        }
        setSending(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'block' }}>
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span>
                <div className="modal-header">
                    <h2>{replyTo ? 'Reply to Email' : 'Compose New Email'}</h2>
                </div>
                
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Recipient:</label>
                            <input 
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                required
                                disabled={replyTo}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Subject:</label>
                            <input 
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Message:</label>
                            <textarea 
                                rows="6"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button type="submit" disabled={sending}>
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Email Detail Component
function EmailDetail({ email, onBack, onReply }) {
    return (
        <div className="card email-view">
            <h2>{email.subject}</h2>
            <div className="email-meta">
                <span className="from">From: {email.sender_name}</span>
                <span className="to">To: {email.recipient_name}</span>
                <span className="date">
                    Date: {new Date(email.sent_time).toLocaleString()}
                </span>
            </div>
            
            <div className="email-body">
                {email.body.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>
            
            <div className="email-actions">
                <button className="btn" onClick={onBack}>Back</button>
                <button className="btn" onClick={() => onReply(email)}>Reply</button>
            </div>
        </div>
    );
}

// Main App Component
function App() {
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('inbox');
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [replyTo, setReplyTo] = useState(null);

    // Load emails when page changes
    useEffect(() => {
        if (user && (currentPage === 'inbox' || currentPage === 'sent')) {
            loadEmails();
        }
    }, [user, currentPage]);

    // Check for new emails periodically
    useEffect(() => {
        if (user && currentPage === 'inbox') {
            const interval = setInterval(checkNewEmails, 60000);
            return () => clearInterval(interval);
        }
    }, [user, currentPage]);

    const loadEmails = async () => {
        setLoading(true);
        try {
            const result = await api.get(`/api/${currentPage}`);
            if (result.emails) {
                setEmails(result.emails);
            }
        } catch (error) {
            console.error('Error loading emails:', error);
        }
        setLoading(false);
    };

    const checkNewEmails = async () => {
        try {
            const result = await api.get('/api/check-emails');
            if (result.hasNewEmails) {
                loadEmails();
            }
        } catch (error) {
            console.error('Error checking new emails:', error);
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
        setCurrentPage('inbox');
    };

    const handleLogout = async () => {
        try {
            await api.post('/api/logout');
            setUser(null);
            setCurrentPage('login');
            setEmails([]);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleEmailClick = async (email) => {
        try {
            const result = await api.get(`/api/email/${email.email_id}`);
            if (result.email) {
                setSelectedEmail(result.email);
                setCurrentPage('view');
            }
        } catch (error) {
            console.error('Error loading email:', error);
        }
    };

    const handleReply = (email) => {
        setReplyTo(email);
        setComposeOpen(true);
    };

    const handleSendComplete = () => {
        if (currentPage === 'sent') {
            loadEmails();
        }
        setReplyTo(null);
    };

    // Render login page
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    // Render email detail
    if (currentPage === 'view' && selectedEmail) {
        return (
            <div className="container">
                <Sidebar 
                    user={user}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onLogout={handleLogout}
                />
                <div className="content">
                    <div className="content-header">
                        <h1>Violet Mail</h1>
                    </div>
                    <EmailDetail 
                        email={selectedEmail}
                        onBack={() => {
                            setSelectedEmail(null);
                            setCurrentPage('inbox');
                        }}
                        onReply={handleReply}
                    />
                </div>
                <ComposeModal 
                    isOpen={composeOpen}
                    onClose={() => {
                        setComposeOpen(false);
                        setReplyTo(null);
                    }}
                    onSend={handleSendComplete}
                    replyTo={replyTo}
                />
            </div>
        );
    }

    // Render main interface
    return (
        <div className="container">
            <Sidebar 
                user={user}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onLogout={handleLogout}
            />
            <div className="content">
                <div className="content-header">
                    <h1>Violet Mail</h1>
                    {user.last_login && (
                        <div className="last-login">
                            Your Last Login Time: {user.last_login}
                        </div>
                    )}
                </div>
                
                <div className="card">
                    <h2>{currentPage === 'inbox' ? 'Inbox' : 'Sent Emails'}</h2>
                    
                    {loading ? (
                        <div className="loading">Loading emails...</div>
                    ) : (
                        <EmailList 
                            emails={emails}
                            onEmailClick={handleEmailClick}
                            type={currentPage}
                        />
                    )}
                </div>
            </div>
            
            <div className="compose-btn">
                <button 
                    className="btn-compose"
                    onClick={() => setComposeOpen(true)}
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>
            
            <ComposeModal 
                isOpen={composeOpen}
                onClose={() => {
                    setComposeOpen(false);
                    setReplyTo(null);
                }}
                onSend={handleSendComplete}
                replyTo={replyTo}
            />
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));