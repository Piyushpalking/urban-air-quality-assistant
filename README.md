🌍 Urban Air Quality Assistant

An AI-powered urban air quality monitoring and intelligent health guidance platform.

""Live Demo" (https://img.shields.io/badge/Live-Demo-brightgreen)" (https://urban-air-quality-assistant-2-846648988581.asia-east1.run.app/)
""Built with Gemini" (https://img.shields.io/badge/AI-Google%20Gemini-blue)" (https://ai.google.dev/)
""Data Source" (https://img.shields.io/badge/Data-Open--Meteo-green)" (https://open-meteo.com/)

🚀 Live Application

Live Demo: https://urban-air-quality-assistant-2-846648988581.asia-east1.run.app/

1. Problem Statement

Air pollution is a major urban environmental challenge. People often lack accessible, understandable and actionable information about the quality of the air they breathe.

Traditional air quality information can be difficult to interpret, especially when users need to understand pollutant concentrations, forecast changes and precautions for outdoor activities.

Urban Air Quality Assistant addresses this problem by combining air quality data, interactive visualizations and Generative AI to make environmental information easier to understand and act upon.

2. Our Solution

Urban Air Quality Assistant is an AI-powered platform that helps users monitor urban air quality, understand pollution trends and receive contextual recommendations.

The application combines Open-Meteo Air Quality API data with Google Gemini to provide an interactive and informative experience.

3. Key Features

🌫️ Air Quality Dashboard

- Displays current city-level air quality information.
- Shows US EPA AQI and European AQI.
- Provides pollutant concentration information.
- Displays data source and update timestamps.

🌍 City Search and Switching

- Search for supported cities.
- Switch between different cities.
- Refresh air quality readings.

📊 Pollutant Monitoring

Tracks the following pollutants:

- PM2.5
- PM10
- Nitrogen Dioxide (NO₂)
- Sulphur Dioxide (SO₂)
- Ozone (O₃)
- Carbon Monoxide (CO)

📅 Air Quality Forecasts

- 24-hour air quality forecast.
- Five-day air quality forecast.
- Helps users understand potential changes in pollution levels.

🗺️ Pollution Map

- Interactive map interface.
- Zoom and drag controls.
- Available map markers and location information.

🤖 Gemini AI Assistant

- Answers natural-language air quality questions.
- Uses available city and pollutant context.
- Provides practical pollution precautions.
- Offers guidance for the general public and sensitive groups.
- Explains forecast-based air quality risks.

🔐 Security

- Server-side Gemini API integration.
- Environment-variable-based API key management.
- Request validation and origin restrictions.
- Prompt-injection isolation.
- AI response sanitization.
- Error handling and security headers.
- Rate limiting.

4. Technology Stack

Technology| Purpose
React| User interface
TypeScript| Application logic and type safety
Vite| Frontend development and build
Node.js| Backend runtime
Netlify Functions| Serverless assistant endpoint
Google Gemini| Generative AI
Open-Meteo| Air quality data
Google Cloud Run| Production deployment
GitHub| Source code management

5. Data Source and Methodology

The application uses the Open-Meteo Air Quality API.

Official documentation:
https://open-meteo.com/en/docs/air-quality-api

The API provides atmospheric model-based air quality estimates and forecast information.

The application displays pollutant concentrations and supports US EPA and European AQI standards.

Important data limitation:

Open-Meteo model-based estimates are not equivalent to physical street-level monitoring station measurements or CPCB ground-sensor readings.

The application does not claim that its readings are direct measurements from CPCB monitoring stations.

Users should consider this distinction when interpreting air quality information.

6. AI Integration

The application integrates Google Gemini to generate contextual air quality guidance.

The AI assistant receives relevant available information, including:

- Selected city.
- Current AQI standard.
- Pollutant concentrations.
- Available forecast information.
- Data timestamps and units.
- User questions.

Gemini uses this context to produce understandable explanations and practical recommendations.

AI Security

The Gemini API key is intended to remain on the server and is accessed through the "GEMINI_API_KEY" environment variable.

It must never be exposed in frontend code or committed to the public repository.

7. Application Architecture

User
  |
  v
React + TypeScript Frontend
  |
  +--------------------------+
  |                          |
  v                          v
Open-Meteo API          AI Assistant
  |                          |
  v                          v
AQI and Forecast       Backend Endpoint
  |                          |
  |                          v
  |                     Google Gemini
  |                          |
  +------------+-------------+
               |
               v
        Dashboard and
        AI Recommendations

8. Security and Testing

The project underwent a security audit and production startup verification.

Reported verification results:

- 17/17 unit tests passed.
- TypeScript checks passed.
- Production build passed.
- Dependency audit reported zero known vulnerabilities.
- API key exposure scans reported no frontend secrets.
- Request origin and content-type validation implemented.
- Input validation and rate limiting implemented.
- AI response sanitization implemented.
- Production server startup verified.
- Cloud Run deployment successfully tested.

These results reflect the project's reported test and audit runs; security should continue to be monitored after deployment.

9. Environment Variables

The application requires the following server-side secret:

GEMINI_API_KEY=your_gemini_api_key

Never commit actual API keys or secret credentials.

Use environment variables in the appropriate deployment environment.

An ".env.example" file may be used to document required configuration without exposing credentials.

10. Local Development

Prerequisites

- Node.js
- npm
- Gemini API key

Installation

git clone https://github.com/Piyushpalking/urban-air-quality-assistant.git

cd urban-air-quality-assistant

npm install

Environment Setup

Create a local ".env" file and configure:

GEMINI_API_KEY=your_gemini_api_key

Keep ".env" out of version control.

Development

npm run dev

Production Build

npm run build

Production Start

npm start

Tests

npm test

11. Deployment

The production application is deployed using Google Cloud Run.

Production URL:

https://urban-air-quality-assistant-2-846648988581.asia-east1.run.app/

The production backend must receive its Gemini API key through secure server-side environment configuration.

12. Assumptions and Limitations

1. Air quality readings are based on atmospheric model estimates from Open-Meteo.
2. Model estimates may differ from local ground-monitoring station measurements.
3. Forecasts represent estimated future atmospheric conditions and are subject to change.
4. AI-generated recommendations are informational and are not a substitute for professional medical advice.
5. Data availability depends on the external API and network connectivity.
6. AI response quality depends on the accuracy and availability of the supplied context.

13. Future Improvements

Potential future enhancements include:

- More detailed location-level pollution insights.
- Historical air quality analysis.
- Personalized pollution alerts.
- Improved pollution trend visualizations.
- Additional environmental data sources.
- More advanced AI-powered recommendations.

14. Project Information

Project: Urban Air Quality Assistant

Category: Environmental Technology / Artificial Intelligence

AI Service: Google Gemini

Air Quality Data: Open-Meteo

Deployment: Google Cloud Run

Challenge: PromptWars Challenge 6

GitHub Repository: https://github.com/Piyushpalking/urban-air-quality-assistant

---

Built to make urban air quality information more accessible, understandable and actionable. 🌍🍃