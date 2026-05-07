export default async function handler(req, res) {
  // 允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    const { imageUrl, prompt } = req.body;

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
        promptText: prompt || '让这个画面动起来，自然流畅',
        ratio: '1280:720',
        duration: 5
      })
    });

    const runwayData = await runwayResponse.json();

    if (!runwayResponse.ok) {
      return res.status(runwayResponse.status).json({ error: runwayData });
    }

    // 轮询任务状态直到完成
    let taskId = runwayData.id;
    let taskStatus = runwayData.status;
    let taskOutput = null;

    while (taskStatus === 'PENDING' || taskStatus === 'RUNNING') {
      // 等待3秒再轮询
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
          'X-Runway-Version': '2024-11-06'
        }
      });

      const statusData = await statusResponse.json();
      taskStatus = statusData.status;
      taskOutput = statusData.output;
    }

    if (taskStatus === 'SUCCEEDED' && taskOutput) {
      return res.status(200).json({ videoUrl: taskOutput[0] });
    } else {
      return res.status(500).json({ error: '视频生成失败', taskStatus });
    }

  } catch (error) {
    console.error('代理服务器错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
