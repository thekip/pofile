[![Code Coverage][Badge-Coverage]][Coverage]
[![License][badge-license]][license]
[![Version][badge-version]][package]
[![Downloads][badge-downloads]][package]
[![Join the community on Discord][Badge-Discord]][Discord]

# pofile - gettext .po parsing for JavaScript

> Parse and serialize Gettext PO files.

## Fork Description:

This is a fork of [rubenv/pofile](rubenv/pofile). The original author considered that project as "finished".
But in modern software development there no such thing as finished code. Ecosystem changes over time,
new technologies and best practices appear and one day code become obsolete and not compatible with 
current technologies. 

This fork aimed to keep this lib up to day using modern tooling and under stewardship of `LinguiJS` org.

- No functional changes in reading/parsing
- Full rewrite to Typescript + codebase aligned with modern JS syntax
- Entities exported as ESM - means no more problems with importing Type
- Built as cjs + esm typings extracted from code
- `load()` and `save()` methods are removed. Use native modules for that.
- Test are re-implemented in Jest

## Usage
Add pofile to your project:

### Installation
```bash
npm install --save @lingui/pofile
# or
yarn add @lingui/pofile
```

Reference it in your code:

```js
import {PO} from '@lingui/pofile';

// or using commonjs
const {PO} = require('@lingui/pofile')
```

### Loading and parsing

You can create a new empty PO file by using the class:

```js
const po = new PO();
```

Or by parsing a string:

```js
const po = PO.parse(myString);
```

### The PO class

The `PO` class exposes members:

* `comments`: An array of comments (found at the header of the file).
* `headers`: A dictionary of the headers.
* `items`: An array of `POItem` objects, each of which represents a string
  from the gettext catalog.
* `toString()`: Serializes the po file to a string.


### The PoItem class

The `POItem` class exposes the following members:

* `msgid`: The message id.
* `msgid_plural`: The plural message id (null if absent).
* `msgstr`: An array of translated strings. Items that have no plural msgid
  only have one element in this array.
* `references`: An array of reference strings.
* `comments`: An array of string translator comments.
* `extractedComments`: An array of string extracted comments.
* `flags`: A dictionary of the string flags. Each flag is mapped to a key with
  value true. For instance, a string with the fuzzy flag set will have
  `item.flags.fuzzy == true`.
* `msgctxt`: Context of the message, an arbitrary string, can be used for disambiguation.


## Contributing

Styleguide is forced by prettier, test are written used Jest. 
Add unit tests for any new or changed functionality. Run prettier before commiting the code.

[Badge-MainSuite-GithubCI]: https://github.com/thekip/pofile/workflows/test/badge.svg
[Coverage]: https://codecov.io/gh/lingui/js-lingui
[license]: https://github.com/lingui/pofile/blob/main/LICENSE
[package]: https://www.npmjs.com/package/@lingui/pofile
[Discord]: https://discord.gg/gFWwAYnMtA
