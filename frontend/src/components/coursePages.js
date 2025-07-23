const CoursePage = ({ courseType }) => {
  const courseData = {
    ssc: {
      title: "SSC Preparation",
      description:
        "Staff Selection Commission exam preparation with comprehensive coverage",
      fees: "₹18,500",
      cancelled_fee: "₹21,000",
    },
    neet: {
      title: "NEET Coaching for Class 12",
      description: "National Eligibility cum Entrance Test for medical courses",
      fees: "₹55,000",
      cancelled_fee: "₹65,000",
    },
    gpsc: {
      title: "GPSC Class 1-2",
      description: "Gujarat Public Service Commission examination coaching",
      fees: "₹32,000",
      cancelled_fee: "₹50,000",
    },
    talati: {
      title: "Talati Exam Prelims + Mains",
      description: "Class 3",
      fees: "₹12,000",
      cancelled_fee: "₹20,000",
    },
    ethics: {
      title: "Ethics and Essay for GPSC Class 1-2 Exam",
      description: "Ethics and Essay for GPSC Class 1-2 Exam",
      fees: "₹9,999",
      cancelled_fee: "₹15,000",
    },
    neet12: {
      title: "NEET Coaching for Class 12",
      description: "National Eligibility cum Entrance Test for medical courses",
      fees: "₹55,000",
      cancelled_fee: "₹65,000",
    },
    neet11: {
      title: "NEET Coaching for Class 11",
      description: "National Eligibility cum Entrance Test for medical courses",
      fees: "₹70,000",
      cancelled_fee: "₹85,000",
    },
    upsc: {
      title: "UPSC Exam Prelims + Mains",
      description: "Coming soon",
    },
  };

  const course = courseData[courseType] || courseData.ssc;

  return (
    <div className="pt-24">
      <div className="py-20" style={{ backgroundColor: "#fafaee" }}>
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-8" style={{ color: "#163233" }}>
            {course.title}
          </h1>
          <p className="text-lg text-gray-700 mb-8">{course.description}</p>
          {course.title !== "UPSC Exam Prelims + Mains" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3
                    className="text-xl font-bold mb-4"
                    style={{ color: "#163233" }}
                  >
                    Course Features
                  </h3>
                  <ul className="text-left text-gray-700 space-y-2">
                    <li>• Expert Faculty</li>
                    <li>• Comprehensive Study Material</li>
                    <li>• Regular Mock Tests</li>
                    <li>• Doubt Clearing Sessions</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3
                    className="text-xl font-bold mb-4"
                    style={{ color: "#163233" }}
                  >
                    Duration & Fees
                  </h3>
                  <div className="text-left text-gray-700 space-y-2">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>12 months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Batch Size:</span>
                      <span>50 students</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fees:</span>
                      <del className="font-bold">{course.cancelled_fee}</del>
                      <span className="font-bold">{course.fees}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="mt-8 px-8 py-3 rounded-lg font-medium text-lg transition-all hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: "#f9dc41", color: "#163233" }}
              >
                Enroll Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CoursePage;
