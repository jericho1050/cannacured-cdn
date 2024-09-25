import os from "os";
import cluster from "cluster";
import { createFolders, publicDirPath } from "./Folders";

const cpus = os.cpus();

if (cluster.isPrimary) {
  createFolders();
  for (let i = 0; i < cpus.length; i++) {
    cluster.fork({
      cpu: i,
    });
  }
}

if (cluster.isWorker) {
  import("./worker");
}
