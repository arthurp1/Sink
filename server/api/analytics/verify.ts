export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { gaMeasurementId } = config.public
  const apiSecret = config.gaApiSecret

  // Check for missing configuration
  const configErrors = []

  if (!gaMeasurementId) {
    configErrors.push('Missing GA_MEASUREMENT_ID environment variable')
  }

  if (!apiSecret) {
    configErrors.push('Missing GA_API_SECRET environment variable')
  }

  if (configErrors.length > 0) {
    return {
      success: false,
      message: 'Google Analytics configuration is incomplete',
      errors: configErrors,
      help: 'Please add the missing environment variables to your .env file or hosting platform',
    }
  }

  try {
    // Send a test event to GA4
    const analyticsEndpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${gaMeasurementId}&api_secret=${apiSecret}`

    const testPayload = {
      client_id: 'test_client_id',
      events: [{
        name: 'test_event',
        params: {
          test_param: 'verification_test',
          timestamp: new Date().toISOString(),
        },
      }],
    }

    const response = await fetch(analyticsEndpoint, {
      method: 'POST',
      body: JSON.stringify(testPayload),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Check response status and body
    const responseStatus = response.status
    let responseBody = {}

    try {
      // GA4 typically returns an empty 2xx response on success
      // But we'll try to parse a JSON response if there is one
      const text = await response.text()
      if (text && text.trim() !== '') {
        responseBody = JSON.parse(text)
      }
    }
    catch (_e) {
      // Ignore parsing errors
    }

    if (!response.ok) {
      return {
        success: false,
        status: responseStatus,
        statusText: response.statusText,
        response: responseBody,
        message: 'Failed to send test event to Google Analytics',
        details: 'The GA4 endpoint returned an error. Check your Measurement ID and API Secret.',
      }
    }

    return {
      success: true,
      message: 'Successfully sent test event to Google Analytics',
      status: responseStatus,
      config: {
        measurementId: gaMeasurementId,
        apiSecretConfigured: !!apiSecret,
        domainConfigured: !!config.public.domainName,
      },
    }
  }
  catch (error: any) {
    // Handle network or other errors
    return {
      success: false,
      message: 'Error verifying Google Analytics configuration',
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }
})
