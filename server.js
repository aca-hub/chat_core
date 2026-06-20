const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let activeNodes = {}; // Maps socket.id -> Username
let archivedLogs = { "General-Lobby": [] };
let networkIceLockout = {}; 

const SECURE_USER_DATABASE = {
    "admin": { "pin": "12345", "level": "99", "role": "Network Admin", "clearance": "OVERLORD" },
    "guest": { "pin": "12345", "level": "01", "role": "Infiltrator", "clearance": "LOW" },
    "neo": { "pin": "white_rabbit", "level": "10", "role": "Anarchist", "clearance": "MID" },
    "trinity": { "pin": "vector_matrix", "level": "25", "role": "Systems Breach", "clearance": "HIGH" },
    "MESSIAH": { "pin": "neb_captain", "level": "50", "role": "Zion Operative", "clearance": "CRITICAL" },

    "user001": { "pin": "10001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "batman": { "pin": "ytc01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "goku": { "pin": "skr01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "ellon_musk": { "pin": "ooa01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "avater": { "pin": "bes01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "john": { "pin": "mme02", "level": "02", "role": "Operative", "clearance": "LOW" },
    "non_of_your_bussines": { "pin": "orc03", "level": "03", "role": "Operative", "clearance": "LOW" },
    "king": { "pin": "qsa01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "queen": { "pin": "swa01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "mr.me": { "pin": "ndc01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "nobody": { "pin": "awx01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "why_ask": { "pin": "bso01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "the_cleaner": { "pin": "iwa01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "the_witcher": { "pin": "owd01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "wolf_hunter": { "pin": "pan01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "venom": { "pin": "nes01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "python": { "pin": "peo01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "johny_law": { "pin": "mds01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "silent_kid": { "pin": "oaq01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "joker": { "pin": "baw01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "dark_cypher": { "pin": "10ewd", "level": "01", "role": "Operative", "clearance": "LOW" },
    "ghost_root": { "pin": "bre01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "void_walker": { "pin": "oap01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "your_nightmare": { "pin": "bbw01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "black_kernel": { "pin": "new01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "neox": { "pin": "qaw01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "agent_zero": { "pin": "mwq01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "redplix": { "pin": "poe01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "omega_matrix": { "pin": "qa001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "cyber_titan": { "pin": "100s1", "level": "01", "role": "Operative", "clearance": "LOW" },
    "ayra_starr": { "pin": "1v001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "silent_operator": { "pin": "10w01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "black_echo": { "pin": "100z1", "level": "01", "role": "Operative", "clearance": "LOW" },
    "phantom_user": { "pin": "100z1", "level": "01", "role": "Operative", "clearance": "LOW" },
    "spector_byte": { "pin": "e0001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "main_suspect": { "pin": "10oe1", "level": "01", "role": "Operative", "clearance": "LOW" },
    "frost": { "pin": "10wa1", "level": "01", "role": "Operative", "clearance": "LOW" },
    "ella": { "pin": "1q001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "von": { "pin": "100n1", "level": "01", "role": "Operative", "clearance": "LOW" },
    "obsidianx": { "pin": "1h001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "void_ripper": { "pin": "10b01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "eclipes_prime": { "pin": "100q1", "level": "01", "role": "Operative", "clearance": "LOW" },
    "black": { "pin": "10w01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "demon_lord": { "pin": "y0001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "night_specture": { "pin": "j0001", "level": "01", "role": "Operative", "clearance": "LOW" },
    "dark_raven": { "pin": "ads01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "toxic_vector": { "pin": "10p01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "death_protocol": { "pin": "1qm01", "level": "01", "role": "Operative", "clearance": "LOW" },
    "nexus_ai": { "pin": "10ws1", "level": "01", "role": "Operative", "clearance": "LOW" },
    

    "cia": { "pin": "10qs1", "level": "01", "role": "Operative", "clearance": "LOW" },

    // ...
    // Continue sequentially
    // ...
    "user100": { "pin": "10100", "level": "99", "role": "Commander", "clearance": "OVERLORD" }
};
const FACTION_REGISTRY = {
    "General-Lobby": { pin: null },
    "Africa": { pin: null },
    "Asia": { pin: null },
    "Europe": { pin: null },
    "Australia": { pin: null },
    "North-America": { pin: null },
    "Antarctica": { pin: null },
    "South-America": { pin: null },
    
    "Kenya": { pin: null },
    
    
    
    // PREMIUM ELITE FACTIONS
    "The-Royalties": { pin: "booksofold.", tier: "royal" },
    "Seven-Lords": { pin: "johndrockerfella.", tier: "lords" },
    "The-Family": { pin: "avaterlastairbender", tier: "family" },

    // Standard Matrix Factions
    "Crypto-Syndicate": { pin: "derty" },
    "Crypto-Nation": { pin: "bytes" },
    "Crypto-Elite": { pin: "jingle" },
    "Crypto-Cartel": { pin: "pops5" },
    "Zero-Day-Squad": { pin: "1sewer" },
    "Zero-Day-Rebels": { pin: "1den5" },
    "Zero-Day-Shell": { pin: "sippers" },
    "Zero-Day-Network": { pin: "twenty45" },
    "Black-Hat-Cell": { pin: "qrst" },
    "Black-Hat-Alliance": { pin: "weddings" },
    "Black-Hat-Brigade": { pin: "rubberduck" },
    "Black-Hat-Collective": { pin: "wingers" },
    "Phreak-Faction": { pin: "panties" },
    "Phreak-Cabal": { pin: "frogman" },
    "Phreak-Division": { pin: "dontask" },
    "Phreak-Enclave": { pin: "nonoble" },
    "Quantum-Front": { pin: "dearalcohol" },
    "Quantum-Legion": { pin: "weredead" },
    "Quantum-Breakers": { pin: "trybetter" },
    "Quantum-Hackers": { pin: "deadmen45" },
    "Shadow-Phantoms": { pin: "kingsandqueens5" },
    "Shadow-Vipers": { pin: "1dryland" },
    "Shadow-Titans": { pin: "thyland45" },
    "Shadow-Daemons": { pin: "145" },
    "Japan": { pin: "1234reb5" },
    "Cyber-Syndicate": { pin: "12wet45" },
    "Cyber-Nation": { pin: "polli345" },
    "Cyber-Elite": { pin: "1ignited" },
    "Dark-Net-Cartel": { pin: "123wert" },
    "Dark-Net-Squad": { pin: "btr" },
    "Dark-Net-Rebels": { pin: "queens" },
    "Russia": { pin: "systemsfucked" },
    "Proxy-Network": { pin: "broute" },
    "Proxy-Cell": { pin: "spiderman" },
    "Proxy-Alliance": { pin: "johndoe" },
    "Proxy-Brigade": { pin: "salammaria" },
    "Kernel-Collective": { pin: "kenya" },
    "Kernel-Faction": { pin: "jinglebells" },
    "Indiah": { pin: "justice" },
    "Kernel-Division": { pin: "blacklives" },
    "Rootkit-Enclave": { pin: "dax" },
    "Korea": { pin: "whatyouknow" },
    "Rootkit-Legion": { pin: "provider" },
    "Rootkit-Breakers": { pin: "scream" },
    "Logic-Bomb-Hackers": { pin: "123love" },
    "Logic-Bomb-Phantoms": { pin: "1hearts" },
    "Logic-Bomb-Vipers": { pin: "12345men" },
    "Logic-Bomb-Titans": { pin: "12respect" },
    "Ransom-Daemons": { pin: "123davis" },
    "CALL-911": { pin: "dontbestupid" },
    "Ransom-Syndicate": { pin: "javis" },
    "Ransom-Nation": { pin: "keepfighting" },
    "Mainframe-Elite": { pin: "judgement" },
    "Mainframe-Cartel": { pin: "1mentalhelp" },
    "Mainframe-Squad": { pin: "12they" },
    "Mainframe-Rebels": { pin: "werenothere" },
    "Hyper-Shell": { pin: "lonelyroad" },
    "Hyper-Network": { pin: "12345home" },
    "Hyper-Cell": { pin: "123qwert" },
    "Hyper-Alliance": { pin: "johnder" },
    "Sub-Zero-Brigade": { pin: "1234w5" },
    "Sub-Zero-Collective": { pin: "1q2345" },
    "Sub-Zero-Faction": { pin: "12345oops" },
    "Sub-Zero-Cabal": { pin: "dead12345" },
    "Ghost-Division": { pin: "quest12345" },
    "MENS-KINGDOM": { pin: "1234boomer5" },
    "Ghost-Front": { pin: "123ded45" },
    "Ghost-Legion": { pin: "12345red" },
    "Vector-Breakers": { pin: "12345judge" },
    "Vector-Hackers": { pin: "12345" },
    "Vector-Phantoms": { pin: "pop345" },
    "Vector-Vipers": { pin: "ring12345" },
    "Binary-Titans": { pin: "1234sw5" },
    "Binary-Daemons": { pin: "12345aqs" },
    "KINGDOM": { pin: "12345abc" },
    "Binary-Syndicate": { pin: "wet12345" },
    "Neural-Nation": { pin: "12345pretty" },
    "Neural-Elite": { pin: "zed12345" },
    "Neural-Cartel": { pin: "12cats345" },
    "Neural-Squad": { pin: "12345df" },
    "Glitch-Rebels": { pin: "1what" },
    "Glitch-Shell": { pin: "1234was" },
    "Glitch-Network": { pin: "12345i" },
    "Glitch-Cell": { pin: "12345thinking" },
    "Static-Alliance": { pin: "12345loading" },
    "Static-Brigade": { pin: "widows12345" },
    "Static-Collective": { pin: "boys12345" },
    "Static-Faction": { pin: "li12345" },
    "Acid-Cabal": { pin: "lil12345" },
    "Acid-Division": { pin: "answer12345" },
    "Acid-Enclave": { pin: "bibboys12345" },
    "Acid-Front": { pin: "123q45" },
    "Circuit-Legion": { pin: "cds12345" },
    "Circuit-Breakers": { pin: "123erf45" },
    "Circuit-Hackers": { pin: "12345try" },
    "Circuit-Phantoms": { pin: "password" },
    "Helix-Vipers": { pin: "12345nrg" },
    "Helix-Titans": { pin: "12345helpless" },
    "Helix-Daemons": { pin: "12345ved" },
    "HELP?": { pin: null }
    
    
};

function getSystemMetrics() {
    const metrics = {};
    Object.keys(FACTION_REGISTRY).forEach(room => { metrics[room] = 0; });
    for (let [id, socket] of io.of("/").sockets) {
        socket.rooms.forEach(room => {
            if (metrics[room] !== undefined) metrics[room]++;
        });
    }
    return metrics;
}

function dispatchNetworkWideState() {
    const totalNodesArray = Object.keys(activeNodes).map(id => ({
        id: id,
        handle: activeNodes[id]
    }));
    
    io.emit('global-user-list-update', totalNodesArray);
    io.emit('global-room-occupancy-update', getSystemMetrics());
}

function dispatchAvailableSectors(targetSocket) {
    const profile = Object.keys(FACTION_REGISTRY).map(name => ({
        name: name,
        requiresPassword: FACTION_REGISTRY[name].pin !== null,
        frozen: !!networkIceLockout[name],
        tier: FACTION_REGISTRY[name].tier || "standard"
    }));
    targetSocket.emit('available-rooms-list', profile);
}

io.on('connection', (socket) => {
    let internalCurrentRoom = "General-Lobby";

    socket.on('authenticate-user', (payload) => {
        const searchKey = payload.user.toLowerCase();
        const foundAccount = SECURE_USER_DATABASE[searchKey];
        
        if (foundAccount && foundAccount.pin === payload.pass) {
            socket.emit('login-result', { success: true, user: payload.user, profile: foundAccount });
        } else {
            socket.emit('login-result', { success: false, error: "CRITICAL REJECTION: IDENTITY SIGNATURE MISMATCH." });
        }
    });

    socket.on('register-user', (handle) => {
        socket.join(internalCurrentRoom);
        activeNodes[socket.id] = handle;
        
        socket.emit('load-history', archivedLogs[internalCurrentRoom] || []);
        socket.to(internalCurrentRoom).emit('system-message', `${handle.toUpperCase()} established uplink interface.`);
        
        if (handle.toLowerCase() === 'admin') {
            socket.emit('sync-auth-registry-database', SECURE_USER_DATABASE);
        }
        dispatchNetworkWideState();
    });

    socket.on('get-available-rooms', () => {
        dispatchAvailableSectors(socket);
    });

    socket.on('verify-room-password', (payload) => {
        const targetSector = FACTION_REGISTRY[payload.roomName];
        if (targetSector && targetSector.pin === payload.password) {
            socket.emit('password-result', { success: true, roomName: payload.roomName });
        } else {
            socket.emit('password-result', { success: false, error: "ACCESS DENIED: ENCRYPTION PIN INVALID." });
        }
    });

    socket.on('join-room', (targetRoom) => {
        if (networkIceLockout[targetRoom] && activeNodes[socket.id]?.toLowerCase() !== 'admin') {
            return socket.emit('system-message', "ACCESS REFUSED: Terminal node currently frozen.");
        }

        socket.to(internalCurrentRoom).emit('system-message', `${activeNodes[socket.id]?.toUpperCase()} severed routing keys.`);
        socket.leave(internalCurrentRoom);

        internalCurrentRoom = targetRoom;
        socket.join(internalCurrentRoom);

        if (!archivedLogs[internalCurrentRoom]) archivedLogs[internalCurrentRoom] = [];
        socket.emit('load-history', archivedLogs[internalCurrentRoom]);
        socket.to(internalCurrentRoom).emit('system-message', `${activeNodes[socket.id]?.toUpperCase()} breached local node parameter.`);
        dispatchNetworkWideState();
    });

    // INVITATION ROUTER PROTOCOL
    socket.on('send-sector-invite', (payload) => {
        const senderHandle = activeNodes[socket.id];
        let targetSocketId = Object.keys(activeNodes).find(id => activeNodes[id].toLowerCase() === payload.targetUser.toLowerCase());
        
        if (targetSocketId) {
            io.to(targetSocketId).emit('receive-sector-invite', {
                sender: senderHandle,
                roomName: internalCurrentRoom
            });
            socket.emit('system-message', `Invitation key dispatched securely to node: ${payload.targetUser}.`);
        } else {
            socket.emit('system-message', `ROUTING ERROR: Node handle [${payload.targetUser}] could not be traced.`);
        }
    });

    socket.on('chat-message', (rawText) => {
        if (networkIceLockout[internalCurrentRoom] && activeNodes[socket.id]?.toLowerCase() !== 'admin') return;
        
        const packet = { sender: activeNodes[socket.id], text: rawText };
        if (!archivedLogs[internalCurrentRoom]) archivedLogs[internalCurrentRoom] = [];
        archivedLogs[internalCurrentRoom].push(packet);
        
        io.to(internalCurrentRoom).emit('broadcast-message', packet);
    });

    socket.on('private-message', (payload) => {
        const senderHandle = activeNodes[socket.id];
        let targetSocketId = Object.keys(activeNodes).find(id => activeNodes[id].toLowerCase() === payload.target.toLowerCase());
        
        if (targetSocketId) {
            io.to(targetSocketId).emit('receive-private-message', { sender: senderHandle, text: payload.text });
        }
    });

    socket.on('admin-delete-user', (targetName) => {
        if (activeNodes[socket.id]?.toLowerCase() !== 'admin') return;
        for (let [id, sock] of io.of("/").sockets) {
            if (activeNodes[id]?.toLowerCase() === targetName.toLowerCase()) {
                sock.emit('system-message', "ADMIN PROTOCOL OVERRIDE: Link Terminated.");
                sock.disconnect(true);
            }
        }
    });

    socket.on('admin-freeze-room', (roomName) => {
        if (activeNodes[socket.id]?.toLowerCase() !== 'admin') return;
        networkIceLockout[roomName] = !networkIceLockout[roomName];
        io.to(roomName).emit('system-message', `ALERT: Matrix node status swapped to ${networkIceLockout[roomName] ? 'FROZEN' : 'UNFROZEN'} by root user.`);
        dispatchAvailableSectors(io);
    });

    socket.on('disconnect', () => {
        const closingHandle = activeNodes[socket.id];
        if (closingHandle) {
            socket.to(internalCurrentRoom).emit('system-message', `${closingHandle.toUpperCase()} severed backend interface link.`);
            delete activeNodes[socket.id];
            dispatchNetworkWideState();
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`\n>>> SERVER LIVE: http://localhost:${PORT} <<<\n`));