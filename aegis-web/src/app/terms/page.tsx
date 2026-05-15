import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Use | Aegis Triage OS",
  description: "Terms governing use of the Aegis Triage OS platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-400" aria-hidden />
          <h1 className="text-lg font-bold">Terms of Use</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6 text-sm text-slate-400 leading-relaxed">
        <p>
          By using Aegis Triage OS, you agree to these terms. If you do not agree, do not use the
          service.
        </p>

        <section>
          <h2 className="text-base font-semibold text-slate-100 mb-2">Not medical advice</h2>
          <p>
            Aegis provides informational triage guidance only. It does not diagnose, treat, or
            replace evaluation by a qualified healthcare professional. In an emergency, call your
            local emergency number immediately.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100 mb-2">Patient portal</h2>
          <p>
            Patients must provide valid consent before symptom data is processed. You are
            responsible for the accuracy of information you submit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100 mb-2">Clinician portal</h2>
          <p>
            Clinical accounts are provisioned by authorised administrators. You must safeguard
            credentials and use patient data only for legitimate care coordination.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-100 mb-2">Availability</h2>
          <p>
            The service is provided as-is. We do not guarantee uninterrupted access, particularly
            in low-connectivity environments.
          </p>
        </section>

        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 text-sm text-indigo-400 hover:text-indigo-300 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to home
        </Link>
      </main>
    </div>
  );
}
