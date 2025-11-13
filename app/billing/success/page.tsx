import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Payment Successful</h1>
      <p className="text-muted-foreground mb-6">
        Thanks for upgrading! Your plan will unlock in a moment.
      </p>
      <div className="space-x-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-black text-white px-4 py-2"
        >
          Go to app
        </Link>
        <Link
          href="/billing"
          className="inline-flex items-center rounded-md border px-4 py-2"
        >
          Manage billing
        </Link>
      </div>
    </div>
  );
}

