import React, { useState } from 'react';
import { API_BASE_URL, GENERATE_ENDPOINT, LOCAL_GENERATE_ENDPOINT } from '../utils/config';

interface ApiEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  body?: any;
  description: string;
}

const ApiDiagnostics: React.FC = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Define the endpoints to test
  const endpoints: ApiEndpoint[] = [
    { 
      name: 'Check Server Paths', 
      url: `${API_BASE_URL}/api/check-paths.php`,
      method: 'GET',
      description: 'Checks server directory structure and permissions' 
    },
    { 
      name: 'Fix Permissions', 
      url: `${API_BASE_URL}/api/fix-permissions.php`, 
      method: 'GET',
      description: 'Attempts to fix directory permissions on the server' 
    },
    { 
      name: 'Test Upload Photo', 
      url: `${API_BASE_URL}/api/upload-photo.php`, 
      method: 'POST',
      body: () => {
        // Create a simple FormData with a test image
        const formData = new FormData();
        // Create a 1x1 pixel transparent PNG as test data
        const blob = new Blob(
          [new Uint8Array([
            137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 
            0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 
            137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 250, 207, 0, 
            0, 3, 1, 1, 0, 39, 68, 173, 40, 0, 0, 0, 0, 73, 69, 78, 
            68, 174, 66, 96, 130
          ])],
          { type: 'image/png' }
        );
        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        formData.append('photo', testFile);
        formData.append('fileName', 'test_diagnostic.png');
        return formData;
      },
      description: 'Tests photo upload functionality' 
    },
    { 
      name: 'Test Local API Route', 
      url: '/api/upload-photo', 
      method: 'POST',
      body: () => {
        // Create a simple FormData with a test image
        const formData = new FormData();
        // Create a 1x1 pixel transparent PNG as test data
        const blob = new Blob(
          [new Uint8Array([
            137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 
            0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 
            137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 250, 207, 0, 
            0, 3, 1, 1, 0, 39, 68, 173, 40, 0, 0, 0, 0, 73, 69, 78, 
            68, 174, 66, 96, 130
          ])],
          { type: 'image/png' }
        );
        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        formData.append('photo', testFile);
        formData.append('fileName', 'test_local_diagnostic.png');
        return formData;
      },
      description: 'Tests local Next.js API route' 
    },
    { 
      name: 'Test Certificate Generation (Remote)',
      url: GENERATE_ENDPOINT,
      method: 'POST',
      body: JSON.stringify({
        students: [{
          id: 'test-123',
          name: 'Test Student',
          fatherName: 'Test Father',
          motherName: 'Test Mother',
          dob: '01 / 01 / 2010',
          dobInWords: 'First January Two Thousand Ten',
          class: '5th',
          address: 'Test Address',
          photoPath: null
        }],
        includePhotos: false
      }),
      description: 'Tests remote certificate generation'
    },
    { 
      name: 'Test Certificate Generation (Local)',
      url: LOCAL_GENERATE_ENDPOINT,
      method: 'POST',
      body: JSON.stringify({
        students: [{
          id: 'test-123',
          name: 'Test Student',
          fatherName: 'Test Father',
          motherName: 'Test Mother',
          dob: '01 / 01 / 2010',
          dobInWords: 'First January Two Thousand Ten',
          class: '5th',
          address: 'Test Address',
          photoPath: null
        }],
        includePhotos: false
      }),
      description: 'Tests local certificate generation'
    },
    {
      name: 'CORS Test',
      url: `${API_BASE_URL}/api/hi.php`,
      method: 'GET',
      description: 'Tests CORS settings on server'
    }
  ];

  // Function to test an endpoint
  const testEndpoint = async (endpoint: ApiEndpoint) => {
    setLoading(prev => ({ ...prev, [endpoint.name]: true }));
    
    try {
      console.log(`Testing endpoint: ${endpoint.name} at ${endpoint.url}`);
      
      const options: RequestInit = {
        method: endpoint.method,
        headers: endpoint.method === 'POST' && !endpoint.body ? 
          { 'Content-Type': 'application/json' } : 
          undefined,
      };
      
      // Add body if needed
      if (endpoint.body) {
        options.body = typeof endpoint.body === 'function' ? endpoint.body() : endpoint.body;
      }
      
      const startTime = performance.now();
      const response = await fetch(endpoint.url, options);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      let data;
      let responseText = '';
      
      // Try to parse as JSON
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          responseText = JSON.stringify(data, null, 2);
        } else {
          responseText = await response.text();
          try {
            // Try to parse as JSON anyway (sometimes content-type is wrong)
            data = JSON.parse(responseText);
          } catch {
            data = { raw: responseText };
          }
        }
      } catch (error) {
        responseText = await response.text();
        data = { raw: responseText, parseError: (error as Error).message };
      }
      
      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data,
        headers: Object.fromEntries([...response.headers.entries()]),
        timestamp: new Date().toISOString()
      };
      
      console.log(`API Test Result for ${endpoint.name}:`, result);
      setResults(prev => ({ ...prev, [endpoint.name]: result }));
      
      // Show an alert with a summary
      alert(`${endpoint.name}: ${response.ok ? 'SUCCESS' : 'FAILED'}\nStatus: ${response.status} ${response.statusText}\nTime: ${responseTime}ms`);
      
    } catch (error) {
      console.error(`Error testing ${endpoint.name}:`, error);
      
      const errorResult = {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
      
      setResults(prev => ({ ...prev, [endpoint.name]: errorResult }));
      alert(`${endpoint.name}: ERROR\n${(error as Error).message}`);
    } finally {
      setLoading(prev => ({ ...prev, [endpoint.name]: false }));
    }
  };

  const testAllEndpoints = async () => {
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
    }
  };

  const formatJsonOutput = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">API Diagnostics</h2>
        <button 
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
        </button>
      </div>
      
      {showDiagnostics && (
        <>
          <div className="mb-4">
            <button
              onClick={testAllEndpoints}
              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Test All Endpoints
            </button>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {endpoints.map(endpoint => (
              <div key={endpoint.name} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{endpoint.name}</h3>
                  <button
                    onClick={() => testEndpoint(endpoint)}
                    disabled={loading[endpoint.name]}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading[endpoint.name] ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                <div className="text-xs text-gray-500 mb-1">
                  <span className="font-semibold">URL:</span> {endpoint.url}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-semibold">Method:</span> {endpoint.method}
                </div>
                
                {results[endpoint.name] && (
                  <div className="mt-3">
                    <div className={`text-xs font-semibold ${results[endpoint.name].success ? 'text-green-600' : 'text-red-600'}`}>
                      {results[endpoint.name].success ? 'SUCCESS' : 'FAILED'}
                      {results[endpoint.name].status && 
                        ` (${results[endpoint.name].status} ${results[endpoint.name].statusText})`}
                      {results[endpoint.name].responseTime && 
                        ` - ${results[endpoint.name].responseTime}ms`}
                    </div>
                    
                    <div className="mt-2 rounded bg-gray-100 p-2 h-40 overflow-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {formatJsonOutput(results[endpoint.name].data || results[endpoint.name])}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div className="font-semibold mb-1">API Base URL: {API_BASE_URL}</div>
            <div className="font-semibold mb-1">Browser URL: {window.location.origin}</div>
            <div className="font-semibold">Last Test: {Object.values(results).length > 0 ? 
              new Date(Object.values(results)[Object.values(results).length - 1].timestamp).toLocaleString() : 
              'Never'}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default ApiDiagnostics; 