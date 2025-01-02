export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/') {
      // 首页，返回前端 HTML 页面
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LLAMA AI 服务</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                #chat-area {
                    width: 80%;
                    height: 400px;
                    padding: 10px;
                    border: 1px solid #ccc;
                    overflow-y: auto;
                    margin: 20px auto;
                    background-color: #f9f9f9;
                }
                #question-input {
                    width: 70%;
                    height: 30px;
                    padding: 10px;
                    font-size: 16px;
                    margin: 10px auto;
                    display: block;
                }
                #send-btn {
                    width: 100px;
                    height: 30px;
                    background-color: #4CAF50;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px auto;
                    display: block;
                }
                #send-btn:disabled {
                    background-color: #9e9e9e;
                    cursor: not-allowed;
                }
                #send-btn:hover:not(:disabled) {
                    background-color: #3e8e41;
                }
                .lmbox div {
                  visibility: hidden;
                  position: fixed;
                  z-index: 75;
                  text-align: center;
                  justify-content: center;
                  align-items: center;
              }
              
              .lmbox div:before {
                  content: '';
                  position: fixed;
                  top: 0;
                  right: 0;
                  bottom: 0;
                  left: 0;
                  z-index: 74;
                  background-color: rgba(0, 0, 0, 0);
                  transition: all 0.5s;
              }
              
              .lmbox div img {
                  position: absolute;
                  z-index: 77;
                  max-width: 100%;
                  max-height: 100%;
                  margin-left: -9999px;
                  opacity: 0;
                  transition-property: opacity;
                  transition-duration: 0.5s, 0.2s;
                  transition-timing-function: ease-in-out, ease-out;
              }
              
              .lmbox div:target {
                  visibility: visible;
              }
              
              .lmbox div:target:before {
                  background-color: rgba(0, 0, 0, 0.9);
              }
              
              .lmbox div:target img {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  margin-left: 0px;
                  opacity: 1;
              }
              
            </style>
        </head>
        <body>
            <h1>LLAMA AI 服务</h1>
            <div id="service-selector">
                <button id="chat-btn">AI对话</button>
                <button id="image-btn">图片生成</button>
                <button id="translate-btn">文本翻译</button>
            </div>
            <div id="chat-area"></div>
            <input id="question-input" type="text" placeholder="输入内容">
            <button id="send-btn">发送</button>

            <script>
                const chatArea = document.getElementById('chat-area');
                const questionInput = document.getElementById('question-input');
                const sendBtn = document.getElementById('send-btn');

                document.getElementById('chat-btn').addEventListener('click', () => setMode('chat'));
                document.getElementById('image-btn').addEventListener('click', () => setMode('image'));
                document.getElementById('translate-btn').addEventListener('click', () => setMode('translate'));

                let currentMode = 'chat';

                function setMode(mode) {
                    currentMode = mode;
                    questionInput.placeholder = mode === 'chat' ? '输入您的问题' : mode === 'image' ? '描述您想要生成的图片' : '输入要翻译的文本';
                }

                sendBtn.addEventListener('click', async () => {
                  const input = questionInput.value.trim();
                  if (!input) return;
              
                  sendBtn.disabled = true;
                  chatArea.innerHTML += \`<p style="color: green;">Me: \${input}</p>\`;
              
                  try {
                      if (currentMode === 'chat') {
                          const response = await fetch('/api/ask', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ question: input })
                          });
                          const data = await response.json();
                          const aiResponse = data[0].response.response;
                          chatArea.innerHTML += \`<p style="color: blue;">AI: \${aiResponse}</p>\`;
                      } else if (currentMode === 'translate') {
                          const response = await fetch('/api/translate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: input, source_lang: 'zh', target_lang: 'en' })
                          });
                          const data = await response.json();
                          const translatedText = data.translated_text;
                          chatArea.innerHTML += \`<p style="color: blue;">Translated: \${translatedText}</p>\`;
                      } else if (currentMode === 'image') {
                          const translateResponse = await fetch('/api/translate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: input, source_lang: 'zh', target_lang: 'en' })
                          });
                          const translationData = await translateResponse.json();
                          const prompt = translationData.translated_text;
              
                          const response = await fetch('/api/generate-image', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ prompt })
                          });
              
                          if (!response.ok) {
                              throw new Error('图片生成失败，请稍后再试！');
                          }
              
                          const blob = await response.blob();
                          const imageUrl = URL.createObjectURL(blob);
              
                          // 动态生成缩略图和原图预览
                          const imageId = \`image\${Date.now()}\`; // 唯一ID
              
                          const imageContainer = document.createElement('div');
                          imageContainer.innerHTML = \`
                              <a href="#\${imageId}">
                                  <img src="\${imageUrl}" alt="缩略图" style="max-width: 200px; border: 1px solid #ccc; margin: 10px;" />
                              </a>
                              <a href="#_" class="lmbox"><div id="\${imageId}" class="lmbox">
                                  <img src="\${imageUrl}" alt="原图预览" />
                              </div></a>
                          \`;
              
                          chatArea.appendChild(imageContainer);
                      }
                  } catch (error) {
                      chatArea.innerHTML += \`<p style="color: red;">Error: \${error.message}</p>\`;
                  } finally {
                      sendBtn.disabled = false;
                      questionInput.value = '';
                  }
              });
              
              
            </script>
        </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html'
          }
        }
      );
    } else if (pathname === '/api/ask') {
      const { question } = await request.json();
      const chat = {
        messages: [
          { role: 'system', content: '你是一个中国的AI助理，可以回答任何中文问题。' },
          { role: 'user', content: question }
        ]
      };
      const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', chat);
      return new Response(JSON.stringify([{ inputs: chat, response }]), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else if (pathname === '/api/generate-image') {
      const { prompt } = await request.json();
      const inputs = { prompt: prompt };
      const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', inputs);
      return new Response(response, {
        headers: {
          'content-type': 'image/png'
        }
      });
    } else if (pathname === '/api/translate') {
      const { text, source_lang = 'chinese', target_lang ="english"} = await request.json();
      if (!text || typeof text !== 'string' || !target_lang) {
        return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
      }
      const response = await env.AI.run('@cf/meta/m2m100-1.2b', { text, source_lang, target_lang });
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response('Not Found', { status: 404 });
    }
  }
};
