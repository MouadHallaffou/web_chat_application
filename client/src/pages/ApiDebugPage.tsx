import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import api from '../services/api';

interface TestResult {
    type: string;
    success: boolean;
    data?: unknown;
    error?: string;
    details?: unknown;
    message?: string;
    query?: string;
}

const ApiDebugPage: React.FC = () => {
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const testHealth = async () => {
        setLoading(true);
        try {
            const response = await api.get('/health');
            setTestResult({
                type: 'Health Check',
                success: true,
                data: response.data
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as { response?: unknown }).response : undefined;
            setTestResult({
                type: 'Health Check',
                success: false,
                error: errorMessage,
                details: errorResponse || error
            });
        } finally {
            setLoading(false);
        }
    };

    const testAuth = async () => {
        setLoading(true);
        try {
            // Check if user is logged in by testing a protected endpoint
            const response = await api.get('/profile/me');
            setTestResult({
                type: 'Auth Check',
                success: true,
                data: response.data,
                message: 'User is authenticated'
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Not authenticated';
            const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as { response?: unknown }).response : undefined;
            setTestResult({
                type: 'Auth Check',
                success: false,
                error: errorMessage,
                details: errorResponse || error
            });
        } finally {
            setLoading(false);
        }
    };

    const testSearch = async () => {
        if (!searchQuery.trim()) {
            setTestResult({
                type: 'Search Test',
                success: false,
                error: 'Please enter a search query'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/friendship/search?query=${encodeURIComponent(searchQuery)}`);
            setTestResult({
                type: 'Search Test',
                success: true,
                data: response.data,
                query: searchQuery
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Search failed';
            const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as { response?: unknown }).response : undefined;
            setTestResult({
                type: 'Search Test',
                success: false,
                error: errorMessage,
                details: errorResponse || error,
                query: searchQuery
            });
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => {
        setTestResult(null);
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">API Debug Page</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button onClick={testHealth} disabled={loading}>
                    Test Health API
                </Button>
                <Button onClick={testAuth} disabled={loading}>
                    Test Auth Status
                </Button>
                <Button onClick={clearResults} variant="outline">
                    Clear Results
                </Button>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Test Friend Search</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter username to search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && testSearch()}
                        />
                        <Button onClick={testSearch} disabled={loading || !searchQuery.trim()}>
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading && (
                <Card>
                    <CardContent className="p-6">
                        <p className="text-center">Loading...</p>
                    </CardContent>
                </Card>
            )}

            {testResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                            {testResult.type} - {testResult.success ? 'Success' : 'Failed'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(testResult, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Debug Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <p><strong>API Base URL:</strong> {api.defaults.baseURL}</p>
                        <p><strong>Auth Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not found'}</p>
                        <p><strong>Current User:</strong> {localStorage.getItem('user') || 'Not logged in'}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ApiDebugPage;
