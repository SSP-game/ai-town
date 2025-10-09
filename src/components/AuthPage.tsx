import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'react-toastify';

interface AuthPageProps {
  onLoginSuccess: (userData: {
    userId: string;
    nickname: string;
    email: string;
    selectedCharacter?: string;
    selectedCompanion?: string;
    profileCompletedAt?: number | null;
  }) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const loginMutation = useMutation(api.users.loginWithValidation);
  const registerMutation = useMutation(api.users.register);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await loginMutation({
          email: formData.email,
          password: formData.password,
        });

        toast.success(`Welcome back, ${result.nickname}!`);
        onLoginSuccess(result);
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }

        const result = await registerMutation({
          email: formData.email,
          password: formData.password,
        });

        toast.success('Account created successfully! Let’s set up your profile.');

        const loginResult = await loginMutation({
          email: formData.email,
          password: formData.password,
        });

        onLoginSuccess(loginResult);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="min-h-screen bg-brown-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold font-display text-brown-100 game-title mb-4">
            AI Town
          </h1>
          <p className="text-brown-300 text-lg">
            Welcome to the virtual town where AI characters live and socialize
          </p>
        </div>

        {/* Auth Form */}
        <div className="box bg-brown-800">
          <div className="bg-brown-700 p-4">
            <h2 className="text-3xl font-display text-brown-100 text-center tracking-wider">
              {isLogin ? 'Login' : 'Sign Up'}
            </h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-brown-200 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:outline-none focus:border-brown-400"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-brown-200 text-sm font-bold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:outline-none focus:border-brown-400"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-brown-200 text-sm font-bold mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 placeholder-brown-400 focus:outline-none focus:border-brown-400"
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full button text-white shadow-solid text-xl cursor-pointer pointer-events-auto mt-6"
              >
                <div className="h-full bg-clay-700 text-center py-3">
                  <span>{loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}</span>
                </div>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-brown-300">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={toggleMode}
                  className="text-brown-100 underline hover:text-white"
                >
                  {isLogin ? 'Sign up here' : 'Login here'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Demo info */}
        <div className="mt-6 text-center text-brown-400 text-sm">
          <p>This is a demo application.</p>
          <p>Your data is stored securely but may be reset during development.</p>
        </div>
      </div>
    </div>
  );
}
