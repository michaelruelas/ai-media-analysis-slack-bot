// Load environment variables only in local development
if (process.env.NODE_ENV !== 'production' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const { config } = require('dotenv');
  config({ path: '../.env' });
}

import { App } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'pg';
import { createHmac } from 'crypto';
import mockSpecies from './mock-species';

// Type definitions
interface Prediction {
  species: string;
  confidence: number;
}

interface AIResponse {
  model_version?: string;
  predictions: Prediction[];
  error?: string;
}

interface FeedbackData {
  action: 'correct' | 'incorrect';
  topSpecies: string;
  correctedSpecies?: string;
  modelVersion: string;
  filename: string;
  thread_ts: string;
}

interface LambdaEvent {
  httpMethod: string;
  body: string;
  isBase64Encoded?: boolean;
  headers: Record<string, string | undefined>;
}

interface LambdaContext {
  // Add context properties as needed
}

interface LambdaResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// Import Slack types
import { SlackEventMiddlewareArgs, AllMiddlewareArgs, SlackActionMiddlewareArgs } from '@slack/bolt';

// Slack signature verification function
const verifySlackSignature = (signingSecret: string, timestamp: string, body: string, signature: string): boolean => {
  // Check if timestamp is within 5 minutes (300 seconds)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 300) {
    console.log('Request timestamp is too old');
    return false;
  }

  const hmac = createHmac('sha256', signingSecret);
  const baseString = `v0:${timestamp}:${body}`;
  const computedSignature = `v0=${hmac.update(baseString).digest('hex')}`;
  return computedSignature === signature;
};

// Initialize services
const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION || 'us-west-1'
});

