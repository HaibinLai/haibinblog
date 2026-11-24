# Paper figures

This small, framework-free viewer enhances only figures marked with `data-paper-figure` on post pages. The image and caption remain readable without JavaScript. The article page loads the viewer once and shares one dialog across all marked figures.

In a Markdown post, use raw HTML (supported by the blog's Markdown pipeline):

```html
<figure data-paper-figure>
  <picture>
    <source media="(max-width: 640px)" srcset="/images/example-mobile.svg">
    <img src="/images/example.svg" alt="A concise description of the diagram" loading="lazy">
  </picture>
  <figcaption>Figure 1: Explain what the reader should notice.</figcaption>
</figure>
```

The `<picture>` and mobile `<source>` are optional. A plain `<img>` works for photographs and existing SVGs. Put image files under `public/images/` and use the same site-relative URLs as other posts. The viewer uses the image's selected `currentSrc`, so the enlarged view matches the responsive version currently shown. It supports zoom buttons, wheel zoom, drag-to-pan, arrow-key panning, `+`/`-`/`0`, and the dialog's native Escape-to-close behavior. Unmarked article images are unchanged.
