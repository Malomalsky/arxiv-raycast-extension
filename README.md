# arXiv

An independent Raycast extension for finding papers, keeping a reading list, and following categories, authors, or keywords.

## Install

Requires Raycast and Node.js 22 or later.

```sh
git clone https://github.com/Malomalsky/arxiv-raycast-extension.git
cd arxiv-raycast-extension
npm ci
npm run dev
```

## Commands

| Command       | Use                                                                               |
| ------------- | --------------------------------------------------------------------------------- |
| Search Papers | Search arXiv, filter by publication date or category, and change the sort order.  |
| Bookmarks     | Search saved papers, filter by reading status, and edit tags, notes, or a rating. |
| Browse Feeds  | Browse recent papers from all subscriptions or choose one in the dropdown.        |
| Subscriptions | Add, edit, or remove a category, author, or keyword subscription.                 |

Paper lists share an abstract preview and the same actions. Search accepts arXiv syntax such as `ti:transformer`, `au:"Yann LeCun"`, and `cat:cs.LG`. Recent searches appear when the search field is empty. Standard search results load in pages of 30.

Citation sorting ranks the first 100 arXiv matches using Semantic Scholar counts, cached for 24 hours. Papers missing from Semantic Scholar appear after papers with known counts. This is not a ranking of every matching paper on arXiv.

Feeds refresh when opened or refreshed manually; they do not send background notifications. A combined feed requests up to 100 papers across category subscriptions and 50 per author or keyword, then removes duplicates. Requests to arXiv are spaced three seconds apart, so larger subscription lists take longer to load.

## Keyboard shortcuts

| Shortcut        | Action                              |
| --------------- | ----------------------------------- |
| Enter           | Open the paper on arXiv             |
| Command-D       | Download the PDF                    |
| Command-B       | Add or remove a bookmark            |
| Command-E       | Edit a bookmark or subscription     |
| Command-Y       | Show or hide the abstract preview   |
| Command-Shift-C | Copy BibTeX                         |
| Command-Shift-G | Copy a GOST citation                |
| Command-Shift-F | Open search filters                 |
| Command-R       | Refresh the current list            |
| Command-N       | Add a subscription in Subscriptions |

Additional copy, reading-status, export, and folder actions are available in the action panel.

## PDFs and local data

Set the download folder and automatic opening in the extension preferences. The default folder is `~/Downloads/Papers`. Filenames include the arXiv identifier to distinguish papers with similar titles. Downloads are validated as PDFs before being saved; an existing download with the same filename is reused. PDFs saved by earlier versions keep their original names.

Bookmarks, subscriptions, search history, reading status, and citation counts stay in Raycast's local storage. Existing saved data uses the same storage keys. Search filters and preview visibility are remembered between launches.

## Development

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

The regression tests use in-memory storage and mocked network responses; they do not touch your Raycast library or make API requests. The extension uses the installed Raycast SDK's esbuild dependency to bundle test modules.

## License

MIT

The icon uses [arXiv's logomark](https://github.com/arXiv/arxiv-browse/blob/develop/browse/static/images/arxiv-logomark-small-white.svg) to identify the source of the paper data. This extension is independently maintained and is not affiliated with or endorsed by arXiv.
