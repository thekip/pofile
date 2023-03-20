import { PO } from "../src";
import fs from "node:fs/promises";

describe("Parse", () => {
  it("Parses the big po file", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/big.po", "utf8")
    );

    expect(po.items.length).toBe(70);

    const item = po.items[0];
    expect(item.msgid).toBe("Title");
    expect(item.msgstr).toStrictEqual(["Titre"]);
  });

  it("Handles multi-line strings", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/multi-line.po", "utf8")
    );
    expect(po.items.length).toBe(1);

    const item = po.items[0];
    expect(item.msgid).toBe(
      "The following placeholder tokens can be used in both paths and titles. When used in a path or title, they will be replaced with the appropriate values."
    );
    expect(item.msgstr).toStrictEqual([
      "Les ébauches de jetons suivantes peuvent être utilisées à la fois dans les chemins et dans les titres. Lorsqu'elles sont utilisées dans un chemin ou un titre, elles seront remplacées par les valeurs appropriées.",
    ]);
  });

  it("Handles multi-line headers", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/multi-line.po", "utf8")
    );

    expect(po.items.length).toBe(1);
    expect(po.headers["Plural-Forms"]).toMatchInlineSnapshot(
      `"nplurals=3; plural=n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;"`
    );
  });

  it("Handle empty comments", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/comment.po", "utf8")
    );

    expect(po.items[1]).toMatchObject({
      msgid: "Empty comment",
      msgstr: ["Empty"],
      comments: [""],
      extractedComments: [""],
      references: [""],
    });
  });

  it("Handles translator comments", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/comment.po", "utf8")
    );
    expect(po.items.length).toBe(2);

    expect(po.items[0]).toMatchObject({
      msgid: "Title, as plain text",
      msgstr: ["Attribut title, en tant que texte brut"],
      comments: ["Translator comment"],
    });
  });

  it("Handles extracted comments", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/comment.po", "utf8")
    );
    expect(po.items.length).toBe(2);

    expect(po.extractedComments).toStrictEqual(["extracted from test"]);
    expect(po.items[0]).toMatchObject({
      msgid: "Title, as plain text",
      msgstr: ["Attribut title, en tant que texte brut"],
      extractedComments: ["Extracted comment"],
    });
  });

  describe("Handles string references", () => {
    let po: PO;
    beforeAll(async () => {
      po = PO.parse(
        await fs.readFile(__dirname + "/fixtures/reference.po", "utf8")
      );
    });

    it("in simple cases", () => {
      expect(po.items[0]).toMatchObject({
        msgid: "Title, as plain text",
        msgstr: ["Attribut title, en tant que texte brut"],
        comments: ["Comment"],
        references: [".tmp/crm/controllers/map.js"],
      });
    });

    it("with two different references", () => {
      expect(po.items[1]).toMatchObject({
        msgid: "X",
        msgstr: ["Y"],
        references: ["a", "b"],
      });
    });

    it("and does not process reference items", () => {
      expect(po.items[2]).toMatchObject({
        msgid: "Z",
        msgstr: ["ZZ"],
        references: ["standard input:12 standard input:17"],
      });
    });
  });

  it("Parses flags", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/fuzzy.po", "utf8")
    );

    expect(po.items[0]).toMatchObject({
      msgid: "Sources",
      msgstr: ["Source"],
      flags: { fuzzy: true },
    });
  });

  it("Parses item context", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/big.po", "utf8")
    );

    const ambiguousItems = po.items.filter(
      (item) => item.msgid === "Empty folder"
    );

    expect(ambiguousItems[0].msgctxt).toBe("folder display");
    expect(ambiguousItems[1].msgctxt).toBe("folder action");
  });

  it("Parses item multiline context", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/big.po", "utf8")
    );

    const item = po.items.find(
      (item) => item.msgid === "Created Date" && item.msgctxt === "folder meta"
    );

    expect(item.msgctxt).toBe("folder meta");
  });

  it("Handles obsolete items", async () => {
    const po = PO.parse(
      await fs.readFile(__dirname + "/fixtures/commented.po", "utf8")
    );

    expect(po.items.length).toBe(4);

    expect(po.items[0]).toMatchObject({
      obsolete: false,
      msgid: "{{dataLoader.data.length}} results",
      msgstr: ["{{dataLoader.data.length}} resultaten"],
    });

    expect(po.items[1]).toMatchObject({
      obsolete: true,
      msgid: "Add order",
      msgstr: ["Order toevoegen"],
    });

    expect(po.items[2]).toMatchObject({
      obsolete: true,
      msgid: "Commented item",
      msgstr: ["not sure"],
    });

    expect(po.items[3]).toMatchObject({
      obsolete: true,
      msgid: "Second commented item",
      msgstr: ["also not sure"],
    });
  });

  describe("C-Strings", () => {
    let po: PO;
    beforeAll(async () => {
      po = PO.parse(
        await fs.readFile(__dirname + "/fixtures/c-strings.po", "utf8")
      );
    });

    it('should extract strings containing " and \\ characters', () => {
      const items = po.items.filter((item) =>
        /^The name field must not contain/.test(item.msgid)
      );

      expect(items[0].msgid).toBe(
        'The name field must not contain characters like " or \\'
      );
    });

    it("should handle \\n characters", () => {
      const item = po.items[1];
      expect(item.msgid).toBe("%1$s\n%2$s %3$s\n%4$s\n%5$s");
    });

    it("should handle \\t characters", () => {
      const item = po.items[2];
      expect(item.msgid).toMatchInlineSnapshot(`
        "define('some/test/module', function () {
        	'use strict';
        	return {};
        });
        "
      `);
    });
  });
});
