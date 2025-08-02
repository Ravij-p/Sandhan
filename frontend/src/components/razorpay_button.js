// import React, { useEffect, useRef } from "react";

// const RazorpayButton = () => {
//   const formRef = useRef(null);

//   useEffect(() => {
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/payment-button.js";
//     script.setAttribute("data-payment_button_id", "pl_QyOFv3xXeYY6ex");
//     script.async = true;

//     if (formRef.current) {
//       formRef.current.innerHTML = "";
//       formRef.current.appendChild(script);
//     }

//     return () => {
//       if (formRef.current) formRef.current.innerHTML = "";
//     };
//   }, []);

//   return <form ref={formRef}></form>;
// };

// export default RazorpayButton;
import React from "react";

const RazorpayButton = ({ name, mobile, course }) => {
  const handlePayment = (name, mobile, course) => {
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded. Please try again.");
      return;
    }

    const options = {
      key: "rzp_test_8R9BEsU6zJWuim",
      amount: 10000,
      currency: "INR",
      name: "Course Payment",
      description: `Payment for ${course}`,
      handler: function (response) {
        console.log("Payment successful:", response);
        fetch("http://localhost:5000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            mobile,
            course,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            alert("Registration Successful!");
          })
          .catch((err) => {
            console.error(err);
            alert("Failed to save user details");
          });
      },
      prefill: {
        name,
        contact: mobile,
      },
      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button onClick={() => handlePayment(name, mobile, course)}>
      Pay ₹100
    </button>
  );
};

export default RazorpayButton;
