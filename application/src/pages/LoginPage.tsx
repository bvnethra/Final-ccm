// application/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Field,
  FieldLabel,
} from '../components/ui/UIPrimitives';
import { LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or user profile not found.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="size-12 rounded-[4px] bg-[#0274BB] flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md">
            C
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Nethra CCM</h1>
          <p className="text-sm text-[#6B7280]">
            Calibration Operations & Metrology Commercial Platform
          </p>
        </div>

        {error && (
          <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access calibration bench</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Email Address</FieldLabel>
                <Input
                  type="email"
                  placeholder="operator@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 p-6 pt-0">
              <Button variant="primary" type="submit" className="w-full" disabled={isSubmitting}>
                <LogIn className="size-4" />
                {isSubmitting ? 'Authenticating...' : 'Sign In to Operations'}
              </Button>

              <div className="w-full text-xs text-[#6B7280] bg-[#F9FAFB] p-3 rounded-[4px] border border-[#E5E7EB] space-y-1 mt-2">
                <div className="font-semibold text-[#374151] flex items-center justify-between">
                  <span>Configured Credentials:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(import.meta.env.VITE_TEST_ADMIN_EMAIL || 'admin@nethra.com');
                      setPassword(import.meta.env.VITE_TEST_USER_PASSWORD || 'Password@123');
                    }}
                    className="text-[#0274BB] hover:underline font-medium cursor-pointer"
                  >
                    Click to Auto-fill
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Admin:</span>
                  <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] text-[#111827]">
                    {import.meta.env.VITE_TEST_ADMIN_EMAIL || 'admin@nethra.com'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Operator:</span>
                  <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] text-[#111827]">
                    {import.meta.env.VITE_TEST_USER_EMAIL || 'user@nethra.com'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Password:</span>
                  <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] text-[#111827]">
                    {import.meta.env.VITE_TEST_USER_PASSWORD || 'Password@123'}
                  </code>
                </div>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
