import config from "@payload-config";
import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import "@payloadcms/next/css";
import { importMap } from "./admin/importMap";
import "./custom.css";
import "./operational.css";
import "./workspace-shell.css";

const serverFunction: ServerFunctionClient = async (args) => {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return RootLayout({ children, config, importMap, serverFunction });
}
