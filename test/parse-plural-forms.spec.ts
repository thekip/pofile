import { parsePluralForms, PluralFormsParsed } from "../src";

describe(".parsePluralForms()", () => {
  it("should return an object with empty nplurals and plural expression when there is no plural forms header", () => {
    const expected: PluralFormsParsed = {
      nplurals: undefined,
      plural: undefined,
    };

    // @ts-expect-error
    expect(parsePluralForms()).toStrictEqual(expected);
    expect(parsePluralForms(null)).toStrictEqual(expected);
    expect(parsePluralForms("")).toStrictEqual(expected);
  });

  it("should return an object with nplurals and plural set to xgettext's default output", () => {
    const pluralForms = "nplurals=INTEGER; plural=EXPRESSION;";

    const expected: PluralFormsParsed = {
      nplurals: "INTEGER",
      plural: "EXPRESSION",
    };

    expect(parsePluralForms(pluralForms)).toStrictEqual(expected);
  });

  it("should return an object with nplurals and plural set to typical string", () => {
    const pluralForms =
      "nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);";

    const expected: PluralFormsParsed = {
      nplurals: "3",
      plural:
        "(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)",
    };
    expect(parsePluralForms(pluralForms)).toStrictEqual(expected);
  });

  // node-gettext stores plural forms strings with spaces. They don't appear
  // to write PO files at all, but it seems prudent to handle this case
  // anyway. See
  // https://github.com/alexanderwallin/node-gettext/blob/v1.1.0/lib/plurals.js#L14
  it("should handle spaces around assignments in plural forms string", () => {
    const pluralForms =
      "nplurals = 3; plural = (n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);";

    const expected: PluralFormsParsed = {
      nplurals: "3",
      plural:
        "(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)",
    };
    expect(parsePluralForms(pluralForms)).toStrictEqual(expected);
  });
});
