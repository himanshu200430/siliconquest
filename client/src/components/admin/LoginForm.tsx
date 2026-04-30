import { FormEvent } from "react";

interface LoginFormProps {
  username: string;
  password: string;
  error: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export const LoginForm = ({
  username,
  password,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-200 mb-1"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   text-white placeholder-gray-400"
          placeholder="Enter username"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-200 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   text-white placeholder-gray-400"
          placeholder="Enter password"
          required
        />
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-md p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600
                 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold
                 px-6 py-3 rounded-md transition-colors focus:outline-none focus:ring-2
                 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900
                 shadow-lg shadow-indigo-500/20"
      >
        Login
      </button>
    </form>
  );
};
