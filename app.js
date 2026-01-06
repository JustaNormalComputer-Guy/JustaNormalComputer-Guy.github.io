// app.js

// Check login
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'pages/html/login.html';
}

// Load data
let users = JSON.parse(localStorage.getItem('users')) || [];
let servers = JSON.parse(localStorage.getItem('servers')) || [
    {
        id: 1,
        name: 'General',
        ownerId: currentUser.id,
        channels: [
            { id: 1, name: 'general', type: 'text', messages: [] },
            { id: 2, name: 'random', type: 'text', messages: [] }
        ]
    }
];
let currentServer = servers[0];
let currentChannel = currentServer.channels[0];
let showAllServers = false;

// Ensure optional fields
servers.forEach(s => { s.starred = !!s.starred; s.unread = s.unread || 0; });

// Ensure there's a site owner for existing data: fallback to first user
if (!localStorage.getItem('siteOwnerId')) {
    if (users && users.length > 0) {
        localStorage.setItem('siteOwnerId', String(users[0].id));
        console.log('Assigned site owner fallback to user id', users[0].id);
    }
}

// If no servers stored, try to load initial data from data/servers.json
if (!localStorage.getItem('servers')) {
    fetch('data/servers.json').then(r => r.json()).then(data => {
        servers = data;
        servers.forEach(s => { s.starred = !!s.starred; s.unread = s.unread || 0; });
        currentServer = servers[0];
        currentChannel = currentServer.channels[0];
        saveData();
        renderServers();
        renderChannels();
        renderMessages();
    }).catch(() => {
        // ignore fetch errors
    });
}

// Save data
function saveData() {
    localStorage.setItem('servers', JSON.stringify(servers));
}

// Helper: mark current user online
function markOnline() {
    const online = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
    if (!online.includes(currentUser.id)) {
        online.push(currentUser.id);
        localStorage.setItem('onlineUsers', JSON.stringify(online));
    }
}
markOnline();

// Render servers
function renderServers() {
    const serversList = document.getElementById('servers-list');
    serversList.innerHTML = '';
    const q = document.getElementById('server-search')?.value?.toLowerCase() || '';
    const toShow = servers.filter(s => (showAllServers || s.starred) && (s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)));
    toShow.forEach(server => {
        const row = document.createElement('div');
        row.className = 'server-row server-star';
        row.onclick = () => selectServer(server);

        const icon = document.createElement('div');
        icon.className = 'server-icon';
        icon.textContent = server.icon || server.name[0].toUpperCase();

        const text = document.createElement('div');
        const nameEl = document.createElement('div');
        nameEl.className = 'server-name';
        nameEl.textContent = server.name;
        const descEl = document.createElement('div');
        descEl.className = 'server-desc';
        descEl.textContent = server.description || '';
        text.appendChild(nameEl);
        text.appendChild(descEl);

        const star = document.createElement('div');
        star.className = 'server-badge';
        star.textContent = server.starred ? '★' : '☆';
        star.style.cursor = 'pointer';
        star.onclick = (e) => { e.stopPropagation(); toggleStar(server); };

        // unread count badge
        if (server.unread) {
            const unread = document.createElement('div');
            unread.className = 'server-badge';
            unread.textContent = server.unread;
            unread.style.right = '8px';
            unread.style.top = '-6px';
            row.appendChild(unread);
        }

        row.appendChild(icon);
        row.appendChild(text);
        row.appendChild(star);
        serversList.appendChild(row);
    });
}

function toggleStar(server) {
    server.starred = !server.starred;
    saveData();
    renderServers();
    renderRecommendations();
}

// Render channels
function renderChannels() {
    document.getElementById('server-name').textContent = currentServer.name;
    const channelsList = document.getElementById('channels-list');
    channelsList.innerHTML = '';
    currentServer.channels.forEach(channel => {
        const div = document.createElement('div');
        div.className = 'channel';
        div.textContent = `#${channel.name}`;
        if (channel === currentChannel) div.classList.add('selected');
        div.onclick = () => selectChannel(channel);
        channelsList.appendChild(div);
    });
}

