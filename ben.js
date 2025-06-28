const os = require("os");
const axios = require("axios");
const moment = require("moment-timezone");

module.exports = async (sock, m, command, args) => {
  const sender = m.key.participant || m.key.remoteJid;
  const pushName = m.pushName || "User";
  const reply = async (text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });

  // Menu
  if (command === "menu") {
    return reply(`🤖 *joker-art Menu*\n\n🧠 AI: ai, gpt, ask\n📥 Downloader: ytmp3, ytmp4, mediafire\n🎧 Audio: tts, say\n🖼️ Image: img, qr\n🎮 Fun: joke, quote, truth\n🛠️ Tools: ping, uptime, time\n🔐 Admin: antilink, kick, tagall\n\n_Powered by joker-art_`);
  }

  // Ping
  if (command === "ping") {
    return reply("🏓 pong! bot is alive\n_Powered by joker-art_");
  }

  // Time
  if (command === "time") {
    const time = moment().tz("Africa/Dar_es_Salaam").format("HH:mm:ss");
    return reply(`⏰ Sasa ni: ${time}\n_Powered by joker-art_`);
  }

  // Uptime
  if (command === "uptime") {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    return reply(`⚙️ Uptime: ${h}h ${m}m ${s}s\n_Powered by joker-art_`);
  }

  // Owner
  if (command === "owner") {
    return reply("👑 Owner: wa.me/255760317060\n_Powered by joker-art_");
  }

  // AI Chat
  if (["ai", "gpt", "ask"].includes(command)) {
    if (!args[0]) return reply("💬 Andika swali: ,ai how are you?");
    const q = args.join(" ");
    try {
      const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(q)}&owner=Ben&botname=joker-art`);
      return reply(`🤖 ${res.data.response}\n_Powered by joker-art_`);
    } catch {
      return reply("❌ AI haijajibu.");
    }
  }

  // Jokes
  if (command === "joke") {
    const res = await axios.get("https://v2.jokeapi.dev/joke/Any?type=single");
    return reply(`😂 ${res.data.joke}\n_Powered by joker-art_`);
  }

  // Quotes
  if (command === "quote") {
    const res = await axios.get("https://api.quotable.io/random");
    return reply(`💬 "${res.data.content}" — ${res.data.author}\n_Powered by joker-art_`);
  }

  // TTS
  if (command === "tts") {
    if (!args[0]) return reply("📢 Andika ujumbe: ,tts hello");
    const gtts = require("node-gtts")("en");
    const path = "./tts.mp3";
    gtts.save(path, args.join(" "), async () => {
      await sock.sendMessage(m.key.remoteJid, { audio: { url: path }, mimetype: "audio/mp4", ptt: true }, { quoted: m });
    });
  }

  // YTMP3
  if (command === "ytmp3") {
    if (!args[0]) return reply("🎵 Tuma link ya YouTube: ,ytmp3 <url>");
    const link = args[0];
    const res = await axios.get(`https://vihangayt.me/downloadytmp3?url=${link}`);
    if (!res.data.status) return reply("❌ Imeshindikana kushusha.");
    await sock.sendMessage(m.key.remoteJid, {
      document: { url: res.data.result.dlink },
      mimetype: "audio/mpeg",
      fileName: res.data.result.title
    }, { quoted: m });
  }

  // QR Generator
  if (command === "qr") {
    if (!args[0]) return reply("🖼️ Andika text: ,qr hello");
    const qr = await axios.get(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(args.join(" "))}&size=250x250`, { responseType: "arraybuffer" });
    await sock.sendMessage(m.key.remoteJid, { image: qr.data, caption: "✅ QR generated.\n_Powered by joker-art_" }, { quoted: m });
  }

  // Truth
  if (command === "truth") {
    const list = ["Have you ever lied to your best friend?", "What’s your biggest fear?", "Ever been rejected?"];
    return reply(`🧐 Truth: ${list[Math.floor(Math.random() * list.length)]}\n_Powered by joker-art_`);
  }

  // Dare
  if (command === "dare") {
    const list = ["Sing a song 🎤", "Text your crush ❤️", "Send a voice note 😂"];
    return reply(`😈 Dare: ${list[Math.floor(Math.random() * list.length)]}\n_Powered by joker-art_`);
  }

  // AntiLink ON/OFF
  if (command === "antilink") {
    const status = args[0];
    if (!["on", "off"].includes(status)) return reply("⚙️ Tumia: ,antilink on / off");
    return reply(`🔒 AntiLink now *${status.toUpperCase()}*\n_Powered by joker-art_`);
  }

  // Say
  if (command === "say") {
    if (!args[0]) return reply("🗣️ Tuma ujumbe: ,say hello");
    return reply(args.join(" ") + "\n_Powered by joker-art_");
  }

  // Mediafire (dummy)
  if (command === "mediafire") {
    return reply("📥 Mediafire command inapatikana hivi karibuni...\n_Powered by joker-art_");
  }

  // Sticker (placeholder)
  if (command === "sticker") {
    return reply("🌟 Sticker feature coming soon...\n_Powered by joker-art_");
  }

  // YTMP4
  if (command === "ytmp4") {
    return reply("📹 Video downloader inakuja karibuni...\n_Powered by joker-art_");
  }

  // TagAll
  if (command === "tagall") {
    return reply("@all 🚨\n_Powered by joker-art_");
  }

  // Kick (mock)
  if (command === "kick") {
    return reply("👢 Member ametolewa (not really 😅)\n_Powered by joker-art_");
  }

  // Botname
  if (command === "botname") {
    return reply("🤖 Mimi ni *joker-art*\n_Powered by joker-art_");
  }

  // Source
  if (command === "source") {
    return reply("💻 Source code available soon!\n_Powered by joker-art_");
  }

  // Default
  if (!["menu", "ping", "uptime", "truth", "dare", "tts", "ytmp3", "ytmp4", "qr", "say", "sticker", "kick", "tagall", "mediafire", "quote", "joke", "ai", "gpt", "ask", "owner", "time", "botname", "antilink", "source"].includes(command)) {
    return reply("❓ Command haipo. Tumia ,menu kuona orodha.\n_Powered by joker-art_");
  }
};
