export type PoHeaders = {
  "Project-Id-Version": string;
  "Report-Msgid-Bugs-To": string;
  "POT-Creation-Date": string;
  "PO-Revision-Date": string;
  "Last-Translator": string;
  Language: string;
  "Language-Team": string;
  "Content-Type": string;
  "Content-Transfer-Encoding": string;
  "Plural-Forms": string;
  [name: string]: string;
};

export class PO {
  comments: string[] = [];
  extractedComments: string[] = [];
  headers: Partial<PoHeaders> = {};
  headerOrder: string[] = [];
  items: PoItem[] = [];

  public toString() {
    const lines: string[] = [];

    if (this.comments) {
      this.comments.forEach((comment) => {
        lines.push(("# " + comment).trim());
      });
    }
    if (this.extractedComments) {
      this.extractedComments.forEach((comment) => {
        lines.push(("#. " + comment).trim());
      });
    }

    lines.push('msgid ""');
    lines.push('msgstr ""');

    const headerOrder: string[] = [];

    this.headerOrder.forEach((key) => {
      if (key in this.headers) {
        headerOrder.push(key);
      }
    });

    const keys = Object.keys(this.headers);

    keys.forEach((key) => {
      if (headerOrder.indexOf(key) === -1) {
        headerOrder.push(key);
      }
    });

    headerOrder.forEach((key) => {
      lines.push('"' + key + ": " + this.headers[key] + '\\n"');
    });

    lines.push("");

    this.items.forEach((item) => {
      lines.push(item.toString());
      lines.push("");
    });

    return lines.join("\n");
  }

  public static parse(data: string) {
    //support both unix and windows newline formats.
    data = data.replace(/\r\n/g, "\n");
    const po = new PO();
    const sections = data.split(/\n\n/);
    let headers = [];
    //everything until the first 'msgid ""' is considered header
    while (
      sections[0] &&
      (headers.length === 0 ||
        !headers[headers.length - 1].includes('msgid ""'))
    ) {
      if (sections[0].match(/msgid\s+"[^"]/)) {
        //found first real string, adding a dummy header item
        headers.push('msgid ""');
      } else {
        headers.push(sections.shift());
      }
    }

    const lines = sections.join("\n").split(/\n/);

    po.headers = {
      "Project-Id-Version": "",
      "Report-Msgid-Bugs-To": "",
      "POT-Creation-Date": "",
      "PO-Revision-Date": "",
      "Last-Translator": "",
      Language: "",
      "Language-Team": "",
      "Content-Type": "",
      "Content-Transfer-Encoding": "",
      "Plural-Forms": "",
    };
    po.headerOrder = [];

