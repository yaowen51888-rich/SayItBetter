const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');

// 修复 HTML 文件中的资源路径
function fixHTMLPaths(htmlFilePath) {
  let content = fs.readFileSync(htmlFilePath, 'utf8');

  // 将 ../../assets/ 替换为 assets/
  content = content.replace(/\.\.\/\.\.\/assets\//g, 'assets/');

  fs.writeFileSync(htmlFilePath, content, 'utf8');
}

// 复制并修复 HTML 文件
const optionsHtmlSource = path.join(distDir, 'src/options/index.html');
const optionsHtmlDest = path.join(distDir, 'options.html');

const popupHtmlSource = path.join(distDir, 'src/popup/index.html');
const popupHtmlDest = path.join(distDir, 'popup.html');

fs.copyFileSync(optionsHtmlSource, optionsHtmlDest);
fs.copyFileSync(popupHtmlSource, popupHtmlDest);

fixHTMLPaths(optionsHtmlDest);
fixHTMLPaths(popupHtmlDest);

console.log('✅ Fixed paths: popup.html, options.html');
console.log('✅ Corrected asset paths from ../../assets/ to assets/');
