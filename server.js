// server.js - Node.js backend for the OpenAPI Generator

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for base64 encoded images
app.use(express.static(path.join(__dirname, 'public')));

// API route to handle OpenAPI generation
app.post('/api/generate-openapi', async (req, res) => {
    try {
        const { contextMap, visualGlossary, apiSkeleton, apiKey } = req.body;

        if (!contextMap || !visualGlossary || !apiSkeleton) {
            return res.status(400).json({ error: 'Missing required files' });
        }

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }

        console.log('Processing request with files...');

        // Prepare the request to Claude API
        const requestBody = {
            model: "claude-3-opus-20240229",
            max_tokens: 4000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "I'm uploading three files: a context map graphic, a visual glossary graphic, and an OpenAPI REST skeleton file. Please analyze these files and generate a complete OpenAPI specification based on them. The context map shows service relationships, the visual glossary defines key terms, and the skeleton file provides the basic structure to build upon."
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg", // Adjust based on actual file type
                                data: contextMap
                            }
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg", // Adjust based on actual file type
                                data: visualGlossary
                            }
                        },
                        {
                            type: "text",
                            text: `Here is the OpenAPI skeleton file:\n\n${apiSkeleton}\n\nPlease generate a complete OpenAPI specification based on all three files. Focus on enriching the paths, adding detailed schemas based on the visual glossary, and structuring the API according to the relationships shown in the context map.`
                        }
                    ]
                }
            ]
        };

        // Make the API call to Claude
        try {
            console.log('Sending request to Anthropic API...');

            // Add debug log to help troubleshoot
            console.log('Request headers:', {
                'Content-Type': 'application/json',
                'x-api-key': '[REDACTED]',
                'anthropic-version': '2023-06-01'
            });

            // Add timeout and larger maxBodyLength/maxContentLength
            const response = await axios.post('https://api.anthropic.com/v1/messages', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 3000000, // 60 second timeout
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });

            // Extract the relevant response from Claude
            const claudeResponse = response.data;

            console.log('Received response from Anthropic API');

            // Return the response to the client
            return res.json({
                success: true,
                data: claudeResponse
            });

        } catch (apiError) {
            console.error('API Error:', apiError.response?.data || apiError.message);
            return res.status(500).json({
                error: 'API request failed',
                details: apiError.response?.data || apiError.message
            });
        }

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Installation and setup instructions:
/*
1. Create a new directory for the project
2. Save this file as server.js
3. Create a public directory for static files
4. Save the HTML file as public/index.html
5. Initialize the project: npm init -y
6. Install dependencies: npm install express cors body-parser axios dotenv
7. Create a .env file for environment variables (optional):
   PORT=3000
   # Add other environment variables as needed
8. Run the server: node server.js
*/