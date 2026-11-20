const path = require("node:path");
const { build } = require("esbuild");

// Render actual components with the Payload field/document hooks supplied by the
// harness. API calls are intercepted by each test; no clinic records are written.
exports.mount = async (page, file, name, fixture = {}) => {
  const result = await build({
    stdin: {
      contents: `import React from "react"; import { createRoot } from "react-dom/client";
        import { ${name} } from ${JSON.stringify("./" + file)};
        function Harness() {
          const [instance, setInstance] = React.useState(0);
          const props = {path:"body",field:{label:"Article content"}, ...window.fixture.props};
          if (!window.fixture.replaceable) return React.createElement(${name}, props);
          return React.createElement(React.Fragment, null,
            React.createElement("button", {onClick:()=>setInstance(i=>i+1)}, "Replace form instance"),
            React.createElement(${name}, {...props,key:instance,onReceived:()=>{window.receivedInstances=(window.receivedInstances||[]).concat(instance)}}));
        }
        createRoot(document.getElementById("root")).render(React.createElement(Harness));`,
      resolveDir: path.resolve(__dirname, ".."),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    define: { "process.env.NODE_ENV": '"development"' },
    plugins: [
      {
        name: "payload-hook-fixture",
        setup(build) {
          build.onResolve(
            { filter: /^(@payloadcms\/ui|next\/link)$/ },
            (args) => ({ path: args.path, namespace: "fixture" }),
          );
          build.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            resolveDir: path.resolve(__dirname, ".."),
            loader: "jsx",
            contents:
              args.path === "next/link"
                ? 'import React from "react"; export default function Link({prefetch,...props}) { return <a {...props}/>; }'
                : `import React, {useState} from "react";
            export const useDocumentInfo = () => ({id:999999});
            export function useField(options = {}) { window.fixtureValidate=options.validate; const [value,update] = useState(Object.prototype.hasOwnProperty.call(window.fixture, "value") ? window.fixture.value : window.fixture.body ?? []); return {value, path:options.path || options.potentiallyStalePath, disabled:false, showError:false, setValue(next) {window.savedField=next; window.savedArticle=next; update(next);}}; }
            export function FieldLabel({htmlFor,label}) { return <label htmlFor={htmlFor}>{label}</label>; }
            export function FieldError() { return null; }`,
          }));
        },
      },
    ],
  });
  await page.route("**/component-fixture.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: result.outputFiles[0].text,
    }),
  );
  await page.route("**/component-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html><head><title>Component verification</title></head><body><div id="root"></div><script src="/component-fixture.js"></script></body></html>',
    }),
  );
  await page.addInitScript((value) => {
    window.fixture = value;
  }, fixture);
  await page.goto("http://localhost:3000/component-fixture");
};
