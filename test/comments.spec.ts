import { PO } from "../src";
import fs from "node:fs/promises";

describe("Comments", () => {
  let po: PO;

  beforeAll(async () => {
    const content = await fs.readFile(__dirname + "/fixtures/big.po");
    po = PO.parse(content.toString());
  });

  it("Parses the po file", () => {
    expect(po).not.toBeNull();
  });

  it("Parses the comments", () => {
    expect(po.comments).toMatchInlineSnapshot(`
      [
        "French translation of Link (6.x-2.9)",
        "Copyright (c) 2011 by the French translation team",
        "",
      ]
    `);
  });
});
