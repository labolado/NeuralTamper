// 这个文件将被用作沙箱环境的基础
(function() {
  // 在这里定义你想要暴露给用户脚本的 API
  const unsafeWindow = window;
  
  // 执行用户脚本
  function executeUserScript(code) {
    try {
      new Function(code)();
    } catch (error) {
      console.error('Error executing user script:', error);
    }
  }

  // 监听来自内容脚本的消息
  window.addEventListener('message', function(event) {
    if (event.data.type === 'executeUserScript') {
      executeUserScript(event.data.code);
    }
  }, false);
})();
