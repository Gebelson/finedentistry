import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from "react";

/** Keeps authored line breaks and emphasis; no text splitting or DOM rewriting. */
export function LineReveal({ children }: { children: ReactNode }) {
  const lines: ReactNode[][] = [[]];
  function collect(nodes: ReactNode) {
    Children.forEach(nodes, (node) => {
      if (
        isValidElement<{ children?: ReactNode }>(node) &&
        node.type === Fragment
      )
        collect(node.props.children);
      else if (isValidElement(node) && node.type === "br") lines.push([]);
      else
        lines[lines.length - 1].push(
          isValidElement(node)
            ? cloneElement(node, {
                key: `part-${lines[lines.length - 1].length}`,
              })
            : node,
        );
    });
  }
  collect(children);
  return (
    <>
      {lines.map((line, index) => (
        <span className="reveal-line" key={index}>
          <span
            className="reveal-line-content"
            style={{ "--line-index": index } as CSSProperties}
          >
            {index > 0 ? " " : null}
            {line}
          </span>
        </span>
      ))}
    </>
  );
}
