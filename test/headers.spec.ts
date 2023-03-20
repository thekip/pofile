import { PO } from "../src";
import fs from "node:fs/promises";

describe("Headers", () => {
  it("Parses headers correctly", async () => {
    const content = await fs.readFile(__dirname + "/fixtures/big.po");
    const po = PO.parse(content.toString());

    // There are 11 headers in the .po file, but some default headers
    // are defined (nr. 12 in this case is Report-Msgid-Bugs-To).
    expect(po.headers).toMatchInlineSnapshot(`
      {
        "Content-Transfer-Encoding": "8bit",
        "Content-Type": "text/plain; charset=UTF-8",
        "Language": "fr",
        "Language-Team": "French",
        "Last-Translator": "Ruben Vermeersch <ruben@rocketeer.be>",
        "MIME-Version": "1.0",
        "PO-Revision-Date": "2013-12-17 14:21+0100",
        "POT-Creation-Date": "2011-12-31 23:39+0000",
        "Plural-Forms": "nplurals=2; plural=(n > 1);",
        "Project-Id-Version": "Link (6.x-2.9)",
        "Report-Msgid-Bugs-To": "",
        "X-Generator": "Poedit 1.6.2",
      }
    `);
  });

  describe("PO files with no headers", () => {
    it("Parses an empty string", () => {
      const po = PO.parse("");
      expect(po).not.toBeNull();

      // all headers should be empty
      for (var key in po.headers) {
        expect(po.headers[key]).toBe("");
      }
      expect(po.items.length).toBe(0);
    });

    it("Parses a minimal example", () => {
      const po = PO.parse('msgid "minimal PO"\nmsgstr ""');

      expect(po).not.toBeNull();

      // all headers should be empty
      for (var key in po.headers) {
        expect(po.headers[key]).toBe("");
      }
      expect(po.items.length).toBe(1);
    });

    it("Parses advanced example", async () => {
      const content = await fs.readFile(__dirname + "/fixtures/no_header.po");
      const po = PO.parse(content.toString());

      expect(po.items).toMatchInlineSnapshot(`
        [
          PoItem {
            "comments": [],
            "extractedComments": [],
            "flags": {},
            "msgctxt": null,
            "msgid": "First id, no header",
            "msgid_plural": null,
            "msgstr": [
              "",
            ],
            "nplurals": 2,
            "obsolete": false,
            "references": [],
          },
          PoItem {
            "comments": [],
            "extractedComments": [],
            "flags": {},
            "msgctxt": null,
            "msgid": "A second string",
            "msgid_plural": null,
            "msgstr": [
              "",
            ],
            "nplurals": 2,
            "obsolete": false,
            "references": [],
          },
        ]
      `);
    });

    it("advanced example with extra spaces", async () => {
      const content = await fs.readFile(
        __dirname + "/fixtures/no_header_extra_spaces.po"
      );
      const po = PO.parse(content.toString());

      expect(po.items).toMatchInlineSnapshot(`
        [
          PoItem {
            "comments": [],
            "extractedComments": [],
            "flags": {},
            "msgctxt": null,
            "msgid": "First id, no header",
            "msgid_plural": null,
            "msgstr": [
              "",
            ],
            "nplurals": 2,
            "obsolete": false,
            "references": [],
          },
          PoItem {
            "comments": [],
            "extractedComments": [],
            "flags": {},
            "msgctxt": null,
            "msgid": "A second string",
            "msgid_plural": null,
            "msgstr": [
              "",
            ],
            "nplurals": 2,
            "obsolete": false,
            "references": [],
          },
        ]
      `);
    });
  });
});