// Render messages
function renderMessages() {
    if (!currentChannel) return;
    document.getElementById('channel-name').textContent = `#${currentChannel.name}`;
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    currentChannel.messages.forEach(msg => {
        const user = users.find(u => u.id === msg.userId) || { username: 'Unknown', id: null };
        const div = document.createElement('div');
        div.className = 'message';
        const time = new Date(msg.timestamp).toLocaleTimeString();

        const header = document.createElement('div');
        header.className = 'username';
        header.innerText = user.username;

        const ts = document.createElement('span');
        ts.className = 'timestamp';
        ts.innerText = ` ${time}`;
        header.appendChild(ts);

        // If message belongs to current user, add delete button
        if (msg.userId === currentUser.id) {
            const del = document.createElement('button');
            del.className = 'delete-btn danger-btn';
            del.innerText = 'Delete';
            del.onclick = (e) => {
                e.stopPropagation();
                if (!confirm('Delete this message?')) return;
                currentChannel.messages = currentChannel.messages.filter(m => m.id !== msg.id);
                saveData();
                renderMessages();
                addNotification(`Message deleted in ${currentServer ? currentServer.name : 'a server'}`);
            };
            header.appendChild(del);
        }

        // Add friend action on hover for messages not from you
        if (msg.userId !== currentUser.id) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-friend-btn ghost-btn';
            addBtn.innerText = 'Add Friend';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                const friends = JSON.parse(localStorage.getItem('friends') || '[]');
                if (!friends.includes(msg.userId)) {
                    friends.push(msg.userId);
                    localStorage.setItem('friends', JSON.stringify(friends));
                    renderUsers();
                    alert('Friend added');
                }
            };
            header.appendChild(addBtn);
        }

        const content = document.createElement('div');
        content.className = 'content';
        content.innerText = msg.content;

        div.appendChild(header);
        div.appendChild(content);
        messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Render users
function renderUsers() {
    document.getElementById('users-header').textContent = `Online - ${users.length}`;
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user';
        const online = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
        const friends = JSON.parse(localStorage.getItem('friends') || '[]');
        const dot = online.includes(user.id) ? '<span class="online-dot"></span>' : '';
        const friendTag = friends.includes(user.id) ? ' (Friend)' : '';
        div.innerHTML = `<div class="user-avatar">${user.username[0].toUpperCase()}</div><div><div>${dot}<strong>${user.username}</strong>${friendTag}</div></div>`;
        div.style.cursor = 'pointer';
        div.onclick = () => { 
            // If viewing a server, allow owner to assign ranks; otherwise open profile
            if (currentServer && currentServer.ownerId === currentUser.id) {
                const role = prompt(`Set role for ${user.username} (e.g. Member, Mod, Admin). Leave blank to remove:` , (currentServer.roles && currentServer.roles.find(r=>r.userId===user.id)) ? currentServer.roles.find(r=>r.userId===user.id).role : 'Member');
                if (role === null) return; // cancelled
                currentServer.roles = currentServer.roles || [];
                // remove existing
                currentServer.roles = currentServer.roles.filter(r => r.userId !== user.id);
                if (role.trim()) currentServer.roles.push({ userId: user.id, role: role.trim() });
                saveData();
                renderUsers();
                alert('Role updated');
            } else {
                window.location.href = `pages/html/profile.html?id=${user.id}`;
            }
        };
        // show role if exists for current server
        if (currentServer && currentServer.roles) {
            const r = currentServer.roles.find(x => x.userId === user.id);
            if (r) {
                const span = document.createElement('span');
                span.style.marginLeft = '8px';
                span.style.color = '#b9bbbe';
                span.textContent = `(${r.role})`;
                div.appendChild(span);
            }
        }
        // If current user is site owner, show Ban button for each other account
        const siteOwnerId = Number(localStorage.getItem('siteOwnerId') || '0');
        if (siteOwnerId && Number(currentUser.id) === siteOwnerId && user.id !== currentUser.id) {
            const banBtn = document.createElement('button');
            banBtn.className = 'danger-btn';
            banBtn.style.marginLeft = '8px';
            banBtn.innerText = 'Ban';
            banBtn.onclick = (e) => {
                e.stopPropagation();
                // two-step confirmation
                const first = confirm(`Would you like to delete this person: ${user.username}?`);
                if (!first) return;
                const second = confirm('Are you sure? This action is permanent.');
                if (!second) return;
                // perform deletion
                users = users.filter(u => u.id !== user.id);
                localStorage.setItem('users', JSON.stringify(users));
                // remove their servers
                servers = servers.filter(s => s.ownerId !== user.id);
                localStorage.setItem('servers', JSON.stringify(servers));
                // remove from friends lists
                const globalFriends = JSON.parse(localStorage.getItem('friends') || '[]').filter(id => id !== user.id);
                localStorage.setItem('friends', JSON.stringify(globalFriends));
                // remove from online
                const onlineList = JSON.parse(localStorage.getItem('onlineUsers') || '[]').filter(id => id !== user.id);
                localStorage.setItem('onlineUsers', JSON.stringify(onlineList));
                renderServers();
                renderUsers();
                addNotification(`Account ${user.username} was deleted by owner.`);
            };
            div.appendChild(banBtn);
        }
        usersList.appendChild(div);
    });
}

