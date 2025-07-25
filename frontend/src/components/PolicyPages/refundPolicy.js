import React from "react";

const RefundCancellationPolicy = () => (
  <div className="max-w-4xl mx-auto p-6 text-gray-800">
    <h1 className="text-3xl font-bold mb-4">Refund & Cancellation Policy</h1>

    <h2 className="text-xl font-semibold mt-6 mb-2">1. Cancellation Window</h2>
    <p>
      Bookings can be canceled up to 24 hours before scheduled service. After
      that cutoff, cancellations may not be processed.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-2">2. Refund Eligibility</h2>
    <ul className="list-disc pl-6">
      <li>
        Cancellations within the allowed window are eligible for full refund.
      </li>
      <li>No refunds for services already consumed or completed.</li>
      <li>Partial or no refund for no-shows or late cancellations.</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-2">3. Refund Timeline</h2>
    <p>
      Approved refunds are processed within <strong>7–10 business days</strong>.
      Time to reflect in your account may vary by bank.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-2">
      4. How to Request Refund
    </h2>
    <p>
      Send your booking ID and reason to{" "}
      <a href="mailto:contact@thesandhan.com">contact@thesandhan.com</a>. We
      will verify and act promptly.
    </p>

    <p className="mt-8 text-sm text-gray-500">Last updated on: July 25, 2025</p>
  </div>
);

export default RefundCancellationPolicy;
