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
                <p className="font-bold">Effective as of July 2025</p>
                <p><strong>App Name</strong>: <strong>Twyn</strong></p>
                <p><strong>Developer Name</strong>: <strong>Twyn Team</strong></p>
                <p><strong>Privacy Officer</strong>: <strong>Harry Ki</strong></p>
                <p><strong>Website</strong>: https://www.twyn.sh</p>
                <p><strong>Contact</strong>: harryki@twyn.sh</p>
                <br />
                <p>
                  Twyn ("the Service", "we", "our", or "us") is a social media content assistant tool for Meta Threads, operated by Twyn Team. We are committed to protecting your personal data and ensuring transparency about how we collect and use it. This Privacy Policy describes what information we collect, how we use it, and how we safeguard it in accordance with applicable laws and Meta's platform policies.
                </p>
                <hr className="my-6 border-muted-foreground/20" />
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    We collect personal and non-personal data to provide and improve our services:
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">a. Through Google OAuth:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Profile picture</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">b. Through Meta Threads API (OAuth Integration):</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect and store the following permissions and associated data in our secured database:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>threads_basic</strong>: Access and display your Threads profile information (e.g., profile image, name, ID) and posts within Twyn (visible only to you).</li>
                    <li><strong>threads_content_publish</strong>: Create and schedule/publish Threads posts on your behalf.</li>
                    <li><strong>threads_manage_replies</strong>: Manage who can reply to your posts, and control reply visibility or write replies on your behalf.</li>
                    <li><strong>threads_manage_insights</strong>: Access analytics for your Threads profile and individual posts to display performance metrics.</li>
                    <li><strong>threads_read_replies</strong>: Read replies to your Threads posts for engagement tracking.</li>
                    <li><strong>threads_manage_mentions</strong>: Access content where you're mentioned and respond to mentions.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    All Threads-related data is accessed solely to support Twyn's core functionalities, and only with your explicit consent.
                  </p>
                  <hr className="my-6 border-muted-foreground/20" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Purpose of Data Collection and Use</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    We use the information collected to provide the following services:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Authenticate and manage your account</li>
                    <li>Display and manage your Threads content within Twyn</li>
                    <li>Schedule and publish posts on your behalf</li>
                    <li>Provide analytics and performance metrics about your Threads activity</li>
                    <li>Manage and optimize engagement (e.g., replies, mentions)</li>
                    <li>Improve overall service performance and user experience</li>
                    <li>Process payments and orders (if applicable)</li>
                    <li>Communicate with users about updates and service-related notices</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not use Threads data for any purpose outside of what is described here, and we adhere strictly to Meta's platform policies and GDPR requirements.
                  </p>
                  <hr className="my-6 border-muted-foreground/20" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Legal Basis for Processing (GDPR)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    We process your data under the following lawful bases:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Consent</strong>: You have given clear consent for us to process your personal data.</li>
                    <li><strong>Contract</strong>: Processing is necessary to deliver the services outlined in our Terms of Service.</li>
                    <li><strong>Legitimate Interest</strong>: For improving our service, providing analytics, and responding to user inquiries.</li>
                  </ul>
                  <hr className="my-6 border-muted-foreground/20" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Retention and Deletion of Personal Information</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Your personal data is stored only for as long as you use the service. Upon account deletion or data deletion request, your information will be permanently and promptly removed from our systems.
                  </p>
                  <hr className="my-6 border-muted-foreground/20" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Third-Party Access</h2>
                <div className="space-y-3">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>No third-party sharing</strong>: We do not share your data with third parties unless legally required or explicitly consented by you.</li>
                    <li><strong>No outsourcing</strong>: We do not outsource data processing to any external vendors.</li>
                  </ul>
                  <hr className="my-6 border-muted-foreground/20" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Request access to your personal data</li>
                    <li>Modify or update your information</li>
                    <li>Request deletion of your data</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    For any of the above, please contact us at harryki@twyn.sh.
                  </p>
                  <hr className="my-6 border-muted-foreground/20" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Data Deletion Request</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    To request the deletion of your personal data, send an email to:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      📧 <a href="mailto:harryki@twyn.sh" className="text-primary hover:underline">harryki@twyn.sh</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Your request will be verified and processed promptly.
                  </p>
                  <hr className="my-6 border-muted-foreground/20" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    For all inquiries related to privacy, personal data, or this policy, contact:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      Twyn Privacy Officer<br />
                      📧 <a href="mailto:harryki@twyn.sh" className="text-primary hover:underline">harryki@twyn.sh</a><br />
                      🌐 <a href="https://www.twyn.sh" className="text-primary hover:underline">https://www.twyn.sh</a>
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
