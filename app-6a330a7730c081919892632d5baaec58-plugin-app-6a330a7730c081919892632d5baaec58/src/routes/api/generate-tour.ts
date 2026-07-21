import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/generate-tour')({
  server: { handlers: { POST: async ({ request }) => {
    const body = await request.json().catch(() => ({})) as { title?: string; apiKey?: string }
    const apiKey = body.apiKey?.trim() || process.env.OPENAI_API_KEY
    if (!apiKey) return Response.json({ error: 'Add an OpenAI API key to generate an AI click path.' }, { status: 428 })

    const prompt = `Create exactly 3 concise guided product-tour steps for ${body.title || 'a product demo'}. Return JSON with steps: title, copy, target. target must be el-revenue, el-activation, or el-project.`
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5.6', input: prompt, text: { format: { type: 'json_object' } } }),
      })
      const data = await response.json() as { output_text?: string; error?: { message?: string } }
      if (!response.ok) return Response.json({ error: data.error?.message || 'OpenAI could not generate a click path.' }, { status: response.status })
      const parsed = JSON.parse(data.output_text || '{}')
      if (!Array.isArray(parsed.steps)) throw new Error('The AI response did not include tour steps.')
      return Response.json({ steps: parsed.steps, source: 'openai' })
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : 'Unable to generate a click path.' }, { status: 502 })
    }
  } } },
})