// Initialize Bolt app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Event handler for file_shared
const file_sharedHandler = async (args: any) => {
  const { event, client } = args;
  console.log('Processing file_shared event for channel:', event.channel_id);

  // Filter for #bird-id channel (replace with actual channel ID)
  const allowedChannel = process.env.SLACK_BIRD_CHANNEL_ID || 'C09JDQ384FQ'; // Default to the channel from logs
  if (event.channel_id !== allowedChannel) {
    console.log(`Ignoring file_shared event for channel ${event.channel_id}, only processing ${allowedChannel}`);
    return;
  }

  const imageUrl = event.file.url_private;

  const invokeParams = {
    FunctionName: process.env.AI_LAMBDA_NAME || 'ai_handler',
    InvocationType: 'RequestResponse' as const,
    Payload: JSON.stringify({ image_url: imageUrl }),
  };

  try {
    console.log('Invoking AI Lambda with params:', invokeParams);
    const result = await lambda.invoke(invokeParams).promise();
    console.log('AI Lambda result:', result);

    if (!result.Payload) {
      console.error('AI Lambda returned null payload');
      await client.chat.postMessage({
        channel: event.channel_id,
        thread_ts: event.ts,
        text: 'Sorry, the AI model is currently unavailable. Please try again later.',
      });
      return;
    }

    // AWS Lambda double-encodes JSON responses from callbacks
    const rawPayload = JSON.parse(result.Payload as string);
    const body: AIResponse = JSON.parse(rawPayload);

    if (body.error) {
      console.log('AI Lambda returned error:', body.error);
      await client.chat.postMessage({
        channel: event.channel_id,
        thread_ts: event.ts,
        text: 'Sorry, the AI model is currently unavailable. Please try again later.',
      });
      return;
    }

    const { model_version, predictions } = body;

    const modelVersion = model_version || 'v0.1-poc';
    const filename = event.file.name;
    const topSpecies = predictions[0].species;
    const threadTs = event.ts;
    const topThree = predictions.slice(0, 3).map((p, i) => ({ ...p }));

    const selectOptions = [
      ...topThree.slice(1).map(p => ({
        text: {
          type: 'plain_text' as const,
          text: p.species
        },
        value: JSON.stringify({
          action: 'incorrect',
          topSpecies,
          correctedSpecies: p.species,
          modelVersion,
          filename,
          thread_ts: threadTs
        })
      })),
      {
        text: {
          type: 'plain_text' as const,
          text: 'House Finch'
        },
        value: JSON.stringify({
          action: 'incorrect',
          topSpecies,
          correctedSpecies: 'House Finch',
          modelVersion,
          filename,
          thread_ts: threadTs
        })
      },
      {
        text: {
          type: 'plain_text' as const,
          text: 'Mourning Dove'
        },
        value: JSON.stringify({
          action: 'incorrect',
          topSpecies,
          correctedSpecies: 'Mourning Dove',
          modelVersion,
          filename,
          thread_ts: threadTs
        })
      }
    ];

    const blocks = [
      {
        type: 'header' as const,
        text: {
          type: 'plain_text' as const,
          text: '🔎 AI Model Analysis Results',
          emoji: true
        }
      },
      {
        type: 'context' as const,
        elements: [
          {
            type: 'mrkdwn' as const,
            text: `*File:* \`${filename}\``
          },
          {
            type: 'mrkdwn' as const,
            text: `*Model Version:* \`${modelVersion}\``
          }
        ]
      },
      {
        type: 'divider' as const
      },
      {
        type: 'section' as const,
        fields: [
          {
            type: 'mrkdwn' as const,
            text: '*Species Identification*'
          },
          {
            type: 'mrkdwn' as const,
            text: '*Confidence Score*'
          }
        ]
      },
      ...topThree.map(p => ({
        type: 'section' as const,
        fields: [
          {
            type: 'mrkdwn' as const,
            text: `*${p.species}*`
          },
          {
            type: 'mrkdwn' as const,
            text: `\`${Math.round(p.confidence * 100)}%\``
          }
        ]
      })),
      {
        type: 'divider' as const
      },
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: '*Is the top prediction correct?*'
        }
      },
      {
        type: 'actions' as const,
        elements: [
          {
            type: 'button' as const,
            text: {
              type: 'plain_text' as const,
              text: `✅ Yes, it's a ${topSpecies}`,
              emoji: true
            },
            style: 'primary' as const,
            value: JSON.stringify({
              action: 'correct',
              topSpecies,
              modelVersion,
              filename,
              thread_ts: threadTs
            }),
            action_id: 'feedback_correct'
          }
        ]
      },
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: 'If not, select the correct species from this list. Your selection is your submission.'
        },
        accessory: {
          type: 'static_select' as const,
          placeholder: {
            type: 'plain_text' as const,
            text: 'Select correct species...',
            emoji: true
          },
          options: selectOptions,
          action_id: 'feedback_incorrect'
        }
      }
    ];

    await client.chat.postMessage({
      channel: event.channel_id,
      thread_ts: event.ts,
      text: `AI analysis complete for ${event.file.name}`,
      blocks,
    });
  } catch (error) {
    console.error('Error invoking AI Lambda:', error);
    await client.chat.postMessage({
      channel: event.channel_id,
      thread_ts: event.ts,
      text: 'Error processing your image. The AI analysis failed. Please try again.',
    });
  }
};

app.event('file_shared', file_sharedHandler);

