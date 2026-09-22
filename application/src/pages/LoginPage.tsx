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
import { LogIn, Sparkles, Check, ArrowRight } from 'lucide-react';

interface DemoAccount {
  role: string;
  name: string;
  email: string;
  password: string;
  badge: string;
  badgeClass: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Admin / Back Office',
    name: 'Back Office Admin',
    email: 'backoffice@nethra.com',
    password: 'BackOffice@2026!',
    badge: 'Admin',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Masters, Clients, Items Catalog, Quotations, Invoices',
  },
  {
    role: 'Lab Approver',
    name: 'Senior Lab Approver',
    email: 'labapprover@nethra.com',
    password: 'LabApprover@2026!',
    badge: 'Approver',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Calibration Approval, QA Verification, Certificates',
  },
  {
    role: 'Lab Entry Person',
    name: 'Lab Entry Technician',
    email: 'labentry@nethra.com',
    password: 'LabEntry@2026!',
    badge: 'Technician',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Calibration Execution, Readings & Observations',
  },
  {
    role: 'Collection Agent',
    name: 'Field Collection Agent',
    email: 'collectionagent@nethra.com',
    password: 'Collection@2026!',
    badge: 'Field Agent',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Item Pickups, Inward Intake & Return Tracking',
  },
  {
    role: 'Super Admin',
    name: 'Nethra Super Admin',
    email: 'superadmin@nethra.com',
    password: 'SuperAdmin@2026!',
    badge: 'Platform Super',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Multi-Tenant Governance & User Role Management',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
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

  const handleSelectAccount = (acc: DemoAccount, autoSubmit = false) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedEmail(acc.email);
    setError(null);

    if (autoSubmit) {
      setIsSubmitting(true);
      login(acc.email, acc.password)
        .then(() => navigate('/'))
        .catch((err: any) => {
          setError(err.message || 'Invalid credentials or user profile not found.');
          setIsSubmitting(false);
        });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="size-12 rounded-[6px] bg-[#0274BB] flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md">
            C
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Nethra CCM</h1>
          <p className="text-sm text-[#64748B]">
            Calibration Operations & Metrology Commercial Platform
          </p>
        </div>

        {error && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Main Sign-In Card */}
        <Card className="border border-[#E2E8F0] shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#0F172A]">Sign In</CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Enter your credentials to access operations
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel className="text-xs font-semibold text-[#334155]">Email Address</FieldLabel>
                <Input
                  type="email"
                  placeholder="operator@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedEmail(null);
                  }}
                  required
                />
              </Field>

              <Field>
                <FieldLabel className="text-xs font-semibold text-[#334155]">Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedEmail(null);
                  }}
                  required
                />
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
        </Card>

        {/* Demo Accounts Panel */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#0274BB]" />
              <h2 className="text-sm font-bold text-[#0F172A]">Demo Access Accounts</h2>
            </div>
            <span className="text-[11px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full font-medium">
              1-Click Sign In Available
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Select any role below to instantly auto-fill credentials or log in directly:
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = selectedEmail === acc.email;
              return (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc, false)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#0274BB] bg-[#F0F9FF] shadow-xs'
                      : 'border-[#E2E8F0] bg-[#FAFAFA] hover:bg-white hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${acc.badgeClass}`}>
                        {acc.badge}
                      </span>
                      <span className="text-xs font-bold text-[#0F172A]">{acc.role}</span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] text-[#0274BB] font-semibold">
                          <Check className="size-3" /> Selected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] font-mono text-[11px] text-[#0F172A]">
                        {acc.email}
                      </code>
                      <span className="text-slate-300">•</span>
                      <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] font-mono text-[11px] text-[#64748B]">
                        {acc.password}
                      </code>
                    </div>
                    <p className="text-[11px] text-[#64748B]">{acc.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAccount(acc, false);
                      }}
                      className="text-xs py-1 px-2.5 h-8 border-[#CBD5E1] text-[#334155] hover:bg-white cursor-pointer"
                    >
                      Auto-fill
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAccount(acc, true);
                      }}
                      disabled={isSubmitting}
                      className="text-xs py-1 px-2.5 h-8 bg-[#0274BB] hover:bg-[#005a92] text-white flex items-center gap-1 cursor-pointer"
                    >
                      Login <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
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
