// Mock modules before importing
jest.mock('aws-sdk');
jest.mock('@slack/bolt');
jest.mock('./mock-species');
jest.mock('pg');

import * as AWS from 'aws-sdk';
import { App, AwsLambdaReceiver } from '@slack/bolt';

// Mock the lambda before importing the module
const mockLambda = {
  invoke: jest.fn(),
};
(AWS.Lambda as any).mockImplementation(() => mockLambda);

import { handler, file_sharedHandler, feedbackCorrectHandler, feedbackIncorrectHandler } from './bot_handler';

const mockClient = {
  chat: {
    postMessage: jest.fn().mockResolvedValue({ ok: true }),
  },
};

describe('bot_handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (App as any).mockClear();
    (AwsLambdaReceiver as any).mockClear();
  });

  afterEach(() => {
    // Reset the lambda mock after each test
    jest.restoreAllMocks();
  });

  describe('handler', () => {
    it('should handle POST request successfully', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({ type: 'url_verification', challenge: 'challenge' }),
      };
      const context = {};

      const mockReceiver = { request: jest.fn().mockResolvedValue(undefined) };
      (AwsLambdaReceiver as any).mockReturnValue(mockReceiver);

      const result = await handler(event as any, context as any);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('challenge');
    });

    it('should return 404 for non-POST method', async () => {
      const event = { httpMethod: 'GET' };
      const context = {};

      const result = await handler(event as any, context as any);

      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('Not found');
    });

    it('should handle errors and return 500', async () => {
      const event = { httpMethod: 'POST' };
      const context = {};
      const mockReceiver = { request: jest.fn().mockRejectedValue(new Error('Test error')) };
      (AwsLambdaReceiver as any).mockReturnValue(mockReceiver);

      const result = await handler(event as any, context as any);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe('Internal Server Error');
    });
  });

  describe('file_shared event', () => {
    const say = jest.fn().mockResolvedValue({ ok: true });
    const mockInvokeResult = {
      promise: jest.fn().mockResolvedValue({
        Payload: JSON.stringify({
          model_version: 'v0.1',
          predictions: [
            { species: 'House Finch', confidence: 0.9 },
            { species: 'Mourning Dove', confidence: 0.05 },
          ],
        }),
      }),
    };

    beforeEach(() => {
      mockLambda.invoke.mockReturnValue(mockInvokeResult);
    });

    it('should process file_shared event and invoke AI Lambda', async () => {
      const event = {
        type: 'file_shared',
        channel: 'C1234567890',
        files: [{ url_private: 'https://example.com/image.jpg', name: 'test.jpg' }],
        ts: '1234567890.123456',
      };

      await file_sharedHandler({ event, say });

      // Verify the response was sent (indicating lambda.invoke worked)
      expect(say).toHaveBeenCalledWith(expect.objectContaining({
        thread_ts: '1234567890.123456',
        blocks: expect.any(Array),
      }));
    });

    it('should handle AI Lambda error', async () => {
      const mockErrorResult = {
        promise: jest.fn().mockResolvedValue({
          Payload: JSON.stringify({ error: 'AI error' }),
        }),
      };
      mockLambda.invoke.mockReturnValueOnce(mockErrorResult);

      const event = {
        type: 'file_shared',
        channel: 'C1234567890',
        files: [{ url_private: 'https://example.com/image.jpg' }],
        ts: '1234567890.123456',
      };

      await file_sharedHandler({ event, say });

      expect(say).toHaveBeenCalledWith(expect.objectContaining({
        thread_ts: '1234567890.123456',
        text: 'Sorry, the AI model is currently unavailable. Please try again later.',
      }));
    });

    it('should skip non-target channel', async () => {
      const event = {
        type: 'file_shared',
        channel: 'WRONG_CHANNEL',
        files: [{ url_private: 'https://example.com/image.jpg' }],
        ts: '1234567890.123456',
      };

      await file_sharedHandler({ event, say });

      expect(say).not.toHaveBeenCalled();
    });
  });

  describe('feedback actions', () => {
    const mockPgClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
      (require('pg').Client as any).mockReturnValue(mockPgClient);
    });

    it('should handle correct feedback and store in DB', async () => {
      const body = {
        actions: [{
          value: JSON.stringify({
            action: 'correct',
            topSpecies: 'House Finch',
            modelVersion: 'v0.1',
            thread_ts: '1234567890.123456',
            filename: 'test.jpg',
          }),
        }],
        user: { id: 'U123' },
        channel: { id: 'C123' },
      };
      const ack = jest.fn().mockResolvedValue(undefined);

      await feedbackCorrectHandler({ ack, body, client: mockClient });

      expect(ack).toHaveBeenCalled();
      expect(mockPgClient.connect).toHaveBeenCalled();
      expect(mockPgClient.query).toHaveBeenCalled();
      expect(mockClient.chat.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        channel: 'C123',
        thread_ts: '1234567890.123456',
        text: '✅ Thank you! Your feedback has been recorded.',
      }));
    });

    it('should handle incorrect feedback and store in DB', async () => {
      const body = {
        actions: [{
          selected_option: {
            value: JSON.stringify({
              action: 'incorrect',
              topSpecies: 'House Finch',
              correctedSpecies: 'Mourning Dove',
              modelVersion: 'v0.1',
              thread_ts: '1234567890.123456',
              filename: 'test.jpg',
            }),
          },
        }],
        user: { id: 'U123' },
        channel: { id: 'C123' },
      };
      const ack = jest.fn().mockResolvedValue(undefined);

      await feedbackIncorrectHandler({ ack, body, client: mockClient });

      expect(ack).toHaveBeenCalled();
      expect(mockPgClient.connect).toHaveBeenCalled();
      expect(mockPgClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO feedback'),
        expect.arrayContaining([
          expect.any(String), // feedback_id
          '1234567890.123456',
          'U123',
          'v0.1',
          false,
          'House Finch',
          'Mourning Dove',
          null,
          null,
          expect.any(Number),
        ])
      );
      expect(mockClient.chat.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        text: '✅ Thank you! Your feedback has been recorded.',
      }));
    });

    it('should handle DB error in feedback', async () => {
      const body = {
        actions: [{ value: JSON.stringify({ action: 'correct' }) }],
        user: { id: 'U123' },
        channel: { id: 'C123' },
      };
      const ack = jest.fn().mockResolvedValue(undefined);
      mockPgClient.connect.mockRejectedValueOnce(new Error('DB error'));

      await feedbackCorrectHandler({ ack, body, client: mockClient });

      expect(mockClient.chat.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Error saving feedback. Please try again.',
      }));
    });
  });
});