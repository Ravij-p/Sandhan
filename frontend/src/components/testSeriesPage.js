import { testSeriesCards } from "../slides/sliderCards";
export const TestSeriesPage = () => (
  <div className="pt-40 lg:pt-20">
    <div className="py-20" style={{ backgroundColor: "#fafaee" }}>
      <div className="container mx-auto px-4">
        <h1
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          style={{ color: "#163233" }}
        >
          Test Series
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Practice makes perfect - Choose your test series
        </p>
        <p className="text-xl text-center text-gray-600 mb-12">
          Test Series Coming soon...
        </p>
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testSeriesCards.map((series) => (
            <div
              key={series.id}
              className={`${series.color} p-6 rounded-xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-yellow-400`}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "#163233" }}
              >
                {series.title}
              </h3>
              <div className="space-y-2 mb-6 text-gray-700">
                <div className="flex justify-between">
                  <span>Total Tests:</span>
                  <span className="font-semibold">{series.tests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold">{series.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-bold text-green-600">
                    {series.price}
                  </span>
                </div>
              </div>
              <button
                className="w-full py-2 rounded-lg font-medium transition-colors hover:shadow-md"
                style={{ backgroundColor: "#f9dc41", color: "#163233" }}
              >
                Enroll Now
              </button>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  </div>
);
