import { randomBytes } from 'crypto';

// Type definitions
interface Species {
  id: number;
  name: string;
}

interface Prediction {
  species: string;
  confidence: number;
}

interface AIResponse {
  model_version: string;
  predictions: Prediction[];
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

interface LambdaEvent {
  [key: string]: any;
}

interface LambdaContext {
  [key: string]: any;
}

// Mock species list (subset for POC; expand to 837 if needed)
const MOCK_SPECIES: Species[] = [
  { id: 1, name: "Cardinalis cardinalis" },
  { id: 2, name: "Piranga rubra" },
  { id: 3, name: "Columba livia" },
  { id: 4, name: "Corvus brachyrhynchos" },
  { id: 5, name: "Sturnus vulgaris" },
  { id: 6, name: "Passer domesticus" },
  { id: 7, name: "Meleagris gallopavo" },
  { id: 8, name: "Buteo jamaicensis" },
  { id: 9, name: "Turdus migratorius" },
  { id: 10, name: "Cyanocitta cristata" }
];

const lambda_handler = (event: LambdaEvent, context: LambdaContext, callback: any) => {
  try {
    /**
     * Mock AI analysis Lambda handler.
     * Receives event with 'image_url', returns predictions JSON.
     * Updated for TypeScript conversion.
     */
    console.log('AI Lambda invoked with event:', JSON.stringify(event));
    console.log('AI Lambda starting processing...');

    // Mock analysis: random top 2 from species list
    const topSpecies = MOCK_SPECIES[Math.floor(Math.random() * MOCK_SPECIES.length)];
    const remainingSpecies = MOCK_SPECIES.filter(s => s.id !== topSpecies.id);
    const secondSpecies = remainingSpecies[Math.floor(Math.random() * remainingSpecies.length)];

    const predictions: Prediction[] = [
      {
        species: topSpecies.name,
        confidence: 0.92
      },
      {
        species: secondSpecies.name,
        confidence: 0.07
      }
    ];

    const response: AIResponse = {
      model_version: "v4.2.2-alpha",
      predictions: predictions
    };

    console.log('AI Lambda returning response:', response);
    const responseBody = JSON.stringify(response);
    console.log('AI Lambda response body:', responseBody);
    console.log('About to return responseBody');
    callback(null, responseBody);
  } catch (error: any) {
    console.error('Unhandled error in AI Lambda:', error);
    callback(error, null);
  }
};

exports.lambda_handler = lambda_handler;