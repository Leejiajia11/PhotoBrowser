# 照片浏览器

## 简介
本项目是重庆大学web开发课程的第三次实验，开发一个基于web的图片浏览系统，以实现照片可在后台上传到服务器，在浏览器端，可以按照片拍摄时间顺序、照片拍摄地点等方式查询照片，也可顺序或倒序翻看所有照片，同时增设了自动获取图片拍摄时间地点、删除和保存图片到本地的相关功能。该项目旨在提供一个用户友好的界面，帮助用户通过进行高效的图片搜索、查看和管理。

## 功能特性
- **照片上传**: 用户可以通过表单上传照片，同时支持EXIF数据的提取。
- **EXIF信息提取**: 自动获取照片的拍摄时间和拍摄地点，并填入相应的输入框。
- **照片查询**: 提供基于拍摄时间和位置的搜索功能。
- **照片展示**: 显示已上传的照片，包括缩略图和相关信息。
- **照片删除**: 用户可删除不再需要的照片。
- **照片下载**: 支持从应用程序直接下载照片。
- **模态框查看**: 双击缩略图以放大照片，并提供下载选项。

## 技术栈
- HTML: 用于构建页面结构。
- CSS: 用于页面样式设计。
- JavaScript: 用于实现客户端逻辑和与服务器的交互。
- Fetch API: 用于发送HTTP请求。
- exifr.js: 用于提取照片的EXIF信息。

## 目录结构
```
/public
    /uploads            # 存放上传照片的目录
    /app.js             # 主应用程序文件
    /styles.css         # 页面样式表    
    /index.html         # 前端文件
/package.json
/package-lock.json
/server.js              #后端服务器代码
/photos.json            # 模拟数据库文件

```

## 如何运行
1. 确保已安装 [Node.js](https://nodejs.org/)。
2. 克隆此仓库到本地:
   ```bash
   git clone https://github.com/yourusername/photo-browser.git
   cd photo-browser
   ```
3. 安装依赖:
   ```bash
   npm install
   ```
4. 启动服务器:
   ```bash
   node app.js
   ```
5. 在浏览器中访问 `http://localhost:3000` 查看应用。


## 使用说明
- **上传照片**: 在上传区域选择文件、输入拍摄时间和地点，然后点击“上传”按钮。
- **查询照片**: 输入查询条件并点击“查询”按钮。
- **查看和下载照片**: 点击缩略图查看大图，并可选择“保存在本地”进行下载。
- **删除照片**: 在相应的照片上点击删除按钮。


## 部分代码说明

### 1. 照片上传
- 用户点击“选择照片”按钮，选择要上传的照片。
- 系统会尝试解析EXIF数据:
  - 如果成功提取到拍摄时间，会自动填充该字段。
  - 如果提取到GPS位置信息，会自动填充拍摄地点；如果没有，会弹出提示并清空地点输入框。
- 用户填写完其他表单字段后，提交表单。
- 上传过程中会显示上传状态，上传成功或失败均会进行相应提示。

```javascript
// 监听上传表单的提交事件
document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();  // 阻止默认提交行为
    const formData = new FormData(this);  // 创建 FormData 对象

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        // 处理返回结果...
    } catch (error) {
        console.error('Upload failed:', error);
        alert('An error occurred during the upload process.');
    }
});
```

### 2. 照片查询
- 用户可以在搜索框中输入想要查询的地点或拍摄时间，点击“查询”按钮。
- 查询结果将被展示在照片库中。

```javascript
document.getElementById('searchButton').addEventListener('click', async function () {
    const locationQuery = document.getElementById('searchLocation').value;
    const timeQuery = document.getElementById('searchDate').value;

    // 发送请求以获取符合条件的照片
    // 处理返回结果...
});
```

### 3. 照片排序
- 提供“按时间升序”和“按时间降序”两个按钮来切换照片的显示顺序。

```javascript
document.getElementById('orderAsc').addEventListener('click', () => loadPhotos('asc'));
document.getElementById('orderDesc').addEventListener('click', () => loadPhotos('desc'));
```

### 4. 查看和操作照片
- 用户可以双击照片以在模态框中查看更大图像。
- 用户可以通过点击“删除”按钮来删除照片，或通过“下载”按钮下载照片。

```javascript
async function deletePhoto(photoPath) {
    // 发送 DELETE 请求以删除照片
}
```

### 5. 模态框功能
- 在模态框中，可以查看放大的图片，关闭模态框的方式包括点击关闭按钮或模态框背景。

```javascript
const modal = document.getElementById('photoModal');
// 点击关闭按钮隐藏模态框
closeModal.onclick = function () {
    modal.style.display = "none";
};
// 点击模态框背景也关闭
modal.onclick = function () {
    modal.style.display = "none";
}
```


## 注意事项
- 确保你已经安装了`exifr.js`库，以便能够提取EXIF信息。
- 请确保后端API正确设置并可访问，以便能够上传和查询照片。

  
## 贡献
欢迎任何形式的贡献！如果您发现了bug或有功能建议，请提交issue。欢迎对本项目进行贡献！您可以通过提交问题报告或拉取请求来参与。

## 联系信息
如有疑问，请联系开发者：1792242434@qq.com
