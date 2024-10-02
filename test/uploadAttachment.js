import { expect } from "chai";
import fs from 'fs';
import path from 'path'
export const uploadAttachment = async () => {
      const formData = new FormData();

      formData.set("file", await fs.openAsBlob(path.join(import.meta.dirname, "./test.txt")), "test.txt");
      const res = await fetch("http://localhost:3000/attachments/1", {
        method: "POST",
   
        body: formData,
      })
      const fileId = (await res.json()).fileId;
      expect(res.status).to.equal(200)
      expect(fileId).to.be.a("string")
      return fileId;
}