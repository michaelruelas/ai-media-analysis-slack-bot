/**
 * Local test script for Bot Lambda.
 * Run with: npx ts-node test_invoke_bot.ts
 * Note: This tests the Lambda handler directly, mocking external dependencies.
 */

import { config } from 'dotenv';
config({ path: '../.env' });

// Mock AWS SDK
const mockResponse = {
  model_version: 'v0.1',
  predictions: [
    { species: 'House Finch', confidence: 0.92 },
    { species: 'Mourning Dove', confidence: 0.07 },
  ],
};

class MockLambda {
  invoke() {
    return {
      promise: () => Promise.resolve({
        Payload: JSON.stringify(mockResponse),
      }),
    };
  }
}

// Mock the modules before importing
const mockAWS = {
  Lambda: MockLambda,
};

// Override require for aws-sdk
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id: string) {
  if (id === 'aws-sdk') {
    return mockAWS;
  }
  return originalRequire.apply(this, arguments);
};

import * as AWS from 'aws-sdk';

// Mock pg
const mockPgClient = {
  connect: () => Promise.resolve(),
  query: () => Promise.resolve(),
  end: () => Promise.resolve(),
};

const mockPg = {
  Client: function() {
    return mockPgClient;
  },
};

// Mock uuid
const mockUuid = {
  v4: () => 'test-uuid',
};

// Override require for pg and uuid
Module.prototype.require = function(id: string) {
  if (id === 'aws-sdk') {
    return mockAWS;
  }
  if (id === 'pg') {
    return mockPg;
  }
  if (id === 'uuid') {
    return mockUuid;
  }
  return originalRequire.apply(this, arguments);
};

import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Now require the handler after setting up mocks
import { handler } from './bot_handler';

async function testBotLambda(): Promise<void> {
  console.log('Invoking Bot Lambda locally...');

  // Test 1: URL verification event
  const urlVerificationEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      type: 'url_verification',
      challenge: 'test-challenge',
    }),
    headers: {},
  };
  const context = {};

  let result = await handler(urlVerificationEvent as any, context as any);
  console.log('URL Verification Result:', JSON.stringify(result, null, 2));
  if (result.statusCode === 200 && result.body === 'test-challenge') {
    console.log('✅ URL verification test passed');
  } else {
    console.error('❌ URL verification test failed');
  }

  // Test 2: File shared event
  const fileSharedEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      type: 'event_callback',
      authed_teams: ['T00000000'],
      event_id: 'test-event-id',
      event: {
        type: 'file_shared',
        channel: 'C1234567890',
        team_id: 'T00000000',
        user: 'U1234567890',
        files: [
          {
            url_private: 'https://example.com/test-image.jpg',
            name: 'test-bird.jpg',
          },
        ],
        ts: '1234567890.123456',
      },
    }),
    headers: {
      'x-slack-request-timestamp': Date.now().toString(),
      'content-type': 'application/json',
    },
  };

  result = await handler(fileSharedEvent as any, context as any);
  console.log('File Shared Result:', JSON.stringify(result, null, 2));
  if (result.statusCode === 200 && result.body === 'OK') {
    console.log('✅ File shared test passed');
  } else {
    console.error('❌ File shared test failed');
  }

  // Test 3: Action feedback (requires full Slack payload with proper signatures)
  console.log('Note: For interactive testing of actions (buttons, selects), use the Bolt local server:');
  console.log('1. Run: npx ts-node bot_handler.ts');
  console.log('   This starts the Bolt app on http://localhost:3000');
  console.log('2. Use ngrok to expose the port: ngrok http 3000');
  console.log('3. Update your Slack app\'s Request URL to the ngrok URL + /slack/events');
  console.log('4. Test by sharing a file in the configured channel or using curl for events.');
  console.log('Example curl for URL verification:');
  console.log('curl -X POST http://localhost:3000/slack/events \\');
  console.log('-H "Content-Type: application/json" \\');
  console.log('-d \'{"type":"url_verification","challenge":"3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P"}\'');
  console.log('For Lambda-specific testing without server, use this script which mocks dependencies.');

  console.log('Bot Lambda local tests completed.');
}

testBotLambda().catch(console.error);