// Feedback action handlers
const feedbackCorrectHandler = async (args: any) => {
  const { ack, body, client } = args;
  await ack();

  const { actions } = body;
  const valueData: FeedbackData = JSON.parse(actions[0].value);
  const { topSpecies, modelVersion, thread_ts, filename } = valueData;
  const channelId = body.channel.id;
  const isCorrect = true;
  const correctedSpecies = null;
  const feedbackId = uuidv4();
  const timestamp = Date.now();

  const pgClient = new Client({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.DB_NAME || 'audubon_feedback',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await pgClient.connect();

    const query = `
      INSERT INTO feedback (feedback_id, slack_message_id, slack_user_id, model_version, is_correct, top_prediction, corrected_species, zip_code, comments, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const queryValues = [
      feedbackId,
      thread_ts,
      body.user.id,
      modelVersion,
      isCorrect,
      topSpecies,
      correctedSpecies,
      null,
      null,
      timestamp,
    ];

    await pgClient.query(query, queryValues);

    await pgClient.end();

    await client.chat.postMessage({
      channel: channelId,
      thread_ts,
      text: '✅ Thank you! Your feedback has been recorded.',
    });
  } catch (error) {
    console.error('Error storing feedback in RDS:', error);
    if (pgClient) {
      await pgClient.end();
    }
    await client.chat.postMessage({
      channel: channelId,
      thread_ts,
      text: 'Error saving feedback. Please try again.',
    });
  }
};

app.action('feedback_correct', feedbackCorrectHandler);

const feedbackIncorrectHandler = async (args: any) => {
  const { ack, body, client } = args;
  await ack();

  const { actions } = body;
  const selectedOption = actions[0].selected_option;
  if (!selectedOption) return;

  const valueData: FeedbackData = JSON.parse(selectedOption.value);
  const { topSpecies, correctedSpecies, modelVersion, thread_ts, filename } = valueData;
  const channelId = body.channel.id;
  const isCorrect = false;
  const feedbackId = uuidv4();
  const timestamp = Date.now();

  const pgClient = new Client({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.DB_NAME || 'audubon_feedback',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await pgClient.connect();

    const query = `
      INSERT INTO feedback (feedback_id, slack_message_id, slack_user_id, model_version, is_correct, top_prediction, corrected_species, zip_code, comments, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const queryValues = [
      feedbackId,
      thread_ts,
      body.user.id,
      modelVersion,
      isCorrect,
      topSpecies,
      correctedSpecies,
      null,
      null,
      timestamp,
    ];

    await pgClient.query(query, queryValues);

    await pgClient.end();

    await client.chat.postMessage({
      channel: channelId,
      thread_ts,
      text: '✅ Thank you! Your feedback has been recorded.',
    });
  } catch (error) {
    console.error('Error storing feedback in RDS:', error);
    if (pgClient) {
      await pgClient.end();
    }
    await client.chat.postMessage({
      channel: channelId,
      thread_ts,
      text: 'Error saving feedback. Please try again.',
    });
  }
};

app.action('feedback_incorrect', feedbackIncorrectHandler);

// Lambda handler for API Gateway
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<LambdaResponse> => {
  console.log('Lambda invoked with event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  if (event.httpMethod !== 'POST') {
    console.log(`Unsupported HTTP method: ${event.httpMethod}`);
    return {
      statusCode: 404,
      body: 'Not found',
    };
  }

  console.log('Processing POST request');

  let rawBody: string;
  if (event.isBase64Encoded) {
    rawBody = Buffer.from(event.body, 'base64').toString('utf-8');
  } else {
    rawBody = event.body;
  }

  const headers = event.headers || {};

  try {
    // Verify Slack signature - handle both uppercase and lowercase header names
    const timestamp = headers['x-slack-request-timestamp'] || headers['X-Slack-Request-Timestamp'];
    const signature = headers['x-slack-signature'] || headers['X-Slack-Signature'];

    if (timestamp && signature) {
      const signingSecret = process.env.SLACK_SIGNING_SECRET;
      if (!signingSecret) {
        console.error('SLACK_SIGNING_SECRET not configured');
        return {
          statusCode: 500,
          body: 'Server configuration error',
        };
      }

      const isValidSignature = verifySlackSignature(signingSecret, timestamp, rawBody, signature);
      if (!isValidSignature) {
        console.log('Invalid Slack signature');
        return {
          statusCode: 401,
          body: 'Unauthorized'
        };
      }
      console.log('Slack signature verified successfully');
    } else {
      console.log('No Slack signature headers present (likely test request)');
      // For testing without headers, proceed but log warning
    }

    const slackEvent = JSON.parse(rawBody);

    if (slackEvent.type === 'url_verification') {
      console.log('Handling URL verification');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: slackEvent.challenge
      };
    }

    if (slackEvent.type === 'event_callback') {
      const innerEvent = slackEvent.event;
      if (innerEvent.type === 'file_shared') {
        const client = new WebClient(process.env.SLACK_BOT_TOKEN);
        await file_sharedHandler({ event: innerEvent, client });
      }
    }

    return {
      statusCode: 200,
      body: 'OK'
    };
  } catch (error: any) {
    console.error('Detailed error in handler:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      eventBody: rawBody ? rawBody.substring(0, 500) + '...' : 'No body'
    });
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};

// For local testing
if (require.main === module) {
  (async () => {
    await app.start(3000);
    console.log('⚡️ Bolt app is running on port 3000!');
  })();
}

export { file_sharedHandler, feedbackCorrectHandler, feedbackIncorrectHandler };