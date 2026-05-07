export default async function handler(req, res) {
  // 修复CORS问题，允许所有来源
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, prompt } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl' });
    }

    // 调用Runway API
    const runwayResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify({
        model: 'gen4.5',
        promptImage: imageUrl,
        promptText: prompt || 'Make this image move naturally and smoothly',
        ratio: '1280:720',
        duration: 5
      })
    });

    const runwayData = await runwayResponse.json();

    if (!runwayResponse.ok) {
      return res.status(runwayResponse.status).json({ 
        error: runwayData.message || 'Runway API error',
        details: runwayData 
      });
    }

    // 返回任务ID，让前端自己轮询（解决Vercel 10秒超时问题）
    return res.status(200).json({ taskId: runwayData.id });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
