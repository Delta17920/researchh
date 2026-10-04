export default function PoliciesPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Historical Policy Explorer</h1>
      <p className="text-gray-600 mb-8">
        Browse and analyze past policy interventions across multiple jurisdictions to identify historical precedents and their observed outcomes.
      </p>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Minimum Wage Increase (+10%)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">United Kingdom</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2022</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Labor</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" className="text-blue-600 hover:text-blue-900">View Impact</a>
              </td>
            </tr>
            {/* Additional mock rows would go here */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
