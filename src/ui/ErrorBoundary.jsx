import { Component } from "react";

// Catches render-time crashes in the children and shows a readable message
// instead of an empty white screen. The fallback explains the error and
// gives a recovery button.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep this in console only — don't pop a UI notification.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info?.componentStack || "");
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="panel stroke rounded-2xl p-6 max-w-md mx-auto mt-12 text-center">
        <div className="font-bold text-lg mb-1">Something broke on this page</div>
        <div className="text-xs opacity-70 mt-2 font-mono break-words text-left bg-black/10 dark:bg-white/5 rounded-lg p-2 max-h-32 overflow-auto">
          {String(this.state.error?.message || this.state.error)}
        </div>
        <div className="flex gap-2 justify-center mt-4">
          <button
            onClick={() => { this.reset(); window.location.reload(); }}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm font-semibold"
          >
            Reload page
          </button>
          <button
            onClick={() => { this.reset(); window.location.href = "/overview"; }}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm font-semibold"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}
