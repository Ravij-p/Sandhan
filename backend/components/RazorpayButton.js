import React from "react";

const RazorpayButton = ({ name, mobile, course, amount = 1000 }) => {
  const handlePayment = async () => {
    try {
      // Create order on backend
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          mobile,
          course,
          amount,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        alert(orderData.error || "Failed to create payment order");
        return;
      }

      // Razorpay payment options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Tushti IAS",
        description: `Course: ${course}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                name,
                mobile,
                course,
                amount: orderData.amount,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              alert(
                `Payment successful! Receipt Number: ${verifyData.receiptNumber}`
              );

              // Download receipt
              if (verifyData.downloadUrl) {
                window.open(verifyData.downloadUrl, "_blank");
              }

              // Optionally redirect or refresh page
              window.location.reload();
            } else {
              alert(verifyData.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: name,
          contact: mobile,
        },
        notes: {
          course: course,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal closed");
          },
        },
      };

      // Create Razorpay instance and open payment modal
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  return (
    <div className="razorpay-button-container">
      <button
        onClick={handlePayment}
        className="razorpay-payment-button"
        style={{
          backgroundColor: "#3399cc",
          color: "white",
          padding: "12px 24px",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#2980b9")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#3399cc")}
      >
        Pay ₹{amount} - {course}
      </button>

      <style jsx>{`
        .razorpay-button-container {
          margin: 20px 0;
        }

        .razorpay-payment-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .razorpay-payment-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default RazorpayButton;
