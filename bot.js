import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";

dotenv.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log("🤖 Bot aktif");

// === Inisialisasi folder/data ===
const DATA_DIR = "./data";
const VIDEO_DIR = "./data-video";
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");

await fs.ensureDir(DATA_DIR);
await fs.ensureDir(VIDEO_DIR);
if (!(await fs.pathExists(VIDEOS_FILE))) await fs.writeJson(VIDEOS_FILE, {}, { spaces: 2 });
if (!(await fs.pathExists(GROUPS_FILE))) await fs.writeJson(GROUPS_FILE, [], { spaces: 2 });

const loadVideos = async () => fs.readJson(VIDEOS_FILE);
const loadGroups = async () => fs.readJson(GROUPS_FILE);

// === 🆔 Perintah /getgroupid ===
async function handleGetGroupId(chat, origin = "unknown") {
  const id = chat.id;
  const type = chat.type;
  const title = chat.title || chat.username || chat.first_name || "Unknown";

  try {
    await bot.sendMessage(
      id,
      `🆔 <b>Chat Info</b>\n<b>Nama:</b> ${title}\n<b>Tipe:</b> ${type}\n<b>ID:</b> <code>${id}</code>`,
      { parse_mode: "HTML" }
    );
    console.log(`✅ Dapat ID dari ${origin}: ${title} (${type}) → ${id}`);
  } catch (err) {
    console.error("❌ Gagal kirim info chat:", err.message);
  }
}

// Pesan di private/group/supergroup
bot.on("message", (msg) => {
  if (!msg.text) return;
  const txt = msg.text.trim();
  if (txt === "/getgroupid" || txt.startsWith("/getgroupid@")) {
    handleGetGroupId(msg.chat, "message");
  }
});

// Post di channel
bot.on("channel_post", (post) => {
  if (!post.text) return;
  const txt = post.text.trim();
  if (txt === "/getgroupid" || txt.startsWith("/getgroupid@")) {
    handleGetGroupId(post.chat, "channel_post");
  }
});

// Deteksi perubahan status bot (jadi admin, dsb.)
bot.on("my_chat_member", (update) => {
  const chat = update.chat;
  const newStatus = update.new_chat_member.status;
  console.log(`ℹ️ Bot status di ${chat.title || chat.username}: ${newStatus}`);
});

// === 🔎 Cek apakah user sudah join semua grup ===
async function userJoinedAll(userId) {
  const groups = await loadGroups();
  if (!groups.length) return true;

  for (const g of groups) {
    try {
      const m = await bot.getChatMember(g.id, userId);
      if (!["member", "administrator", "creator"].includes(m.status)) return false;
    } catch (err) {
      console.warn(`⚠️ Tidak bisa cek ${g.name} (${g.id}): ${err.message}`);
      // kalau channel private atau bot bukan admin → jangan langsung gagal
      continue;
    }
  }
  return true;
}

// === 🎬 Command /start <token> ===
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const token = match[1];

  if (!token) {
    return bot.sendMessage(chatId, "Kirim link khusus yang kamu dapat untuk menonton video.");
  }

  let id;
  try {
    id = Buffer.from(token, "base64").toString("utf8");
  } catch {
    return bot.sendMessage(chatId, "Link tidak valid.");
  }

  const videos = await loadVideos();
  const v = videos[id];
  if (!v) return bot.sendMessage(chatId, "⚠️ Video tidak ditemukan atau link salah.");

  // Cek join semua grup
  const ok = await userJoinedAll(userId);
  const groups = await loadGroups();

  if (!ok) {
    const kb = [
      ...groups.map(g => [{ text: `• JOIN ${g.name} •`, url: g.url }]),
      [{ text: "✅ COBA LAGI", callback_data: `retry:${id}` }]
    ];
    return bot.sendMessage(
      chatId,
      `👋 Hai ${msg.from.first_name || "kawan"}!\n\nUntuk menonton video ini, kamu harus join semua grup/channel di bawah ini dulu.`,
      { reply_markup: { inline_keyboard: kb } }
    );
  }

  // === Kirim video/link ===
  try {
    if (v.type === "file") {
      const filePath = path.join(VIDEO_DIR, v.filename);
      if (await fs.pathExists(filePath)) {
        await bot.sendVideo(chatId, filePath, { caption: `🎬 ${v.title || "Video"}` });
      } else {
        await bot.sendMessage(chatId, "❌ File video tidak ditemukan di server.");
      }
    } else if (v.type === "link") {
      await bot.sendVideo(chatId, v.url, { caption: `🎬 ${v.title || "Video"}` })
        .catch(async () => {
          await bot.sendMessage(chatId, `🎬 ${v.title || "Video"}\n${v.url}`);
        });
    } else {
      await bot.sendMessage(chatId, `📎 ${v.url || "Konten tidak dikenali"}`);
    }
  } catch (e) {
    console.error("❌ Gagal kirim video:", e.message);
    await bot.sendMessage(chatId, "⚠️ Gagal mengirim video.");
  }
});

// === 🔁 Tombol "Coba lagi" ===
bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const userId = q.from.id;
  const data = q.data || "";
  if (!data.startsWith("retry:")) return;
  const id = data.split(":")[1];

  const videos = await loadVideos();
  const v = videos[id];
  if (!v) return bot.answerCallbackQuery(q.id, { text: "Video tidak ditemukan." });

  if (!(await userJoinedAll(userId))) {
    return bot.answerCallbackQuery(q.id, { text: "❌ Kamu belum join semua grup.", show_alert: true });
  }

  try {
    if (v.type === "file") {
      const filePath = path.join(VIDEO_DIR, v.filename);
      if (await fs.pathExists(filePath)) {
        await bot.sendVideo(chatId, filePath, { caption: `🎬 ${v.title || "Video"}` });
      } else {
        await bot.sendMessage(chatId, "❌ File video tidak ditemukan di server.");
      }
    } else {
      await bot.sendVideo(chatId, v.url, { caption: `🎬 ${v.title || "Video"}` })
        .catch(async () => {
          await bot.sendMessage(chatId, `🎬 ${v.title || "Video"}\n${v.url}`);
        });
    }
    await bot.answerCallbackQuery(q.id, { text: "✅ Oke!", show_alert: false });
  } catch (e) {
    console.error("❌ Error retry:", e.message);
    await bot.answerCallbackQuery(q.id, { text: "⚠️ Gagal mengirim.", show_alert: true });
  }
});
