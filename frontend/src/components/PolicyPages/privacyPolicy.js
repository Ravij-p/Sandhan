import React from "react";

const PrivacyPolicy = () => (
  <div className="p-60 max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
    <p>Effective Date: July 26, 2025</p>

    <h2 className="text-xl font-semibold mt-6">1. Information Collection</h2>
    <p>
      We collect personal details like name, email, phone number during signup
      and payments.
    </p>

    <h2 className="text-xl font-semibold mt-4">2. Usage of Data</h2>
    <p>
      We use collected data strictly to provide services and improve the user
      experience.
    </p>

    <h2 className="text-xl font-semibold mt-4">3. Data Retention</h2>
    <p>
      User data is retained for a minimum of <strong>3 years</strong> or as
      required by law.
    </p>

    <h2 className="text-xl font-semibold mt-4">4. Third-Party Sharing</h2>
    <p>
      Data is not shared with third parties except Razorpay for payment
      processing.
    </p>

    <h2 className="text-xl font-semibold mt-4">5. Contact</h2>
    <p>For concerns, contact us at support@example.com.</p>
  </div>
);

export default PrivacyPolicy;
