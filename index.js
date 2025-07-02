require("dotenv").config();
const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const qrcode = require("qrcode");
const AdmZip = require("adm-zip");
const P = require("pino");
const app = express();
const PORT = process.env.PORT || 8000;
const SESSION_FOLDER = process.env.SESSION_FOLDER || "./sessions";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidNormalizedUser
} = require("@whiskeysockets/baileys");

let userPhoneNumber = null;
const store = makeInMemoryStore({ logger: P().child({ level: "silent", stream: "store" }) });
store.readFromFile("./baileys_store.json");
setInterval(() => store.writeToFile("./baileys_store.json"), 10_000);

// 🔧 UI Setup
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📩 Handle form submission
app.post("/submit", (req, res) => {
  userPhoneNumber = req.body.phone?.trim();

  if (!userPhoneNumber || !/^255[0-9]{9}$/.test(userPhoneNumber)) {
    return res.send(`<script>alert("⚠️ Namba haiko sahihi. Anza na 255 na iwe na tarakimu 12."); window.history.back();</script>`);
  }

  const pairCode = Math.floor(10000000 + Math.random() * 90000000).toString();

  qrcode.toDataURL(pairCode, (err, qr) => {
    if (err) return res.send("❌ Imeshindikana kutengeneza QR");
    res.send(`
      <html>
        <head><title>BEN WHITTAKER TECH | Pairing</title></head>
        <body style="text-align:center; font-family:sans-serif;">
          <h2>✅ Namba Yako: ${userPhoneNumber}</h2>
          <h3>🔐 Pair Code: <span style="color:green;">${pairCode}</span></h3>
          <img src="${qr}" alt="QR Code" width="200"/>
          <p>📱 Scan QR kwenye terminal au tumia code hii kujipanga na WhatsApp yako.</p>
        </body>
      </html>
    `);
  });
});

(async () => {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    browser: ["BEN WHITTAKER TECH", "Chrome", "1.0.0"],
  });

  store.bind(sock.ev);
  sock.ev.on("creds.update", saveCreds);

  // 🔄 Handle connection status
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ WhatsApp Connected");

      // Tuma session.zip
      const zip = new AdmZip();
      zip.addLocalFolder(SESSION_FOLDER);
      const zipPath = path.join(__dirname, "session.zip");
      zip.writeZip(zipPath);

      if (userPhoneNumber) {
        const jid = jidNormalizedUser(userPhoneNumber + "@s.whatsapp.net");
        const buffer = fs.readFileSync(zipPath);

        await sock.sendMessage(jid, {
          document: buffer,
          mimetype: "application/zip",
          fileName: "joker-md-session.zip",
          caption: "✅ Session yako iko hapa. Pakua na deploy bot yako mwenyewe 💻"
        });

        console.log(`📤 session.zip imetumwa kwa ${userPhoneNumber}`);
        userPhoneNumber = null;
      } else {
        console.log("❌ Namba ya simu haikuhifadhiwa.");
      }
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if ([401, 403].includes(reason)) {
        await fs.remove(SESSION_FOLDER);
        console.log("❌ Session imeharibika. Inafuta...");
        process.exit(1);
      } else {
        console.log("🔁 Ku-reconnect...");
        process.exit(1);
      }
    }
  });

  // 📥 Message Listener
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const body = m.message.conversation || m.message?.extendedTextMessage?.text || "";
    if (!body.startsWith(process.env.PREFIX)) return;

    const args = body.slice(process.env.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
      const handler = require("./ben"); // Load ben.js for commands
      await handler(sock, m, command, args);
    } catch (err) {
      console.error(err);
    }
  });
})();

// 🌐 Start Web Server
app.listen(PORT, () => {
  console.log(`🌍 Kisasa UI: http://localhost:${PORT}`);
});
