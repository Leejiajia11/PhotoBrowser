// 处理照片上传
// 监听上传表单的提交事件
document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();  // 阻止表单的默认提交行为

    const formData = new FormData(this);  // 创建 FormData 对象，包含表单数据

    try {
        // 使用 fetch 发送 POST 请求，将表单数据发送到服务器
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData  // 发送表单数据，包括照片、拍摄时间和拍摄地点
        });

        const result = await response.json();  // 获取服务器返回的 JSON 数据

        if (response.ok) {
            alert('Photo upload successful!');  // 如果上传成功，弹出成功提示
            this.reset();  // 重置表单内容
        } else {
            alert(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload failed:', error);  // 捕获错误并打印到控制台
        alert('An error occurred during the upload process.');
    }
});


// 点击上传按钮进行EXIF提取和提交
document.getElementById('uploadButton').addEventListener('click', async function () {
    const fileInput = document.getElementById('photoInput');
    const file = fileInput.files[0];
    const captureTimeInput = document.getElementById('captureTime');
    const captureLocationInput = document.getElementById('captureLocation');

    if (!file) {
        alert('Please select a photo first');
        return;
    }

    const reader = new FileReader();

    reader.onload = async function (event) {
        const buffer = event.target.result;

        try {
            // 尝试解析EXIF信息
            const exifData = await exifr.parse(buffer);
            console.log('EXIF Data:', exifData);  // 打印提取到的EXIF数据以供调试

            // 检查是否成功提取到时间信息
            if (exifData?.DateTimeOriginal) {
                const date = new Date(exifData.DateTimeOriginal);
                captureTimeInput.value = date.toISOString().split('T')[0]; // 自动填充日期
            } else {
                console.log('There is no time information in the EXIF data.');
            }

            // 检查是否成功提取到位置信息
            if (exifData?.latitude && exifData?.longitude) {
                captureLocationInput.value = `Lat: ${exifData.latitude}, Lng: ${exifData.longitude}`; // 自动填充地点
            } else {
                console.log('There is no GPS location information in the EXIF data.');
                captureLocationInput.value = ''; // 如果没有EXIF位置信息，清空输入框
                alert('The photo does not contain GPS location information, please enter the location manually.');
            }

            // 执行上传操作
            const form = document.getElementById('uploadForm');
            const formData = new FormData(form);

            fetch('/upload', {
                method: 'POST',
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert(`Upload failed: ${data.error}`);
                    } else {
                        alert('Photo upload successful!');
                        console.log('Upload successful photo information:', data.photo);
                    }
                })
                .catch(error => {
                    console.error('An error occurred while uploading the photo:', error);
                    alert('An error occurred while uploading the photo.');
                });

        } catch (error) {
            console.error('Error occurred while extracting EXIF information:', error);
            alert('Unable to extract the time or location information from the photo, please enter manually.');
        }
    };

    reader.readAsArrayBuffer(file);
});

// 处理照片查询
document.getElementById('searchButton').addEventListener('click', async function () {
    const locationQuery = document.getElementById('searchLocation').value;
    const timeQuery = document.getElementById('searchDate').value;

    const query = new URLSearchParams({
        location: locationQuery || '',
        time: timeQuery || ''
    });

    try {
        const response = await fetch(`/photos?${query.toString()}`);
        const photos = await response.json();
        displayPhotos(photos);
    } catch (error) {
        console.error('Query failed:', error);
        alert('An error occurred during the query process');
    }
});

// 绑定按钮点击事件，根据按钮选择加载顺序
document.getElementById('orderAsc').addEventListener('click', () => loadPhotos('asc'));
document.getElementById('orderDesc').addEventListener('click', () => loadPhotos('desc'));

// 加载并按拍摄时间排序
async function loadPhotos(order = 'asc') {
    try {
        const response = await fetch(`/photos`); // 无需传 `order` 参数，让前端自行排序
        const photos = await response.json();

        // 按 `captureTime` 排序
        photos.sort((a, b) => {
            const dateA = new Date(a.captureTime);
            const dateB = new Date(b.captureTime);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });

        displayPhotos(photos);
    } catch (error) {
        console.error('Failed to load photo:', error);
        alert('An error occurred while loading the photo');
    }
}


// 显示照片
function displayPhotos(photos) {
    const gallery = document.getElementById('photoGallery');
    gallery.innerHTML = '';

    photos.forEach(photo => {
        const photoContainer = document.createElement('div');
        photoContainer.className = 'photo-item';

        // 照片显示
        const imgElement = document.createElement('img');
        imgElement.src = photo.path;
        imgElement.alt = photo.captureLocation;

        // 照片信息显示
        const infoElement = document.createElement('p');
        infoElement.textContent = `${new Date(photo.captureTime).toISOString().substring(0, 10)} - ${photo.captureLocation}`;


        // 删除按钮
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'delete';
        deleteButton.addEventListener('click', function () {
            deletePhoto(photo.path); // 绑定删除功能
        });

        // 下载按钮
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'download';
        downloadButton.addEventListener('click', function () {
            downloadPhoto(photo.path); // 绑定下载功能
        });
        
        // 组合各元素到照片容器
        photoContainer.appendChild(imgElement);
        photoContainer.appendChild(infoElement);
        photoContainer.appendChild(deleteButton);
        photoContainer.appendChild(downloadButton);
        gallery.appendChild(photoContainer);

        // 添加双击事件监听器，放大照片
        imgElement.addEventListener('dblclick', function () {
            openModal(photo.path);
        });
    });
}

// 删除照片功能
async function deletePhoto(photoPath) {
    try {
        // 发送带有文件路径的 DELETE 请求
        const response = await fetch(`/upload?filename=${encodeURIComponent(photoPath)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Photo deleted successfully!');
            loadPhotos(); // 重新加载照片列表
        } else {
            const errorData = await response.json();
            alert(`Deletion failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Failed to delete photo:', error);
        alert('Photo deleted successfully!');
    }
}

// 下载照片功能
function downloadPhoto(photoPath) {
    const a = document.createElement('a');
    a.href = photoPath;
    a.download = photoPath.split('/').pop(); // 提取文件名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// 打开模态框显示放大的图片
function openModal(imageSrc) {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('imgModal');
    modal.style.display = "block";
    modalImg.src = imageSrc;  // 设置放大的图片路径
}

// 关闭模态框
const modal = document.getElementById('photoModal');
const closeModal = document.querySelector('.close');
const downloadButton = document.getElementById("download");

// 点击关闭按钮时隐藏模态框
closeModal.onclick = function () {
    modal.style.display = "none";
};

// 如果用户点击模态框的背景也关闭模态框
modal.onclick = function () {
    modal.style.display = "none";
}

// 监听保存按钮的点击事件
downloadButton.addEventListener("click", function () {
    // 获取模态框中显示的图片的源地址
    const imgSrc = imgModal.src;

    // 创建一个临时链接元素
    const link = document.createElement("a");

    // 设置链接的下载属性为图片文件名
    link.download = "downloaded_image"; // 你可以根据需要更改文件名

    // 设置链接的 href 为图片的源地址
    link.href = imgSrc;

    // 将链接元素添加到文档中（不可见）
    document.body.appendChild(link);

    // 触发链接的点击事件，开始下载
    link.click();

    // 下载完成后移除链接元素
    document.body.removeChild(link);
});

// 初次加载时显示所有照片
window.addEventListener('load', () => {
    loadPhotos('asc');
});
