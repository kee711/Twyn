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
                  This service ("Service") is committed to protecting users' personal information and complying with Meta Platform Terms, including providing users with a clear method to request data deletion.
                </p>
                <p className="mt-4">
                  Users can request data deletion in the following way:
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. How to Request Data Deletion</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    If you wish to delete your personal data associated with this Service, you can request deletion by contacting us via email.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      **Data deletion request email:** <a href="mailto:twyn.sh@gmail.com" className="text-primary hover:underline">twyn.sh@gmail.com</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    When submitting a request, please include the following information (if applicable):
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Your **App-Scoped User ID (ASID)** or the email address linked to the Service.</li>
                    <li>A brief statement requesting data deletion.</li>
                  </ol>
                  <p className="text-muted-foreground leading-relaxed">
                    All data deletion requests will be processed promptly, and you will be notified once the deletion is completed.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Retention and Deletion Timeline</h2>
                <div className="space-y-3">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Personal data is retained only during the period of Service use.</li>
                    <li>When a user deletes their account, removes the app from Meta platforms, or requests data deletion, the Service will promptly delete all related personal data.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Contact for Data Deletion</h2>
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
