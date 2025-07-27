import Link from 'next/link';

export default function DataDeletionPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block mb-8">
              <img src="/twyn-logo-blk.svg" alt="Twyn" className="w-24 h-10 mx-auto cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-4">Data Deletion Policy</h1>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-8">
              <div className="text-muted-foreground leading-relaxed">
                <p>
                  This service ("Service") is committed to protecting users' personal information and complying with Meta Platform Terms, including providing users with a method to request data deletion.<br />
                  This policy explains how users can request the deletion of their personal data and how such requests are processed.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Data Deletion Request via Meta (Facebook/Threads)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    When a user deletes the app or removes access to data (e.g., email address) through **Facebook or Threads account settings**, Meta will send a **signed POST request** to the Service containing the **App-Scoped User ID (ASID)**.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service is required to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Start deleting all data related to the identified user as soon as the request is received.</li>
                    <li>Provide a **status URL** and a **confirmation code** where the user can check the status of their deletion request.</li>
                    <li>Ensure the response is in JSON format as follows:</li>
                  </ul>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <pre className="text-sm text-muted-foreground">
{`{
  "url": "https://www.<your_website>.com/deletion?id=<confirmation_code>",
  "confirmation_code": "<confirmation_code>"
}`}
                    </pre>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    The confirmation page must include a human-readable explanation of the request status and, if applicable, valid reasons for rejecting the deletion request (as required by local regulations and Meta policies).
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Data Deletion Request via Email</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Users may also request data deletion directly by email at any time.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      **Data deletion request email:** <a href="mailto:twyn.sh@gmail.com" className="text-primary hover:underline">twyn.sh@gmail.com</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    All data deletion requests will be processed promptly, and the user will be notified once the deletion is completed.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Retention and Deletion Timeline</h2>
                <div className="space-y-3">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Personal data is retained only during the period of Service use.</li>
                    <li>When a user deletes their account, removes the app from Meta platforms, or requests data deletion, the Service will promptly delete all related personal data.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Technical Implementation of Data Deletion Callback</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    The Service uses a secure HTTPS endpoint registered in the app dashboard as the **Data Deletion Callback URL**.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    When Meta triggers the callback:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                    <li>The Service verifies the **signed request** using the app secret.</li>
                    <li>The Service identifies the user based on the **App-Scoped User ID (ASID)**.</li>
                    <li>The Service deletes all stored data related to that user.</li>
                    <li>The Service returns a JSON response with the status URL and confirmation code.</li>
                  </ol>
                  <p className="text-muted-foreground leading-relaxed">
                    Example callback JSON response:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <pre className="text-sm text-muted-foreground">
{`{
  "url": "https://www.<your_website>.com/deletion?id=abc123",
  "confirmation_code": "abc123"
}`}
                    </pre>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. User Rights</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Users may request to view, modify, or delete their personal data at any time, either through Meta platforms or directly by contacting the Service via email.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Contact for Data Deletion</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    For any inquiries or complaints related to data deletion:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      **Email:** <a href="mailto:twyn.sh@gmail.com" className="text-primary hover:underline">twyn.sh@gmail.com</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    This Data Deletion Policy is effective as of **July 2025**.
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