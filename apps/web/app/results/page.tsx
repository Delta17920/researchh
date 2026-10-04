export default function ResultsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold mb-2">Final Policy Assessment Synthesis</h1>
        <p className="text-gray-500 mb-8">Synthesized output from the Decision Synthesis Agent</p>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <h3 className="font-bold text-red-800">System Recommendation Status</h3>
          <p className="text-red-700 mt-1">
            <strong>The system does not recommend implementation automatically.</strong> This report is for decision support only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-green-700">Expected Benefits</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Awaiting simulation completion...</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4 text-orange-700">Unintended Consequences (Risks)</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Awaiting simulation completion...</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 mt-8">
          <h2 className="text-xl font-semibold mb-4">Key Agent Disagreements</h2>
          <div className="bg-gray-50 p-6 rounded-md">
            <p className="text-gray-600 italic">No debate results available yet. Run a simulation from the Analyze tab first.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
