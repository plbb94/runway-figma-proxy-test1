export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, prompt } = req.body;
    console.log('【收到请求】imageUrl:', imageUrl);
    console.log('【收到请求】prompt:', prompt);

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl' });
    }

    const apiKey = process.env.RUNWAY_API_KEY;
    console.log('【使用的密钥】开头:', apiKey ? apiKey.substring(0, 10) : 'NOT FOUND');

    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify({
        model: 'gen4.5',
        promptImage: imageUrl,
        promptText: prompt || 'Make this image move',
        ratio: '1280:720',
        duration: 5
      })
    });

    const data = await response.json();
    console.log('【Runway返回状态】:', response.status);
    console.log('【Runway返回数据】:', data);

    // 直接把完整错误信息返回给插件
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Runway API错误: 状态码 ${response.status}`,
        message: data.message || data.error || '无具体信息',
        details: data
      });
    }

    return res.status(200).json({ taskId: data.id });

  } catch (error) {
    console.error('【代理服务器崩溃】:', error);
    return res.status(500).json({
      error: '代理服务器错误',
      message: error.message,
      stack: error.stack
    });
  }
}
