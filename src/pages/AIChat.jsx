import ChatPanel from "../ui/ChatPanel.jsx";
import { useLang } from "../i18n/LangContext.jsx";

export default function AIChat() {
  const { t } = useLang();
  return (
    <div className="space-y-5">
      <div>
        <div className="text-3xl font-extrabold tracking-tight">{t("ai_title")}</div>
        <div className="opacity-75 mt-1"></div>
      </div>
      <ChatPanel />
    </div>
  );
}
