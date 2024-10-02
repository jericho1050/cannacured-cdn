
import "../dist/worker.js" 
import {expect} from 'chai'
import fs from 'fs'
import path from 'path';
import { uploadAttachment } from "./uploadAttachment.js";

let fileId;
describe("Upload Attachment", () => {
  // context("without arguments", () => {
    it("should return fileId", async function () {
      this.timeout(5000)
      fileId = await uploadAttachment();
    });
    it("File exists in temp directory", async function () {
      fs.readFileSync(path.join(import.meta.dirname, `../temp/${fileId}.txt`))
    });
  // });


});
