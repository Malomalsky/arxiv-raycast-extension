module.exports = {
  root: true,
  extends: "@raycast",
  rules: {
    // The legacy rule changes arXiv, BibTeX, PDF and GOST to incorrect spellings.
    "@raycast/prefer-title-case": "off",
  },
};
