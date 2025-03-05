const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

async function generateIco() {
  try {
    // 源文件路径
    const sourceFile = path.join(__dirname, 'favicon.svg');
    
    // 输出目录
    const outputDir = path.join(__dirname, 'output');
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 生成16x16的PNG
    const png16 = path.join(outputDir, 'favicon-16.png');
    await sharp(sourceFile)
      .resize(16, 16)
      .png()
      .toFile(png16);
    
    // 生成32x32的PNG
    const png32 = path.join(outputDir, 'favicon-32.png');
    await sharp(sourceFile)
      .resize(32, 32)
      .png()
      .toFile(png32);
    
    // 使用npm包ico-to-png来生成ico文件
    console.log('正在安装png-to-ico...');
    execSync('npm install png-to-ico --save-dev', { stdio: 'inherit' });
    
    // 动态导入png-to-ico
    const pngToIco = require('png-to-ico');
    
    // 生成ico文件
    console.log('正在生成favicon.ico...');
    const icoBuffer = await pngToIco([png16, png32]);
    
    // 写入ico文件
    fs.writeFileSync(path.join(outputDir, 'favicon.ico'), icoBuffer);
    console.log('favicon.ico生成成功！');
    
    // 复制到web/public目录
    fs.copyFileSync(
      path.join(outputDir, 'favicon.ico'), 
      path.join(__dirname, '../../web/public/favicon.ico')
    );
    console.log('favicon.ico已复制到web/public目录');
  } catch (error) {
    console.error('生成ico文件时出错:', error);
  }
}

// 执行生成
generateIco(); 