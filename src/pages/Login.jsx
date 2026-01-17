import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/overview");
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      navigate("/overview");
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="adapted-bg flex items-center justify-center px-4">
      {/* Dark blobs */}
      <div className="shape one" />
      <div className="shape two" />
      <div className="shape three" />
      <div className="grain" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md panel stroke p-8">
        <h1 className="text-3xl font-semibold text-center mb-2 text-main">
          Welcome back
        </h1>

        <p className="text-center text-muted mb-6">
          Sign in to continue
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1 text-main">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="
                w-full rounded-lg px-4 py-2
                bg-transparent
                border border-[rgb(var(--border-soft))]
                text-main
                placeholder:text-muted
                focus:outline-none
                focus:ring-2 focus:ring-blue-500/40
              "
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-main">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="
                w-full rounded-lg px-4 py-2
                bg-transparent
                border border-[rgb(var(--border-soft))]
                text-main
                placeholder:text-muted
                focus:outline-none
                focus:ring-2 focus:ring-blue-500/40
              "
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="
              w-full rounded-lg py-2.5 font-semibold
              bg-blue-600 text-white
              hover:bg-blue-700
              transition
              focus:outline-none focus:ring-2 focus:ring-blue-500/40
            "
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-500 hover:underline font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
