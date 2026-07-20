// Netlify Function - Proxy for Oay Yaqin AI
// This hides the API key and bypasses CORS/filtering issues

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Handle preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        var body = JSON.parse(event.body);
        var provider = body.provider || 'groq';
        var apiUrl = body.apiUrl;
        var apiKey = body.apiKey;
        var requestBody = body.requestBody;
        var headers = body.headers || {};

        // If no API key provided, use environment variable
        if (!apiKey) {
            if (provider === 'groq') {
                apiKey = process.env.GROQ_API_KEY;
            } else if (provider === 'openai') {
                apiKey = process.env.OPENAI_API_KEY;
            } else if (provider === 'anthropic') {
                apiKey = process.env.ANTHROPIC_API_KEY;
            } else if (provider === 'google') {
                apiKey = process.env.GOOGLE_API_KEY;
            }
        }

        if (!apiKey) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'API Key not found. Please set it in Netlify Environment Variables or send it in request.' })
            };
        }

        // Build headers for the target API
        var fetchHeaders = {
            'Content-Type': 'application/json'
        };

        if (provider === 'anthropic') {
            fetchHeaders['x-api-key'] = apiKey;
            fetchHeaders['anthropic-version'] = '2023-06-01';
        } else if (provider === 'google') {
            // Google uses query param for key
            if (apiUrl.indexOf('?') === -1) {
                apiUrl = apiUrl + '?key=' + apiKey;
            } else {
                apiUrl = apiUrl + '&key=' + apiKey;
            }
        } else {
            fetchHeaders['Authorization'] = 'Bearer ' + apiKey;
        }

        // Merge custom headers
        for (var key in headers) {
            fetchHeaders[key] = headers[key];
        }

        var response = await fetch(apiUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(requestBody)
        });

        var responseData = await response.json();

        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
