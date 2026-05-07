export default async function handler(req, res) {
  // 处理跨域
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
    console.log('收到请求:', { imageUrl, prompt });

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl' });
    }

    console.log('调用Runway API，密钥开头:', process.env.RUNWAY_API_KEY?.substring(0, 5));

    const runwayResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify({
        model: 'gen3', // 换成更稳定的gen3模型
        promptImage: imageUrl,
        promptText: prompt || 'Make this image move naturally',
        ratio: '1280:720',
        duration: 5
      })
    });

    const runwayData = await runwayResponse.json();
    console.log('Runway API返回:', runwayResponse.status, runwayData);

    if (!runwayResponse.ok) {
      return res.status(runwayResponse.status).json({ 
        error: `Runway API错误: ${runwayData.message || '未知错误'}`,
        status: runwayResponse.status,
        details: runwayData 
      });
    }

    return res.status(200).json({ taskId: runwayData.id });

  } catch (error) {
    console.error('代理服务器错误:', error);
    return res.status(500).json({ error: '服务器错误', message: error.message });
  }
}
