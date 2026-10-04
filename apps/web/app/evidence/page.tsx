export default function EvidencePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Evidence Verification Workspace</h1>
      <p className="text-gray-600 mb-8">
        Search the vector database of policy documents, government reports, and historical impact assessments.
      </p>
      
      <div className="flex gap-4 mb-8">
        <input 
          type="text" 
          placeholder="Search for evidence (e.g., 'impact of carbon pricing on SMEs')..." 
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
          Search
        </button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Database Status:</strong> Connection to Supabase Vector Store pending. Add your Supabase credentials to enable semantic search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
