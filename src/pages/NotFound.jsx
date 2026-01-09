import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="panel stroke rounded-2xl p-8 text-center">
      <div className="text-2xl font-extrabold">Page not found</div>
      <div className="opacity-75 mt-2">Return to overview.</div>
      <Link to="/overview" className="inline-block mt-4 px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 font-semibold">
        Go to Overview
      </Link>
    </div>
  );
}
