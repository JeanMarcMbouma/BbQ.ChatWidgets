import {
  ButtonWidget,
  CardWidget,
  FormWidget,
  type ChatWidget,
} from "@bbq-chat/widgets";

export interface PlaygroundExample {
  id: string;
  title: string;
  category: string;
  prompt: string;
  reply: string;
  widgets: ChatWidget[];
  result: (action: string, payload: Record<string, unknown>) => string;
}

// Deterministic fixtures use the same public models and event handlers as live chat.
export const EXAMPLES: PlaygroundExample[] = [
  {
    id: "booking",
    title: "Book a visit",
    category: "Scheduling",
    prompt: "I’d like to book a product walkthrough.",
    reply: "Let’s find a time that works for you. Share a few details below.",
    widgets: [
      new FormWidget(
        "Book a walkthrough",
        "book_visit",
        "Your walkthrough",
        [
          { name: "name", label: "Your name", type: "text", required: true },
          {
            name: "email",
            label: "Email address",
            type: "email",
            required: true,
          },
          {
            name: "day",
            label: "Preferred day",
            type: "dropdown",
            required: true,
            options: ["Monday", "Wednesday", "Friday"],
          },
        ],
        [{ label: "Request a walkthrough", type: "submit" }],
      ),
    ],
    result: (_action, payload) =>
      `Thanks, ${payload['name']}. Your demo request for ${payload['day']} is ready. In your app, this action would go to your booking service.`,
  },
  {
    id: "support",
    title: "Resolve a problem",
    category: "Customer support",
    prompt: "My delivery hasn’t arrived. What can I do?",
    reply:
      "Choose the next step. Your customer can act without leaving the conversation.",
    widgets: [
      new CardWidget(
        "Check delivery",
        "track_delivery",
        "Find your delivery",
        "Connect this action to your order tracking service.",
      ),
      new ButtonWidget("Talk to a person", "contact_support"),
    ],
    result: (action) =>
      action === "track_delivery"
        ? "Tracking action received. Your app can now look up the order and return a delivery status widget."
        : "Support action received. Your app can hand the conversation to your support team.",
  },
  {
    id: "approval",
    title: "Make a decision",
    category: "Internal tools",
    prompt: "Show me the purchase request awaiting my approval.",
    reply: "Here’s a sample request. Keep the decision next to the context.",
    widgets: [
      new CardWidget(
        "Approve request",
        "approve_request",
        "Workspace equipment · £240",
        "Sample request: two monitors for the design team.",
      ),
      new ButtonWidget("Ask for more details", "request_details"),
    ],
    result: (action) =>
      action === "approve_request"
        ? "Approval action received. Your server must check permissions and validate the request before changing its status."
        : "Follow-up action received. Your app can ask the requester for the missing details.",
  },
];

