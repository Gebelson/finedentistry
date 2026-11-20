"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useField } from "@payloadcms/ui";
import { EditorContent, useEditor } from "@tiptap/react";
import { Mark } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import type { ArticleNode } from "@/lib/blog-content";
import {
  articleHTML,
  parseArticleHTML,
  safeArticleImage,
  safeArticleLink,
} from "@/lib/article-ast";

// Original articles use these inline marks. Register them so editing does not
// silently flatten the imported content when TipTap parses the article HTML.
const inlineScript = (name: string, tag: string) =>
  Mark.create({
    name,
    parseHTML: () => [{ tag }],
    renderHTML: () => [tag, 0],
  });

export function ArticleEditor({
  path,
  field,
}: {
  path: string;
  field: { label?: string };
}) {
  const { value, setValue } = useField<ArticleNode[]>({ path });
  const mediaDialog = useRef<HTMLDialogElement>(null);
  const [media, setMedia] = useState<
    { id: number; url?: string; alt: string }[]
  >([]);
  const [mediaError, setMediaError] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [formatError, setFormatError] = useState("");
  const mediaRequest = useRef(false);
  async function chooseImage() {
    if (mediaRequest.current) return;
    mediaRequest.current = true;
    if (!mediaDialog.current?.open) mediaDialog.current?.showModal();
    setMediaLoading(true);
    setMediaError("");
    try {
      const response = await fetch("/api/media?limit=100&sort=-createdAt");
      if (!response.ok) throw Error("Unable to load the image library.");
      const result = await response.json();
      if (!Array.isArray(result.docs))
        throw Error("Unable to load the image library.");
      setMedia(result.docs);
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Unable to load images.",
      );
    } finally {
      mediaRequest.current = false;
      setMediaLoading(false);
    }
  }
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TableKit,
      Image.configure({ allowBase64: false }),
      inlineScript("superscript", "sup"),
      inlineScript("subscript", "sub"),
    ],
    content: articleHTML(value || []),
    editorProps: {
      attributes: {
        "aria-label": String(field.label || "Article content"),
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => setValue(parseArticleHTML(editor.getHTML())),
  });
  useEffect(() => {
    if (editor && !editor.isFocused)
      editor.commands.setContent(articleHTML(value || []), {
        emitUpdate: false,
      });
  }, [editor, value]);
  if (!editor) return <p>Preparing editor…</p>;
  const actions: [string, () => void][] = [
    [
      "Bold",
      () => {
        editor.chain().focus().toggleBold().run();
      },
    ],
    [
      "Italic",
      () => {
        editor.chain().focus().toggleItalic().run();
      },
    ],
    [
      "Heading",
      () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      },
    ],
    [
      "List",
      () => {
        editor.chain().focus().toggleBulletList().run();
      },
    ],
    [
      "Link",
      () => {
        const href = window.prompt(
          "Link URL",
          editor.getAttributes("link").href || "https://",
        );
        if (href === null) return;
        const link = href.trim();
        if (!safeArticleLink(link)) {
          setFormatError(
            "Enter a valid link beginning with https://, http://, mailto:, tel:, / or #.",
          );
          return;
        }
        setFormatError("");
        if (link)
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: link })
            .run();
      },
    ],
    [
      "Remove link",
      () => {
        editor.chain().focus().unsetLink().run();
      },
    ],
    [
      "Table",
      () => {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    ],
    [
      "Add row",
      () => {
        editor.chain().focus().addRowAfter().run();
      },
    ],
    [
      "Add column",
      () => {
        editor.chain().focus().addColumnAfter().run();
      },
    ],
    [
      "Delete table",
      () => {
        editor.chain().focus().deleteTable().run();
      },
    ],
    [
      "Undo",
      () => {
        editor.chain().focus().undo().run();
      },
    ],
  ];
  return (
    <div className="clinic-rich-field">
      <label>{String(field.label || "Article content")}</label>
      <div
        className="clinic-rich-toolbar"
        role="toolbar"
        aria-label="Article formatting"
      >
        {actions.map(([label, action]) => (
          <button type="button" key={label} onClick={action}>
            {label}
          </button>
        ))}
        <button type="button" onClick={() => void chooseImage()}>
          Image
        </button>
      </div>
      <EditorContent editor={editor} />
      {formatError && <p role="alert">{formatError}</p>}
      <dialog
        ref={mediaDialog}
        className="clinic-media-dialog"
        aria-label="Choose a website image"
      >
        <div className="clinic-media-dialog-heading">
          <h2>Choose a website image</h2>
          <button
            type="button"
            onClick={() => mediaDialog.current?.close()}
            aria-label="Close image library"
          >
            ×
          </button>
        </div>
        <p>
          <Link
            href="/admin/collections/media/create"
            target="_blank"
            prefetch={false}
          >
            Upload a new image ↗
          </Link>
        </p>
        <button
          type="button"
          disabled={mediaLoading}
          onClick={() => void chooseImage()}
        >
          {mediaLoading ? "Loading images…" : "Refresh image library"}
        </button>
        {mediaLoading && <p role="status">Loading image library…</p>}
        {mediaError && (
          <p role="alert">{mediaError} Please try refreshing the library.</p>
        )}
        {!mediaLoading && !mediaError && !media.length && (
          <p>No images yet. Upload an image, then refresh this library.</p>
        )}
        <div className="clinic-media-grid">
          {media
            .filter((image) => image.url)
            .map((image) => (
              <button
                type="button"
                key={image.id}
                onClick={() => {
                  const url = new URL(image.url!, window.location.origin);
                  if (
                    url.origin === window.location.origin &&
                    safeArticleImage(url.pathname)
                  ) {
                    editor
                      .chain()
                      .focus()
                      .setImage({ src: url.pathname, alt: image.alt })
                      .run();
                    mediaDialog.current?.close();
                  }
                }}
              >
                <img src={image.url} alt="" width="160" height="110" />
                <span>{image.alt}</span>
              </button>
            ))}
        </div>
      </dialog>
    </div>
  );
}
