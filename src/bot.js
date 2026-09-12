```js
require("dotenv").config();

const mineflayer = require("mineflayer");

const CONFIG = {
    host: process.env.MC_HOST || "bananasmp.net",
    port: Number(process.env.MC_PORT || 25565),

    username: process.env.MC_USERNAME,
    password: process.env.MC_PASSWORD,

    loginDelay: Number(process.env.LOGIN_DELAY || 2500),
    lobbyDelay: Number(process.env.LOBBY_DELAY || 2500),
    reconnectDelay: Number(process.env.RECONNECT_DELAY || 5000)
};

let bot = null;
let reconnectTimer = null;

let loginSent = false;
let lifeStealSent = false;
let lobbyHandled = false;

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function createBot() {
    if (!CONFIG.username || !CONFIG.password) {
        log("ERROR: MC_USERNAME ya MC_PASSWORD missing hai.");
        process.exit(1);
    }

    log(`Connecting to ${CONFIG.host}:${CONFIG.port}...`);

    bot = mineflayer.createBot({
        host: CONFIG.host,
        port: CONFIG.port,
        username: CONFIG.username,
        auth: "offline",
        version: false
    });

    loginSent = false;
    lifeStealSent = false;
    lobbyHandled = false;

    setupEvents();
}

function setupEvents() {

    // Server join hote hi pehle login
    bot.once("spawn", () => {
        log("Bot server par join ho gaya.");

        setTimeout(() => {
            sendLogin();
        }, CONFIG.loginDelay);
    });

    // Login ke baad lobby GUI open hogi
    bot.on("windowOpen", (window) => {

        if (lobbyHandled) {
            return;
        }

        lobbyHandled = true;

        log(`Lobby GUI open hua: ${window.title}`);

        // GUI ko ESC ke equivalent close karo
        setTimeout(() => {

            try {
                if (bot.currentWindow) {
                    bot.closeWindow(bot.currentWindow);
                    log("Lobby GUI close kar diya.");
                }

                // GUI close hone ke baad LifeSteal join
                setTimeout(() => {
                    sendLifeSteal();
                }, CONFIG.lobbyDelay);

            } catch (error) {
                log(`GUI close error: ${error.message}`);
                lobbyHandled = false;
            }

        }, 1000);
    });

    // Server messages
    bot.on("messagestr", (message) => {

        log(`CHAT: ${message}`);

        const msg = message.toLowerCase();

        // Agar login prompt aaye aur abhi login nahi hua
        if (
            !loginSent &&
            (
                msg.includes("/login") ||
                msg.includes("please login") ||
                msg.includes("please log in") ||
                msg.includes("password")
            )
        ) {
            sendLogin();
        }
    });

    bot.on("kicked", (reason) => {
        log(`KICKED: ${reason}`);
    });

    bot.on("error", (error) => {
        log(`ERROR: ${error.message}`);
    });

    bot.on("end", (reason) => {

        log(`Disconnected: ${reason || "unknown reason"}`);

        scheduleReconnect();
    });
}

function sendLogin() {

    if (loginSent || !bot || !bot.entity) {
        return;
    }

    if (!CONFIG.password) {
        log("ERROR: MC_PASSWORD missing hai.");
        return;
    }

    loginSent = true;

    log("Server login command bhej raha hoon...");

    bot.chat(`/login ${CONFIG.password}`);

    log("Login command sent.");
}

function sendLifeSteal() {

    if (lifeStealSent || !bot || !bot.entity) {
        return;
    }

    lifeStealSent = true;

    log("LifeSteal server join command bhej raha hoon...");

    bot.chat("/server lifesteal");

    log("LifeSteal command sent.");
}

function scheduleReconnect() {

    if (reconnectTimer) {
        return;
    }

    log(
        `Reconnect ${CONFIG.reconnectDelay / 1000} seconds mein hoga...`
    );

    reconnectTimer = setTimeout(() => {

        reconnectTimer = null;

        createBot();

    }, CONFIG.reconnectDelay);
}

function shutdown(signal) {

    log(`${signal} received. Bot shutdown ho raha hai...`);

    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (bot) {
        try {
            bot.quit("Bot shutting down");
        } catch (_) {}
    }

    setTimeout(() => {
        process.exit(0);
    }, 1000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

createBot();
```

### `.env`

Root folder mein `.env`:

```env
MC_USERNAME=ITZ_FreezyXD
MC_PASSWORD=YOUR_SERVER_LOGIN_PASSWORD

MC_HOST=bananasmp.net
MC_PORT=25565

LOGIN_DELAY=2500
LOBBY_DELAY=2500
RECONNECT_DELAY=5000
```

**Real password sirf `.env` mein rakho**, GitHub par nahi.

Phir local test:

```bash
npm install
npm start
```

Expected flow:

```text
JOIN
↓
/login password
↓
Lobby GUI
↓
GUI close
↓
/server lifesteal
↓
LifeSteal
```

Agar is baar bhi `SyntaxError` aaye, **terminal ka exact error paste kar dena**.
