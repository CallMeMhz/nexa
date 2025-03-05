const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

// 检查是否安装了sharp
try {
  require.resolve('sharp');
  console.log('Sharp库已安装，可以继续...');
} catch (e) {
  console.log('未找到Sharp库，正在安装...');
  try {
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    console.log('Sharp库安装成功！');
  } catch (error) {
    console.error('安装Sharp库失败:', error.message);
    process.exit(1);
  }
}

async function generateFavicons() {
  // 定义尺寸
  const sizes = [16, 32, 48, 64, 128, 192, 256];
  
  // 源文件路径
  const sourceFile = path.join(__dirname, 'favicon.svg');
  
  // 输出目录
  const outputDir = path.join(__dirname, 'output');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('开始生成不同尺寸的PNG文件...');
  
  // 生成不同尺寸的PNG
  const pngPromises = sizes.map(size => {
    const outputFile = path.join(outputDir, `favicon-${size}.png`);
    console.log(`生成 ${size}x${size} PNG...`);
    return sharp(sourceFile)
      .resize(size, size)
      .png()
      .toFile(outputFile)
      .then(() => {
        console.log(`${outputFile} 生成成功`);
        return { size, file: outputFile };
      })
      .catch(err => {
        console.error(`生成 ${size}x${size} PNG 失败:`, err);
        return null;
      });
  });
  
  // 等待所有PNG生成完成
  const results = await Promise.all(pngPromises);
  const validResults = results.filter(r => r !== null);
  
  if (validResults.length === 0) {
    console.error('没有成功生成任何PNG文件');
    return;
  }
  
  // 复制SVG到输出目录
  fs.copyFileSync(sourceFile, path.join(outputDir, 'favicon.svg'));
  console.log('SVG文件已复制到输出目录');
  
  // 生成HTML代码
  const htmlCode = `
<!-- 基本favicon -->
<link rel="icon" href="favicon.ico">

<!-- iOS设备 -->
<link rel="apple-touch-icon" sizes="180x180" href="favicon-192.png">

<!-- Android设备 -->
<link rel="icon" type="image/png" sizes="192x192" href="favicon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="favicon-256.png">

<!-- SVG图标 (现代浏览器) -->
<link rel="icon" type="image/svg+xml" href="favicon.svg">
  `;
  
  fs.writeFileSync(path.join(outputDir, 'favicon-html.txt'), htmlCode);
  console.log('HTML代码已生成');
  
  console.log('所有favicon文件已生成到:', outputDir);
}

// 执行生成
generateFavicons().catch(err => {
  console.error('生成favicon时出错:', err);
}); 