    headers
      .join("\n")
      .split(/\n/)
      .reduce<string[] & { merge: boolean }>((acc, line) => {
        if (acc.merge) {
          //join lines, remove last resp. first "
          line = acc.pop().slice(0, -1) + line.slice(1);
          delete acc.merge;
        }
        if (/^".*"$/.test(line) && !/^".*\\n"$/.test(line)) {
          acc.merge = true;
        }
        acc.push(line);
        return acc;
      }, [] as any)
      .forEach((header) => {
        if (header.match(/^#\./)) {
          po.extractedComments.push(header.replace(/^#\.\s*/, ""));
        } else if (header.match(/^#/)) {
          po.comments.push(header.replace(/^#\s*/, ""));
        } else if (header.match(/^"/)) {
          header = header.trim().replace(/^"/, "").replace(/\\n"$/, "");
          const p = header.split(/:/);
          const name = p.shift().trim();
          po.headers[name] = p.join(":").trim();
          po.headerOrder.push(name);
        }
      });

    const parsedPluralForms = parsePluralForms(po.headers["Plural-Forms"]);
    const nplurals = parsedPluralForms.nplurals;
    let item = new PoItem({ nplurals });
    let context: string = null;
    let plural = 0;
    let obsoleteCount = 0;
    let noCommentLineCount = 0;

    const finish = () => {
      if (item.msgid.length > 0) {
        if (obsoleteCount >= noCommentLineCount) {
          item.obsolete = true;
        }
        obsoleteCount = 0;
        noCommentLineCount = 0;
        po.items.push(item);
        item = new PoItem({ nplurals });
      }
    };

    while (lines.length > 0) {
      let line = lines.shift().trim();
      let lineObsolete = false;

      if (line.match(/^#\~/)) {
        // Obsolete item
        //only remove the obsolte comment mark, here
        //might be, this is a new item, so
        //only remember, this line is marked obsolete, count after line is parsed
        line = line.substring(2).trim();
        lineObsolete = true;
      }

      if (line.match(/^#:/)) {
        // Reference
        finish();
        item.references.push(line.replace(/^#:/, "").trim());
      } else if (line.match(/^#,/)) {
        // Flags
        finish();
        const flags = line.replace(/^#,/, "").trim().split(",");
        flags.forEach((flag) => (item.flags[flag] = true));
      } else if (line.match(/^#($|\s+)/)) {
        // Translator comment
        finish();
        item.comments.push(line.replace(/^#($|\s+)/, "").trim());
      } else if (line.match(/^#\./)) {
        // Extracted comment
        finish();
        item.extractedComments.push(line.replace(/^#\./, "").trim());
      } else if (line.match(/^msgid_plural/)) {
        // Plural form
        item.msgid_plural = extract(line);
        context = "msgid_plural";
        noCommentLineCount++;
      } else if (line.match(/^msgid/)) {
        // Original
        finish();
        item.msgid = extract(line);
        context = "msgid";
        noCommentLineCount++;
      } else if (line.match(/^msgstr/)) {
        // Translation
        const m = line.match(/^msgstr\[(\d+)\]/);
        plural = m && m[1] ? parseInt(m[1]) : 0;
        item.msgstr[plural] = extract(line);
        context = "msgstr";
        noCommentLineCount++;
      } else if (line.match(/^msgctxt/)) {
        // Context
        finish();
        item.msgctxt = extract(line);
        context = "msgctxt";
        noCommentLineCount++;
      } else {
        // Probably multiline string or blank
        if (line.length > 0) {
          noCommentLineCount++;
          if (context === "msgstr") {
            item.msgstr[plural] += extract(line);
          } else if (context === "msgid") {
            item.msgid += extract(line);
          } else if (context === "msgid_plural") {
            item.msgid_plural += extract(line);
          } else if (context === "msgctxt") {
            item.msgctxt += extract(line);
          }
        }
      }

      if (lineObsolete) {
        // Count obsolete lines for this item
        obsoleteCount++;
      }
    }
    finish();

    return po;
  }
}

export type PluralFormsParsed = {
  nplurals: string;
  plural: string;
};
export function parsePluralForms(pluralFormsString: string): PluralFormsParsed {
  const results = (pluralFormsString || "")
    .split(";")
    .reduce<Record<string, string>>((acc, keyValueString) => {
      const trimmedString = keyValueString.trim();
      const equalsIndex = trimmedString.indexOf("=");
      const key = trimmedString.substring(0, equalsIndex).trim();

      acc[key] = trimmedString.substring(equalsIndex + 1).trim();
      return acc;
    }, {});

  return {
    nplurals: results.nplurals,
    plural: results.plural,
  };
}

export class PoItem {
  msgid: string = "";
  msgctxt: string = null;
  references: string[] = [];
  msgid_plural?: string = null;
  msgstr: string[] = [];
  comments: string[] = [];
  extractedComments: string[] = [];
  flags: Record<string, boolean | undefined> = {};
  obsolete: boolean = false;

  private nplurals: number;

  constructor(options?: { nplurals: string }) {
    const npluralsNumber = Number(options?.nplurals);
    this.nplurals = isNaN(npluralsNumber) ? 2 : npluralsNumber;
  }

  public toString() {
    let lines: string[] = [];

    // https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html
    // says order is translator-comments, extracted-comments, references, flags
    this.comments.forEach((c) => {
      lines.push("# " + c);
    });

    this.extractedComments.forEach((c) => {
      lines.push("#. " + c);
    });

    this.references.forEach((ref) => {
      lines.push("#: " + ref);
    });

    const flags = Object.keys(this.flags).filter((flag) => !!this.flags[flag]);

    if (flags.length > 0) {
      lines.push("#, " + flags.join(","));
    }
    const mkObsolete = this.obsolete ? "#~ " : "";

    ["msgctxt", "msgid", "msgid_plural", "msgstr"].forEach((keyword) => {
      const text = (this as any)[keyword] as string;
      if (text != null) {
        let hasTranslation = false;
        if (Array.isArray(text)) {
          hasTranslation = text.some((text) => {
            return text;
          });
        }

        if (Array.isArray(text) && text.length > 1) {
          text.forEach((t, i) => {
            const processed = _processLineBreak(keyword, t, i);
            lines = lines.concat(
              mkObsolete + processed.join("\n" + mkObsolete)
            );
          });
        } else if (
          this.msgid_plural &&
          keyword === "msgstr" &&
          !hasTranslation
        ) {
          for (
            let pluralIndex = 0;
            pluralIndex < this.nplurals;
            pluralIndex++
          ) {
            lines = lines.concat(
              mkObsolete + _process(keyword, "", pluralIndex)
            );
          }
        } else {
          const index =
            this.msgid_plural && Array.isArray(text) ? 0 : undefined;
          const processed = _processLineBreak(
            keyword,
            Array.isArray(text) ? text.join() : text,
            index
          );
          lines = lines.concat(mkObsolete + processed.join("\n" + mkObsolete));
        }
      }
    });

    return lines.join("\n");
  }
}

// reverse what extract(string) method during PO.parse does
const _escape = (input: string) => {
  // don't unescape \n, since string can never contain it
  // since split('\n') is called on it
  return input.replace(/[\x07\b\t\v\f\r"\\]/g, (match) => {
    switch (match) {
      case "\x07":
        return "\\a";
      case "\b":
        return "\\b";
      case "\t":
        return "\\t";
      case "\v":
        return "\\v";
      case "\f":
        return "\\f";
      case "\r":
        return "\\r";
      default:
        return "\\" + match;
    }
  });
};

function extract(string: string) {
  return string
    .trim()
    .replace(/^[^"]*"|"$/g, "")
    .replace(
      /\\([abtnvfr'"\\?]|([0-7]{3})|x([0-9a-fA-F]{2}))/g,
      (match, esc, oct, hex) => {
        if (oct) {
          return String.fromCharCode(parseInt(oct, 8));
        }
        if (hex) {
          return String.fromCharCode(parseInt(hex, 16));
        }
        switch (esc) {
          case "a":
            return "\x07";
          case "b":
            return "\b";
          case "t":
            return "\t";
          case "n":
            return "\n";
          case "v":
            return "\v";
          case "f":
            return "\f";
          case "r":
            return "\r";
          default:
            return esc;
        }
      }
    );
}

const _process = (keyword: string, text: string, i: number): string[] => {
  const lines: string[] = [];
  const parts = text.split(/\n/);
  const index = typeof i !== "undefined" ? "[" + i + "]" : "";
  if (parts.length > 1) {
    lines.push(keyword + index + ' ""');
    parts.forEach((part) => {
      lines.push('"' + _escape(part) + '"');
    });
  } else {
    lines.push(keyword + index + ' "' + _escape(text) + '"');
  }
  return lines;
};

//handle \n in single-line texts (can not be handled in _escape)
const _processLineBreak = (keyword: string, text: string, index: number) => {
  const processed = _process(keyword, text, index);

  for (let i = 1; i < processed.length - 1; i++) {
    processed[i] = processed[i].slice(0, -1) + '\\n"';
  }
  return processed;
};
