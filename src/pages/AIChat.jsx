import ChatPanel from "../ui/ChatPanel.jsx";

export default function AIChat() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-3xl font-extrabold tracking-tight">AI Helper</div>
        <div className="opacity-75 mt-1">Ask parent-focused questions and get guidance (Use Case 05).</div>
      </div>
      <ChatPanel />
    </div>
  );
}
