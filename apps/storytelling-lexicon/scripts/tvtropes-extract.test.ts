import assert from "node:assert/strict";
import { test } from "node:test";
import { extractDescription } from "./tvtropes-extract";

// A synthetic page shaped like a TV Tropes trope article. Not real page
// content — it only exercises the structure the extractor relies on.
const page = `
<html><body>
<div id="main-article">
  <div class="quoteright"><img src="x.png"></div>
  <div class="indent"><em>"An opening epigraph."</em><br>— Someone</div>
  <p>First paragraph about the <a href="/x">trope</a>.<span class="notelabel">*</span><span class="inlinefolder">a footnote</span></p>
  <p>Second   paragraph,
     spread over lines.</p>
  <ul><li>A variant</li><li>Another variant</li></ul>
  <h2>Examples:</h2>
  <div class="folderlabel">Anime &amp; Manga</div>
  <div class="folder"><ul><li>An example that must not appear.</li></ul></div>
</div>
</body></html>`;

test("keeps the description, drops the epigraph, footnotes and examples", () => {
  assert.equal(
    extractDescription(page),
    "First paragraph about the trope.\n\nSecond paragraph, spread over lines.\n\n• A variant\n• Another variant",
  );
});

test("returns empty when there's no article", () => {
  assert.equal(extractDescription("<html><body><p>nope</p></body></html>"), "");
});
