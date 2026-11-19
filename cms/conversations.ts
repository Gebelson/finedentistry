import type { Access, CollectionConfig, GlobalConfig } from "payload";
export const staffAccess: Access = ({ req }) =>
  ["admin", "reception"].includes(req.user?.role || "");
export const Conversations: CollectionConfig = {
  slug: "conversations",
  admin: {
    group: "Reception",
    useAsTitle: "reference",
    defaultColumns: ["reference", "status", "controller", "updatedAt"],
  },
  access: {
    create: () => false,
    read: staffAccess,
    update: staffAccess,
    delete: ({ req }) => req.user?.role === "admin",
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        await req.payload.delete({
          collection: "messages",
          where: { conversation: { equals: id } },
          overrideAccess: true,
          req,
        });
      },
    ],
  },
  fields: [
    {
      name: "reference",
      type: "text",
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "waiting",
      options: ["waiting", "open", "resolved"],
      admin: { readOnly: true },
    },
    {
      name: "controller",
      type: "select",
      defaultValue: "reception",
      options: ["assistant", "reception"],
      admin: { readOnly: true },
    },
    { name: "assignedTo", type: "relationship", relationTo: "users" },
    {
      name: "visitorTokenHash",
      type: "text",
      required: true,
      hidden: true,
      access: { read: () => false },
    },
    {
      name: "inbox",
      type: "ui",
      admin: { components: { Field: "/conversation-tools#ConversationTools" } },
    },
  ],
};
export const Messages: CollectionConfig = {
  slug: "messages",
  admin: { hidden: true },
  access: {
    read: staffAccess,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "conversation",
      type: "relationship",
      relationTo: "conversations",
      required: true,
      index: true,
    },
    {
      name: "sender",
      type: "select",
      options: ["visitor", "assistant", "reception"],
      required: true,
    },
    { name: "text", type: "textarea", required: true, maxLength: 4000 },
  ],
};
export const ChatSettings: GlobalConfig = {
  slug: "chat-settings",
  label: "Chat & assistant settings",
  admin: {
    group: "Reception",
    description:
      "The built-in assistant answers from the practice FAQ. Generative AI, SMS and external inboxes are not connected.",
  },
  access: {
    read: staffAccess,
    update: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      defaultValue: false,
      label: "Show website chat",
    },
    {
      name: "mode",
      type: "select",
      required: true,
      defaultValue: "reception",
      options: [
        { label: "Reception only", value: "reception" },
        { label: "FAQ assistant only", value: "assistant" },
        { label: "FAQ assistant + reception handoff", value: "hybrid" },
      ],
    },
    {
      name: "welcome",
      type: "textarea",
      defaultValue:
        "Welcome to Fine Dentistry. How can we help with your visit?",
    },
  ],
};
