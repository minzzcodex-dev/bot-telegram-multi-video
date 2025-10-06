import express from "express";
import fs from "fs-extra";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = "./data";
const VIDEO_DIR = "./data-video";
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");

// ensure dirs/files
await fs.ensureDir(DATA_DIR);
await fs.ensureDir(VIDEO_DIR);
if (!(await fs.pathExists(VIDEOS_FILE))) await fs.writeJson(VIDEOS_FILE, {}, { spaces: 2 });
if (!(await fs.pathExists(GROUPS_FILE))) await fs.writeJson(GROUPS_FILE, [], { spaces: 2 });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// storage untuk upload video
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, VIDEO_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || ".mp4") || ".mp4";
    const name = Date.now() + "-" + Math.random().toString(16).slice(2) + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });

// ======= FRONTEND =======
app.get("/", (_, res) => {
  res.sendFile(path.resolve("./views/upload.html"));
});

// ======= API: get groups =======
app.get("/api/groups", async (_, res) => {
  const groups = await fs.readJson(GROUPS_FILE);
  res.json(groups);
});

// ======= API: add group =======
app.post("/api/groups", async (req, res) => {
  const { name, id, url } = req.body;
  if (!name || !id || !url) return res.status(400).json({ ok: false, error: "name, id, url wajib" });

  const groups = await fs.readJson(GROUPS_FILE);
  groups.push({ name, id, url });
  await fs.writeJson(GROUPS_FILE, groups, { spaces: 2 });
  res.json({ ok: true });
});

// ======= API: delete group (optional) =======
app.delete("/api/groups/:idx", async (req, res) => {
  const idx = Number(req.params.idx);
  const groups = await fs.readJson(GROUPS_FILE);
  if (Number.isNaN(idx) || idx < 0 || idx >= groups.length) return res.status(404).json({ ok: false });
  groups.splice(idx, 1);
  await fs.writeJson(GROUPS_FILE, groups, { spaces: 2 });
  res.json({ ok: true });
});

// ======= API: upload (file OR link) =======
app.post("/api/upload", upload.single("video"), async (req, res) => {
  const { title, url } = req.body;
  if (!title) return res.status(400).json({ ok: false, error: "title wajib" });

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const videos = await fs.readJson(VIDEOS_FILE);

  if (req.file) {
    videos[id] = { type: "file", title, filename: req.file.filename };
  } else if (url) {
    videos[id] = { type: "link", title, url };
  } else {
    return res.status(400).json({ ok: false, error: "Pilih file atau isi link" });
  }

  await fs.writeJson(VIDEOS_FILE, videos, { spaces: 2 });
  const token = Buffer.from(id).toString("base64");
  const link = `https://t.me/${process.env.BOT_USERNAME}?start=${token}`;
  res.json({ ok: true, link });
});

// listen 0.0.0.0 supaya bisa diakses publik
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌍 Admin panel running at http://0.0.0.0:${PORT}`);
});
