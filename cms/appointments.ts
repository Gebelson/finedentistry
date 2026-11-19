import { APIError, type CollectionConfig, type Where } from "payload";
import { staffAccess } from "./conversations";
import { services } from "@/lib/site-data";

export const Contacts: CollectionConfig = {
  slug: "contacts",
  admin: {
    group: "Reception",
    useAsTitle: "name",
    defaultColumns: ["name", "email", "phone", "source", "updatedAt"],
    description:
      "Contact details for reception. Do not enter medical histories, symptoms or insurance information.",
  },
  access: {
    read: staffAccess,
    create: staffAccess,
    update: staffAccess,
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email" },
    { name: "phone", type: "text" },
    {
      name: "source",
      type: "select",
      options: ["website", "phone", "referral", "other"],
    },
    {
      name: "preferredContact",
      type: "select",
      options: ["phone", "email"],
      defaultValue: "phone",
    },
  ],
};
export const Appointments: CollectionConfig = {
  slug: "appointments",
  admin: {
    group: "Reception",
    useAsTitle: "contactName",
    defaultColumns: ["contactName", "doctor", "startsAt", "status"],
    description:
      "Internal planning only. Not synchronized with the clinic’s practice-management software; no patient confirmations or reminders are sent.",
  },
  access: {
    read: staffAccess,
    create: staffAccess,
    update: staffAccess,
    delete: ({ req }) => req.user?.role === "admin",
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const next = { ...originalDoc, ...data };
        if (next.status === "scheduled") {
          if (!next.startsAt || !next.endsAt || !next.doctor)
            throw new APIError(
              "Choose a doctor, start and end time before scheduling.",
              400,
            );
          const start = new Date(next.startsAt).getTime(),
            end = new Date(next.endsAt).getTime();
          if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end <= start ||
            end - start > 8 * 3600000
          )
            throw new APIError(
              "Use an end time after the start, with a duration of up to eight hours.",
              400,
            );
          const clauses: Where[] = [
            { doctor: { equals: next.doctor } },
            { status: { equals: "scheduled" } },
            { startsAt: { less_than: next.endsAt } },
            { endsAt: { greater_than: next.startsAt } },
          ];
          if (originalDoc?.id)
            clauses.push({ id: { not_equals: originalDoc.id } });
          const overlaps = await req.payload.count({
            collection: "appointments",
            where: { and: clauses },
            overrideAccess: true,
            req,
          });
          if (overlaps.totalDocs)
            throw new APIError(
              "This doctor already has a scheduled appointment during that time.",
              409,
            );
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "contactName",
      label: "Contact name",
      type: "text",
      required: true,
    },
    { name: "contact", type: "relationship", relationTo: "contacts" },
    {
      name: "treatment",
      type: "select",
      options: services.map((s) => ({ label: s.title, value: s.slug })),
    },
    {
      name: "doctor",
      type: "select",
      options: [
        { label: "Dr. Aileen Trivedi", value: "trivedi" },
        { label: "Dr. Sergio Lascurain", value: "lascurain" },
        { label: "Dr. Amanda Perez", value: "perez" },
      ],
    },
    {
      name: "startsAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "MMM d, yyyy h:mm a",
        },
      },
    },
    {
      name: "endsAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "MMM d, yyyy h:mm a",
        },
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "requested",
      options: [
        { label: "Requested", value: "requested" },
        { label: "Scheduled internally", value: "scheduled" },
        { label: "Completed", value: "completed" },
        { label: "Canceled", value: "canceled" },
      ],
    },
  ],
};
