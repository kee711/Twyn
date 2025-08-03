import Link from 'next/link';
import { generatePageMetadata } from '@/lib/generatePageMetadata';

export async function generateMetadata() {
  return await generatePageMetadata('privacy');
}

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
                <p className="font-bold text-xl">Effective as of July 2025</p>
                <p><strong>App Name</strong>: <strong>Twyn</strong></p>
                <p><strong>Developer Name</strong>: <strong>Twyn Team (Privacy Management: Minsung Kee)</strong></p>
                <p><strong>Website URL</strong>: www.twyn.sh</p>
                <p><strong>Contact Email</strong>: harryki@twyn.sh</p>
                <p>
                  Twyn ("the Service") values your personal information and is committed to protecting it.
                </p>
                <p>
                  This Privacy Policy describes how Twyn collects, uses, and manages your personal information when you use our website or mobile application.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Personal Information We Collect</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    When you use Twyn, we may collect the following information:
                  </p>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">a. Through Google OAuth:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Profile picture</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">b. Through Meta Threads OAuth:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Access and display your Threads information and posts (<strong>Required</strong>)</li>
                    <li>Create and share posts on your Threads profile (<strong>Optional</strong>)</li>
                    <li>Manage replies and quotes on Threads posts (<strong>Optional</strong>)</li>
                    <li>Manage insights of Threads posts (<strong>Optional</strong>)</li>
                    <li>Read replies on Threads posts (<strong>Optional</strong>)</li>
                    <li>Read and reply to mentioned public Threads posts (<strong>Optional</strong>)</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    These permissions are requested only to support content creation, scheduling, and publishing functionality within the app.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Purpose of Collecting Personal Information</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    We collect your personal information solely for the following purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>To authenticate and identify users</li>
                    <li>To provide and maintain personalized content creation services</li>
                    <li>To enable content scheduling and posting on Threads</li>
                    <li>To communicate with users and provide customer support</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Retention and Use Period</h2>
                <div className="space-y-3">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Personal information is retained only while the user is actively using the Service.</li>
                    <li>When a user deletes their account or requests account deletion, their personal data is permanently deleted without delay.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Provision of Personal Information to Third Parties</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    We do not share your personal information with third parties without your prior consent.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Outsourcing of Personal Information Processing</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    We do not outsource personal information processing to any external service providers.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. User Rights and How to Exercise Them</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Users can request access to, modification of, or deletion of their personal data at any time by contacting the email below.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Personal Information Protection Officer</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    For all inquiries regarding personal information, please contact:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      📧 Email: <a href="mailto:harryki@twyn.sh" className="text-primary hover:underline">harryki@twyn.sh</a>
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. How to Request Data Deletion</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    To request deletion of your personal data, email us at:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      📧 Email: <a href="mailto:harryki@twyn.sh" className="text-primary hover:underline">harryki@twyn.sh</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    All deletion requests will be handled promptly.
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
