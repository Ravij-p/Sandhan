import React from "react";

const ShippingPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md mt-8 rounded-md">
      <h1 className="text-3xl font-bold mb-4 border-b pb-2 text-blue-600">
        Shipping Policy
      </h1>

      <p className="mb-4">
        Thank you for visiting and shopping at <strong>YourWebsite.com</strong>.
        Below are the terms and conditions that constitute our Shipping Policy.
      </p>

      <h2 className="text-xl font-semibold mt-6 text-gray-700">
        Domestic Shipping Policy
      </h2>

      <h3 className="font-medium mt-4">Shipment Processing Time</h3>
      <p className="mb-4">
        All orders are processed within 1–2 business days. Orders are not
        shipped or delivered on weekends or holidays. Delays may occur during
        high order volumes or unforeseen circumstances.
      </p>

      <h3 className="font-medium">Shipping Rates & Delivery Estimates</h3>
      <p className="mb-4">
        Shipping charges will be calculated and shown during checkout based on
        location and shipping method selected.
      </p>

      <h3 className="font-medium">Shipment Confirmation & Order Tracking</h3>
      <p className="mb-4">
        You will receive a shipment confirmation email with tracking number(s)
        once your order has shipped.
      </p>

      <h3 className="font-medium">Customs, Duties and Taxes</h3>
      <p className="mb-4">
        YourWebsite.com is not responsible for customs or taxes applied to your
        international orders. All charges during or after shipping are the
        customer’s responsibility.
      </p>

      <h2 className="text-xl font-semibold mt-6 text-gray-700">
        International Shipping Policy
      </h2>
      <p className="mb-4">
        We offer international shipping to many countries. Shipping fees and
        delivery time will vary by destination.
      </p>

      <h2 className="text-xl font-semibold mt-6 text-gray-700">Damages</h2>
      <p className="mb-4">
        YourWebsite.com is not liable for any products damaged or lost during
        shipping. If you received your order damaged, please contact the
        shipment carrier or our support team directly to file a claim.
      </p>
    </div>
  );
};

export default ShippingPolicy;
