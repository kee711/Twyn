import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="text-center mb-10">
            <Link href="/" className="inline-block mb-2">
              <img src="/twyn-logo-blk.svg" alt="Twyn" className="w-24 h-10 mx-auto cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-8">
              <div className="text-muted-foreground leading-relaxed">
                <p>
                  Twyn ("The service") values your personal information and is committed to protecting it.<br />
                  This policy outlines how personal information is collected, used, and managed when using the Service.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Personal Information We Collect</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    The Service may collect the following personal information through Google OAuth login:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Profile picture</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service may also collect the following personal information through Threads OAuth integration:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Access and display your Threads information and posts (Required)</li>
                    <li>Create and share posts on your Threads profile (Optional)</li>
                    <li>Manage replies and quotes on Threads posts (Optional)</li>
                    <li>Manage insights of Threads posts (Optional)</li>
                    <li>Read replies on Threads posts (Optional)</li>
                    <li>Read and reply to mentioned public Threads posts (Optional)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Purpose of Collecting Personal Information</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Personal information is collected solely for the following purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>User identification and account management</li>
                    <li>Providing and maintaining the Service</li>
                    <li>Smooth communication with users</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Retention and Use Period</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Personal information will be retained only during the period of Service use.<br />
                    If a user deletes their account or requests withdrawal, the information will be promptly destroyed.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Provision of Personal Information to Third Parties</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    The Service does not share or provide personal information to third parties without the user's prior consent.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Outsourcing of Personal Information Processing</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    The Service does not outsource the processing of personal information to third parties.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. User Rights and How to Exercise Them</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Users may request to view, modify, delete, or suspend the processing of their personal information at any time.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Personal Information Protection Officer</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    For any inquiries or complaints regarding personal information, please contact:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      Email: <a href="mailto:twyn.sh@gmail.com" className="text-primary hover:underline">twyn.sh@gmail.com</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    This Privacy Policy is effective as of July 2025.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. How to Request Data Deletion</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Users may request the deletion of their personal information at any time by contacting:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      Data deletion request email: <a href="mailto:twyn.sh@gmail.com" className="text-primary hover:underline">twyn.sh@gmail.com</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Requests for data deletion will be processed promptly.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
