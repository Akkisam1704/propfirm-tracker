const express = require("express");
const crypto = require("crypto");
const { Readable } = require("stream");
const { google } = require("googleapis");

const { APP_PASSWORD, DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_JSON } = process.env;
const FILE = "propfirm-data.json";
const app = express();

function same(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Password gate for the whole site (browser shows a login prompt; username can be anything)
app.use((req, res, next) => {
  if (!APP_PASSWORD) return res.status(500).send("APP_PASSWORD is not set on the server.");
  const h = req.headers.authorization || "";
  if (h.startsWith("Basic ")) {
    const pw = Buffer.from(h.slice(6), "base64").toString().split(":").slice(1).join(":");
    if (same(pw, APP_PASSWORD)) return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Prop firm tracker"').status(401).send("Password required.");
});

app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

let drive;
function getDrive() {
  if (!drive) {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    drive = google.drive({ version: "v3", auth });
  }
  return drive;
}

async function findFile(d) {
  const r = await d.files.list({
    q: `name='${FILE}' and '${DRIVE_FOLDER_ID}' in parents and trashed=false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return r.data.files[0];
}

app.get("/api/data", async (req, res) => {
  try {
    const d = getDrive();
    const f = await findFile(d);
    if (!f) return res.json({ entries: [], cur: "$" });
    const r = await d.files.get({ fileId: f.id, alt: "media" }, { responseType: "text" });
    res.type("json").send(typeof r.data === "string" ? r.data : JSON.stringify(r.data));
  } catch (e) {
    console.error("Drive read failed:", e.message);
    res.status(500).json({ error: "drive" });
  }
});

app.put("/api/data", async (req, res) => {
  try {
    const d = getDrive();
    const f = await findFile(d);
    const media = { mimeType: "application/json", body: Readable.from([JSON.stringify(req.body)]) };
    if (f) await d.files.update({ fileId: f.id, media, supportsAllDrives: true });
    else await d.files.create({ requestBody: { name: FILE, parents: [DRIVE_FOLDER_ID] }, media, supportsAllDrives: true });
    res.json({ ok: true });
  } catch (e) {
    console.error("Drive write failed:", e.message);
    res.status(500).json({ error: "drive" });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Running"));
