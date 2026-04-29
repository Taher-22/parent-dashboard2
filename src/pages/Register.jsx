import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-500"];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const API_URL = "https://parent-dashboard2-production.up.railway.app";
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("token-changed"));
        navigate("/overview");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="
                  w-full rounded-lg px-4 py-2 pr-10
                  bg-transparent
                  border border-[rgb(var(--border-soft))]
                  text-main placeholder:text-muted
                  focus:outline-none
                  focus:ring-2 focus:ring-violet-500/40
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        level <= passwordStrength ? strengthColors[passwordStrength - 1] : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  passwordStrength <= 1 ? "text-red-500" :
                  passwordStrength <= 2 ? "text-orange-500" :
                  passwordStrength <= 3 ? "text-yellow-500" : "text-green-500"
                }`}>
                  {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ""}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full rounded-lg py-2.5 font-semibold
              bg-violet-600 text-white
              hover:bg-violet-700
              transition
              focus:outline-none focus:ring-2 focus:ring-violet-500/40
              disabled:opacity-70 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
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
