export default function CountriesPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Country Comparison</h1>
      <p className="text-gray-600 mb-8">
        Compare macroeconomic indicators across USA, UK, Canada, and Australia to understand baseline conditions before simulating policy impacts.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['United States', 'United Kingdom', 'Canada', 'Australia'].map((country) => (
          <div key={country} className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-4">{country}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Unemployment</span>
                <span className="font-medium">Data pending</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inflation</span>
                <span className="font-medium">Data pending</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gini Index</span>
                <span className="font-medium">Data pending</span>
              </div>
            </div>
            <button className="mt-6 w-full bg-blue-50 text-blue-600 py-2 rounded-md font-medium text-sm hover:bg-blue-100 transition-colors">
              View Detailed Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
