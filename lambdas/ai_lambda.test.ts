import { lambda_handler } from './ai_lambda';

describe('ai_lambda', () => {
  describe('lambda_handler', () => {
    it('should return successful AI analysis response', () => {
      const event = { image_url: 'https://example.com/test.jpg' };
      const context = {};

      const result = lambda_handler(event, context);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('model_version');
      expect(responseBody).toHaveProperty('predictions');
      expect(Array.isArray(responseBody.predictions)).toBe(true);
      expect(responseBody.predictions.length).toBe(2);

      // Check prediction structure
      responseBody.predictions.forEach((prediction: any) => {
        expect(prediction).toHaveProperty('species');
        expect(prediction).toHaveProperty('confidence');
        expect(typeof prediction.species).toBe('string');
        expect(typeof prediction.confidence).toBe('number');
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });

      // First prediction should have higher confidence
      expect(responseBody.predictions[0].confidence).toBeGreaterThan(responseBody.predictions[1].confidence);
    });

    it('should return predictions with valid species names', () => {
      const event = { image_url: 'https://example.com/test.jpg' };
      const context = {};

      const result = lambda_handler(event, context);
      const responseBody = JSON.parse(result.body);

      // Verify species names are from the mock list
      const validSpecies = [
        "Cardinalis cardinalis", "Piranga rubra", "Columba livia",
        "Corvus brachyrhynchos", "Sturnus vulgaris", "Passer domesticus",
        "Meleagris gallopavo", "Buteo jamaicensis", "Turdus migratorius",
        "Cyanocitta cristata"
      ];

      responseBody.predictions.forEach((prediction: any) => {
        expect(validSpecies).toContain(prediction.species);
      });

      // Species should be different
      expect(responseBody.predictions[0].species).not.toBe(responseBody.predictions[1].species);
    });

    it('should handle empty event gracefully', () => {
      const event = {};
      const context = {};

      const result = lambda_handler(event, context);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('predictions');
    });

    it('should handle error conditions', () => {
      // Mock console.error to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock Math.random to force an error in species selection
      const originalRandom = Math.random;
      Math.random = jest.fn(() => {
        // Force an error by making filter return empty array
        throw new Error('Mock random error');
      });

      try {
        const event = { image_url: 'https://example.com/test.jpg' };
        const context = {};

        const result = lambda_handler(event, context);

        expect(result.statusCode).toBe(500);
        const responseBody = JSON.parse(result.body);
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toBe('AI analysis failed');

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error in AI analysis: Mock random error')
        );
      } finally {
        // Restore original functions
        Math.random = originalRandom;
        consoleSpy.mockRestore();
      }
    });

    it('should return consistent response structure', () => {
      const event = { image_url: 'https://example.com/test.jpg' };
      const context = {};

      const result = lambda_handler(event, context);
      const responseBody = JSON.parse(result.body);

      // Verify exact structure
      expect(responseBody).toEqual({
        model_version: expect.any(String),
        predictions: [
          {
            species: expect.any(String),
            confidence: expect.any(Number)
          },
          {
            species: expect.any(String),
            confidence: expect.any(Number)
          }
        ]
      });
    });

    it('should have realistic confidence scores', () => {
      const event = { image_url: 'https://example.com/test.jpg' };
      const context = {};

      const result = lambda_handler(event, context);
      const responseBody = JSON.parse(result.body);

      // Top prediction should have high confidence (0.8+)
      expect(responseBody.predictions[0].confidence).toBeGreaterThan(0.8);
      // Second prediction should have lower confidence
      expect(responseBody.predictions[1].confidence).toBeLessThan(0.2);
    });
  });
});