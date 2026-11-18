# Individual treatment covers

Requested change: replace repeated treatment cover photos with a distinct, relevant image for every treatment while retaining the approved site's aesthetic.

Art direction: soft side daylight, restrained ivory stone and forest green, realistic material textures, quiet compositions with generous framing. Individual subjects distinguish the 23 treatments. These are newly generated editorial illustrations made with the built-in image_gen tool, not source-clinic photographs or documented patient outcomes.

The final assets live in `public/images/treatments/`. `data/service-covers.json` maps every service route to its individual image and descriptive English alt text. The mapping is applied to home featured cards, the treatment directory and the corresponding internal treatment pages. Original extracted content and original image files remain intact.

The exact generation prompts and output paths are recorded in `treatment-cover-prompts.json`. The contact sheet is `screenshots/treatment-covers-contact-sheet.jpg`. Images are served as high-quality WebP with the site's existing responsive Next Image pipeline.

No generated image was added to the clinical smile gallery, doctor biographies or patient testimonials. Portraits in this collection are illustrative and carry no claims about individual treatment results. Instrument and model still lifes are editorial covers, not procedural instructions or clinically validated diagrams.

Focused verification: uniqueness of all 23 asset hashes, image loading and route mapping for each internal page, home featured cards and the full directory, descriptive alt text, mobile/desktop horizontal overflow and browser runtime errors. Build and lint are checked after integration.
