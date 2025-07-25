import React from "react";

const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto p-6 text-gray-800">
    <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
    <p>
      Welcome to The Sandhan! We value your privacy and explain how we collect,
      use, and safeguard your data.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-2">1. Data We Collect</h2>
    <ul className="list-disc pl-6">
      <li>Contact details (e.g. name, email, phone)</li>
      <li>Usage analytics & cookies</li>
      <li>Payment-related info (via Razorpay)</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-2">2. Usage of Data</h2>
    <p>We use your data to:</p>
    <ul className="list-disc pl-6">
      <li>Process bookings and payments</li>
      <li>Respond to customer support requests</li>
      <li>Analyze usage to improve our site</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Sharing</h2>
    <p>
      We don’t sell your personal data. Third‑party partners (e.g. Razorpay)
      only receive what's essential to process payments or support operations.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-2">4. Cookies</h2>
    <p>
      We use cookies for analytics and essential functionality. You can manage
      cookies through your browser settings.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Rights</h2>
    <p>Contact us anytime to access, correct, or delete your data.</p>

    <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact</h2>
    <p>
      Questions? Email us at{" "}
      <a href="mailto:contact@thesandhan.com">contact@thesandhan.com</a>.
    </p>

    <p className="mt-8 text-sm text-gray-500">Last updated on: July 25, 2025</p>
  </div>
);

export default PrivacyPolicy;
