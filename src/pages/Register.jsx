import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

async function handleSubmit(e) {
  e.preventDefault();
  setError("");

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);  // SAVE THE TOKEN
      navigate("/overview");                       // GO TO DASHBOARD
    } else {
      setError(data.error || "Registration failed");
    }
  } catch (err) {
    setError("Network error: " + err.message);
  }
}



  return (
    <div
      className="
        adapted-bg flex items-center justify-center px-4
        bg-[rgb(255,249,243)]
        dark:bg-[rgb(14,18,35)]
      "
    >
      {/* SAME SHAPES AS LOGIN */}
      <div className="shape one" />
      <div className="shape two" />
      <div className="shape three" />
      <div className="grain" />

      {/* SAME CARD */}
      <div className="relative z-10 w-full max-w-md panel stroke p-8">
        <h1 className="text-3xl font-semibold text-center mb-2 text-main">
          Create account
        </h1>

        <p className="text-center text-muted mb-6">
          Start your journey with us
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                text-main placeholder:text-muted
                focus:outline-none
                focus:ring-2 focus:ring-violet-500/40
              "
            />
          </div>

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
                text-main placeholder:text-muted
                focus:outline-none
                focus:ring-2 focus:ring-violet-500/40
              "
            />
          </div>

          <button
            type="submit"
            className="
              w-full rounded-lg py-2.5 font-semibold
              bg-violet-600 text-white
              hover:bg-violet-700
              transition
              focus:outline-none focus:ring-2 focus:ring-violet-500/40
            "
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