function renderFriends() {
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    const online = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
    friends.forEach(id => {
        const u = users.find(x => x.id === id);
        if (!u) return;
        const isOnline = online.includes(u.id);
        const div = document.createElement('div');
        div.className = 'user';
        div.innerHTML = `<div class="user-avatar">${u.username[0].toUpperCase()}</div><div><div>${isOnline ? '<span class="online-dot"></span>' : ''}<strong>${u.username}</strong></div></div>`;
        const rem = document.createElement('button');
        rem.className = 'ghost-btn';
        rem.style.marginLeft = '8px';
        rem.innerText = 'Remove';
        rem.onclick = () => {
            const arr = JSON.parse(localStorage.getItem('friends') || '[]').filter(x => x !== u.id);
            localStorage.setItem('friends', JSON.stringify(arr));
            renderFriends();
        };
        div.appendChild(rem);
        usersList.appendChild(div);
    });
}

function renderRecommendations() {
    // Show unstarred servers as recommendations
    const rec = servers.filter(s => !s.starred);
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;
    const recDiv = document.createElement('div');
    recDiv.innerHTML = '<h3>Recommended Servers</h3>';
    rec.forEach(s => {
        const d = document.createElement('div');
        d.className = 'recommend';
        d.innerHTML = `<strong>${s.name}</strong><div>${s.description || ''}</div>`;
        const b = document.createElement('button');
        b.textContent = 'Join (Star)';
        b.onclick = () => { s.starred = true; saveData(); renderServers(); renderRecommendations(); };
        d.appendChild(b);
        recDiv.appendChild(d);
    });
    // replace messages area only in home view
    if (window._homeViewActive) {
        messagesDiv.innerHTML = '';
        messagesDiv.appendChild(recDiv);
    }
}

function addNotification(text) {
    const notes = JSON.parse(localStorage.getItem('notifications') || '[]');
    notes.push({ id: Date.now(), text, read: false });
    localStorage.setItem('notifications', JSON.stringify(notes));
    renderNotificationCount();
}

function renderNotificationCount() {
    const notes = JSON.parse(localStorage.getItem('notifications') || '[]');
    const el = document.getElementById('note-count');
    if (el) el.textContent = notes.length;
}

// Delete server
document.getElementById('delete-server').onclick = () => {
    if (!currentServer) return;
    if (currentServer.ownerId !== currentUser.id) { alert('Only the server creator can delete this server.'); return; }
    if (!confirm(`Delete server "${currentServer.name}"? This cannot be undone.`)) return;
    const deletedName = currentServer.name;
    servers = servers.filter(s => s.id !== currentServer.id);
    saveData();
    currentServer = servers[0] || null;
    currentChannel = currentServer ? currentServer.channels[0] : null;
    renderServers();
    if (currentServer) { renderChannels(); renderMessages(); }
    addNotification(`Server ${deletedName} deleted`);
};

// Update add-server to open the create server page instead of prompt
document.getElementById('add-server').onclick = () => {
    window.location.href = 'pages/html/create_server.html';
};

// Bottom nav actions
const navHome = document.getElementById('nav-home');
if (navHome) navHome.onclick = () => document.getElementById('home-button').click();
const navRecs = document.getElementById('nav-recs'); if (navRecs) navRecs.onclick = () => { window.location.href='pages/html/recommendations.html'; };
const navFriends = document.getElementById('nav-friends'); if (navFriends) navFriends.onclick = () => { renderFriends(); };
const navNotes = document.getElementById('nav-notes'); if (navNotes) navNotes.onclick = () => { window.location.href='pages/html/notifications.html'; };

// show persisted setting for all servers
if (localStorage.getItem('showAllServers') === 'true') { showAllServers = true; }
renderNotificationCount();

