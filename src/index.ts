import os from "os";
import cluster from "cluster";
import { createFolders, publicDirPath, tempDirPath } from "./utils/Folders";
import { removeExpiredVerifications } from "./VerificationService";
import { setTimeout } from "timers/promises";
import path from "path";
import fs from "fs";

const cpus = os.cpus();

if (cluster.isPrimary) {
  createFolders();
  removeExpiredVerificationsAtInterval();
  for (let i = 0; i < cpus.length; i++) {
    cluster.fork({
      cpu: i,
    });
  }
}

if (cluster.isWorker) {
  import("./worker");
}

// 2 minutes
const removeExpiredVerificationsInterval = 2 * 60 * 1000;
async function removeExpiredVerificationsAtInterval() {
  const results = await removeExpiredVerifications().catch(err => {
    console.error(err)
  });

  if (results && results.length) {
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      if (!item) continue;
      const filePath = path.join(tempDirPath, item.tempFilename);
      fs.promises.unlink(filePath).catch(() => { });
    }

    console.log("Removed", results.length, "expired files.")
  }
  await setTimeout(removeExpiredVerificationsInterval);
  removeExpiredVerificationsAtInterval();
}
