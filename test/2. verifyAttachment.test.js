import { uploadAttachment } from "./uploadAttachment.js";
import { verifyAttachment } from "./verifyAttachment.js";
import fs from 'fs';
import path from 'path';

let fileId;
describe("Verify Attachment", () => {
  it("upload attachment", async function () {
    this.timeout(5000)
    fileId = await uploadAttachment();
  });
    it("verify attachment", async function () {
      this.timeout(5000)
      const json = await verifyAttachment(fileId);
    });
    it("File exists in attachment directory", async function () {
      fs.readFileSync(path.join(import.meta.dirname, `../public/attachments/1/${fileId}/test.txt`))
    });

});