// Auto-refresh polling: pick up changes from localStorage so messages/notifications show without refresh
function refreshFromStorage() {
    const latestServers = JSON.parse(localStorage.getItem('servers') || '[]');
    const latestUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const latestNotes = JSON.parse(localStorage.getItem('notifications') || '[]');
    // update servers if changed (simple replace)
    if (JSON.stringify(latestServers) !== JSON.stringify(servers)) {
        servers = latestServers;
        // try to keep currentServer reference by id
        if (currentServer) {
            const s = servers.find(x => x.id === currentServer.id);
            if (s) currentServer = s;
            else { currentServer = servers[0] || null; }
        }
        if (currentServer) currentChannel = currentServer.channels.find(c => c.id === (currentChannel && currentChannel.id)) || currentServer.channels[0];
        renderServers();
        renderChannels();
    }
    // update users if changed
    if (JSON.stringify(latestUsers) !== JSON.stringify(users)) {
        users = latestUsers;
        renderUsers();
    }
    // update notifications count
    if (JSON.stringify(latestNotes) !== JSON.stringify(JSON.parse(localStorage.getItem('notifications') || '[]'))) {
        renderNotificationCount();
    }
    // If messages changed for current channel, re-render
    if (currentServer && currentChannel) {
        const s = servers.find(x => x.id === currentServer.id);
        if (s) {
            const c = s.channels.find(ch => ch.id === currentChannel.id);
            if (c && JSON.stringify(c.messages) !== JSON.stringify(currentChannel.messages)) {
                currentChannel = c;
                renderMessages();
            }
        }
    }
}
setInterval(refreshFromStorage, 1500);

// Select server
function selectServer(server) {
    currentServer = server;
    currentChannel = server.channels[0];
    renderChannels();
    renderMessages();
}

// Select channel
function selectChannel(channel) {
    currentChannel = channel;
    renderChannels();
    renderMessages();
}

// Send message
document.getElementById('send-button').onclick = () => {
    const text = document.getElementById('message-text').value.trim();
    if (text) {
        const msg = {
            id: Date.now(),
            userId: currentUser.id,
            content: text,
            timestamp: new Date().toISOString()
        };
        currentChannel.messages.push(msg);
        // increment unread for other servers/channels? only if message added elsewhere
        saveData();
        renderMessages();
        document.getElementById('message-text').value = '';
    }
};

// Enter to send
document.getElementById('message-text').onkeypress = (e) => {
    if (e.key === 'Enter') {
        document.getElementById('send-button').click();
    }
};

// Add server
document.getElementById('add-server').onclick = () => {
    // require name and description
    const name = prompt('Server name (required):');
    if (!name) { alert('Server creation cancelled (name required).'); return; }
    const description = prompt('Server description (required):');
    if (!description) { alert('Server creation cancelled (description required).'); return; }
    const icon = prompt('Single character icon (optional):');
    const server = {
        id: Date.now(),
        name,
        description,
        icon: icon ? icon[0] : name[0].toUpperCase(),
        ownerId: currentUser.id,
        starred: false,
        unread: 0,
        channels: [{ id: Date.now()+1, name: 'general', type: 'text', messages: [] }]
    };
    servers.push(server);
    saveData();
    renderServers();
};

// Add channel
document.getElementById('add-channel').onclick = () => {
    const name = prompt('Channel name:');
    if (name) {
        const channel = { id: Date.now(), name, type: 'text', messages: [] };
        currentServer.channels.push(channel);
        saveData();
        renderChannels();
    }
};

// Logout
document.getElementById('logout-button').onclick = () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'pages/html/login.html';
};

// Home button - maybe select first server
document.getElementById('home-button').onclick = () => {
    // show home view with recommendations and friends
    window._homeViewActive = true;
    document.getElementById('server-name').textContent = 'Home';
    document.getElementById('channel-name').textContent = '';
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `<h2>Welcome, ${currentUser.username}</h2><p>Home dashboard</p>`;
    renderRecommendations();
};

// toggle show all servers
document.getElementById('toggle-show-all').onclick = () => {
    showAllServers = !showAllServers;
    document.getElementById('toggle-show-all').textContent = showAllServers ? 'Starred+All' : 'All';
    renderServers();
};

// server search
document.getElementById('server-search').oninput = () => renderServers();

// friends and settings controls
const usersHeader = document.getElementById('users-header');
if (usersHeader) {
    const container = document.createElement('div');
    container.id = 'users-controls';
    const fbtn = document.createElement('button'); fbtn.textContent = 'Friends';
    fbtn.onclick = () => { renderFriends(); };
    const sbtn = document.createElement('button'); sbtn.textContent = 'Settings';
    sbtn.onclick = () => { window.location.href = 'pages/html/settings.html'; };
    container.appendChild(sbtn); container.appendChild(fbtn);
    usersHeader.parentNode.insertBefore(container, usersHeader.nextSibling);
}

// Top-left controls
const topSettings = document.getElementById('top-settings'); if (topSettings) topSettings.onclick = () => { window.location.href = 'pages/html/settings.html'; };
const topFriends = document.getElementById('top-friends'); if (topFriends) topFriends.onclick = () => { renderFriends(); };

// Initial render
renderServers();
renderChannels();
renderMessages();
renderUsers();
renderRecommendations();