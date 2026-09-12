require("dotenv").config();

const mineflayer = require("mineflayer");

const HOST = process.env.MC_HOST || "bananasmp.net";
const PORT = Number(process.env.MC_PORT || 25565);
const USERNAME = process.env.MC_USERNAME;
const PASSWORD = process.env.MC_PASSWORD;

const LOGIN_DELAY = Number(process.env.LOGIN_DELAY || 2500);
const SERVER_DELAY = Number(process.env.LOBBY_DELAY || 2500);
const RECONNECT_DELAY = Number(process.env.RECONNECT_DELAY || 5000);

let bot = null;
let reconnectTimer = null;

let loginSent = false;
let serverSent = false;
let guiClosed = false;

function log(message) {
    console.log("[" + new Date().toISOString() + "] " + message);
}

function startBot() {
    if (!USERNAME) {
        log("ERROR: MC_USERNAME missing hai.");
        process.exit(1);
    }

    if (!PASSWORD) {
        log("ERROR: MC_PASSWORD missing hai.");
        process.exit(1);
    }

    log("Connecting to " + HOST + ":" + PORT + "...");

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,
        username: USERNAME,
        auth: "offline"
    });

    loginSent = false;
    serverSent = false;
    guiClosed = false;

    bot.once("spawn", function () {
        log("Bot server par join ho gaya.");

        setTimeout(function () {
            sendLogin();
        }, LOGIN_DELAY);
    });

    bot.on("messagestr", function (message) {
        log("CHAT: " + message);

        var msg = message.toLowerCase();

        if (
            !loginSent &&
            (
                msg.indexOf("/login") !== -1 ||
                msg.indexOf("please login") !== -1 ||
                msg.indexOf("please log in") !== -1 ||
                msg.indexOf("password") !== -1
            )
        ) {
            sendLogin();
        }
    });

    bot.on("windowOpen", function () {
        if (guiClosed) {
            return;
        }

        log("Lobby GUI open hua.");

        setTimeout(function () {
            try {
                if (bot.currentWindow) {
                    bot.closeWindow(bot.currentWindow);
                    log("Lobby GUI close kar diya.");
                }

                guiClosed = true;

                setTimeout(function () {
                    sendLifeSteal();
                }, SERVER_DELAY);

            } catch (error) {
                log("GUI close error: " + error.message);
            }
        }, 1000);
    });

    bot.on("kicked", function (reason) {
        log("KICKED: " + reason);
    });

    bot.on("error", function (error) {
        log("ERROR: " + error.message);
    });

    bot.on("end", function (reason) {
        log("Disconnected: " + (reason || "unknown"));
        scheduleReconnect();
    });
}

function sendLogin() {
    if (loginSent) {
        return;
    }

    if (!bot || !bot.entity) {
        return;
    }

    loginSent = true;

    log("Login command bhej raha hoon...");

    bot.chat("/login " + PASSWORD);

    log("Login command sent.");
}

function sendLifeSteal() {
    if (serverSent) {
        return;
    }

    if (!bot || !bot.entity) {
        return;
    }

    serverSent = true;

    log("Lifesteal command bhej raha hoon...");

    bot.chat("/server lifesteal");

    log("Lifesteal command sent.");
    log("Bot ab Lifesteal server mein AFK rahega.");
}

function scheduleReconnect() {
    if (reconnectTimer) {
        return;
    }

    log(
        "Reconnect " +
        (RECONNECT_DELAY / 1000) +
        " seconds baad hoga..."
    );

    reconnectTimer = setTimeout(function () {
        reconnectTimer = null;
        startBot();
    }, RECONNECT_DELAY);
}

function shutdown(signal) {
    log(signal + " received. Bot shutdown ho raha hai...");

    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (bot) {
        try {
            bot.quit("Bot shutting down");
        } catch (error) {
        }
    }

    setTimeout(function () {
        process.exit(0);
    }, 1000);
}

process.on("SIGTERM", function () {
    shutdown("SIGTERM");
});

process.on("SIGINT", function () {
    shutdown("SIGINT");
});

startBot();
