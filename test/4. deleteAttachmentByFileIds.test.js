import { expect } from "chai";
import { uploadAttachment } from "./uploadAttachment.js";
import { verifyAttachment } from "./verifyAttachment.js";
import fs from 'fs';
import path from 'path';

let fileId;
let json;
describe("Delete Attachment by fileIds", () => {
  it("upload & verify attachment", async function () {
    this.timeout(5000)
    fileId = await uploadAttachment();
    json = await verifyAttachment(fileId);
  });
  it("File exists in attachment directory", async function () {
    fs.readFileSync(path.join(import.meta.dirname, `../public/attachments/1/${fileId}/test.txt`))
  });
  it("Delete attachment", async function () {
    this.timeout(5000)
    const res = await fetch("http://localhost:3000/batch", {
      method: "DELETE",
      body: JSON.stringify({ paths: [json.path] }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    expect(res.status).to.equal(200);
  });
  it("File exists in attachment directory", async function () {
    let file;
    try {
      file = fs.readFileSync(path.join(import.meta.dirname, `../public/attachments/1/${fileId}/test.txt`));
    } catch {
    }
    expect(file).to.be.undefined
  });
});
