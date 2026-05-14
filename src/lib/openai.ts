import OpenAI from 'openai';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // If no API key is present (e.g. during build time), use a dummy key 
  // to prevent the constructor from throwing.
  if (!apiKey && process.env.NODE_ENV === 'production') {
    return new OpenAI({
      apiKey: 'dummy_key_for_build_time',
    });
  }

  return new OpenAI({
    apiKey: apiKey || 'missing_api_key',
  });
};

export const openai = getOpenAIClient();
