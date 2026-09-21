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
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
