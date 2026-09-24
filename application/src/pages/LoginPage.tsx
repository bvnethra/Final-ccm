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
import { LogIn, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err.message || 'Invalid credentials or account profile not configured.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="size-12 rounded-[8px] bg-[#0274BB] flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md">
            C
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Nethra CCM</h1>
          <p className="text-sm text-[#64748B]">
            Calibration Operations & Metrology Commercial Platform
          </p>
        </div>

        {error && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-lg text-sm font-medium flex items-start gap-2 shadow-xs">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Main Sign-In Card */}
        <Card className="border border-[#E2E8F0] shadow-sm bg-white rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Lock className="size-4 text-[#0274BB]" /> Sign In
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Enter your organizational credentials to access calibration operations
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel className="text-xs font-semibold text-[#334155]">Email Address</FieldLabel>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel className="text-xs font-semibold text-[#334155]">Password</FieldLabel>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 p-6 pt-2">
              <Button
                variant="primary"
                type="submit"
                className="w-full bg-[#0274BB] hover:bg-[#005a92] text-white py-2.5 font-semibold text-sm shadow-sm cursor-pointer"
                disabled={isSubmitting}
              >
                <LogIn className="size-4 mr-2 inline" />
                {isSubmitting ? 'Authenticating...' : 'Sign In to Operations'}
              </Button>
            </CardFooter>
          </form>

          {/* Quick Role Fill Buttons */}
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-lg space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
              Quick Role Sign-in (Demo Accounts)
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('labentry@nethra.com');
                  setPassword('LabEntry@2026!');
                  setError(null);
                }}
                className="text-left p-2 rounded bg-white hover:bg-[#F0F9FF] border border-[#E2E8F0] hover:border-[#0274BB] transition cursor-pointer"
              >
                <div className="font-semibold text-[#0F172A]">Lab Entry Person</div>
                <div className="text-[10px] text-[#64748B] truncate">labentry@nethra.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('labapprover@nethra.com');
                  setPassword('LabApprover@2026!');
                  setError(null);
                }}
                className="text-left p-2 rounded bg-white hover:bg-[#F0F9FF] border border-[#E2E8F0] hover:border-[#0274BB] transition cursor-pointer"
              >
                <div className="font-semibold text-[#0F172A]">Lab Approver</div>
                <div className="text-[10px] text-[#64748B] truncate">labapprover@nethra.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('backoffice@nethra.com');
                  setPassword('BackOffice@2026!');
                  setError(null);
                }}
                className="text-left p-2 rounded bg-white hover:bg-[#F0F9FF] border border-[#E2E8F0] hover:border-[#0274BB] transition cursor-pointer"
              >
                <div className="font-semibold text-[#0F172A]">Back Office Admin</div>
                <div className="text-[10px] text-[#64748B] truncate">backoffice@nethra.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@nethra.com');
                  setPassword('SuperAdmin@2026!');
                  setError(null);
                }}
                className="text-left p-2 rounded bg-white hover:bg-[#F0F9FF] border border-[#E2E8F0] hover:border-[#0274BB] transition cursor-pointer"
              >
                <div className="font-semibold text-[#0274BB]">Super Admin</div>
                <div className="text-[10px] text-[#64748B] truncate">superadmin@nethra.com</div>
              </button>
            </div>
          </div>
        </Card>

        {/* Security & Access Info */}
        <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#64748B] flex items-center gap-2 shadow-2xs">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>Role-based access is dynamically controlled by your organization administrator.</span>
        </div>

        {/* Footer */}
        <p className="text-center text-[#94A3B8] text-xs">
          © {new Date().getFullYear()} Nethra Metrology Services Ltd — Multi-Tenant Operational Platform
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
