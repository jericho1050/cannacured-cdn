import { expect } from "chai";
export const verifyAttachment = async (fileId) => {
    const res = await fetch("http://localhost:3000/verify/1/" + fileId + "?type=ATTACHMENT", {
      method: "POST",

    })
    const json = await res.json()
    expect(res.status).to.equal(200);
    return json;
}