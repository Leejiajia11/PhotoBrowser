// ������Ƭ�ϴ�
// �����ϴ������ύ�¼�
document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();  // ��ֹ����Ĭ���ύ��Ϊ

    const formData = new FormData(this);  // ���� FormData ���󣬰���������

    try {
        // ʹ�� fetch ���� POST ���󣬽������ݷ��͵�������
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData  // ���ͱ����ݣ�������Ƭ������ʱ�������ص�
        });

        const result = await response.json();  // ��ȡ���������ص� JSON ����

        if (response.ok) {
            alert('Photo upload successful!');  // ����ϴ��ɹ��������ɹ���ʾ
            this.reset();  // ���ñ�����
        } else {
            alert(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload failed:', error);  // ������󲢴�ӡ������̨
        alert('An error occurred during the upload process.');
    }
});


// ����ϴ���ť����EXIF��ȡ���ύ
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
            // ���Խ���EXIF��Ϣ
            const exifData = await exifr.parse(buffer);
            console.log('EXIF Data:', exifData);  // ��ӡ��ȡ����EXIF�����Թ�����

            // ����Ƿ�ɹ���ȡ��ʱ����Ϣ
            if (exifData?.DateTimeOriginal) {
                const date = new Date(exifData.DateTimeOriginal);
                captureTimeInput.value = date.toISOString().split('T')[0]; // �Զ��������
            } else {
                console.log('There is no time information in the EXIF data.');
            }

            // ����Ƿ�ɹ���ȡ��λ����Ϣ
            if (exifData?.latitude && exifData?.longitude) {
                captureLocationInput.value = `Lat: ${exifData.latitude}, Lng: ${exifData.longitude}`; // �Զ����ص�
            } else {
                console.log('There is no GPS location information in the EXIF data.');
                captureLocationInput.value = ''; // ���û��EXIFλ����Ϣ����������
                alert('The photo does not contain GPS location information, please enter the location manually.');
            }

            // ִ���ϴ�����
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

// ������Ƭ��ѯ
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

// �󶨰�ť����¼������ݰ�ťѡ�����˳��
document.getElementById('orderAsc').addEventListener('click', () => loadPhotos('asc'));
document.getElementById('orderDesc').addEventListener('click', () => loadPhotos('desc'));

// ���ز�������ʱ������
async function loadPhotos(order = 'asc') {
    try {
        const response = await fetch(`/photos`); // ���贫 `order` ��������ǰ����������
        const photos = await response.json();

        // �� `captureTime` ����
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


// ��ʾ��Ƭ
function displayPhotos(photos) {
    const gallery = document.getElementById('photoGallery');
    gallery.innerHTML = '';

    photos.forEach(photo => {
        const photoContainer = document.createElement('div');
        photoContainer.className = 'photo-item';

        // ��Ƭ��ʾ
        const imgElement = document.createElement('img');
        imgElement.src = photo.path;
        imgElement.alt = photo.captureLocation;

        // ��Ƭ��Ϣ��ʾ
        const infoElement = document.createElement('p');
        infoElement.textContent = `${new Date(photo.captureTime).toISOString().substring(0, 10)} - ${photo.captureLocation}`;


        // ɾ����ť
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'delete';
        deleteButton.addEventListener('click', function () {
            deletePhoto(photo.path); // ��ɾ������
        });

        // ���ذ�ť
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'download';
        downloadButton.addEventListener('click', function () {
            downloadPhoto(photo.path); // �����ع���
        });
        
        // ��ϸ�Ԫ�ص���Ƭ����
        photoContainer.appendChild(imgElement);
        photoContainer.appendChild(infoElement);
        photoContainer.appendChild(deleteButton);
        photoContainer.appendChild(downloadButton);
        gallery.appendChild(photoContainer);

        // ���˫���¼����������Ŵ���Ƭ
        imgElement.addEventListener('dblclick', function () {
            openModal(photo.path);
        });
    });
}

// ɾ����Ƭ����
async function deletePhoto(photoPath) {
    try {
        // ���ʹ����ļ�·���� DELETE ����
        const response = await fetch(`/upload?filename=${encodeURIComponent(photoPath)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Photo deleted successfully!');
            loadPhotos(); // ���¼�����Ƭ�б�
        } else {
            const errorData = await response.json();
            alert(`Deletion failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Failed to delete photo:', error);
        alert('Photo deleted successfully!');
    }
}

// ������Ƭ����
function downloadPhoto(photoPath) {
    const a = document.createElement('a');
    a.href = photoPath;
    a.download = photoPath.split('/').pop(); // ��ȡ�ļ���
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// ��ģ̬����ʾ�Ŵ��ͼƬ
function openModal(imageSrc) {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('imgModal');
    modal.style.display = "block";
    modalImg.src = imageSrc;  // ���÷Ŵ��ͼƬ·��
}

// �ر�ģ̬��
const modal = document.getElementById('photoModal');
const closeModal = document.querySelector('.close');
const downloadButton = document.getElementById("download");

// ����رհ�ťʱ����ģ̬��
closeModal.onclick = function () {
    modal.style.display = "none";
};

// ����û����ģ̬��ı���Ҳ�ر�ģ̬��
modal.onclick = function () {
    modal.style.display = "none";
}

// �������水ť�ĵ���¼�
downloadButton.addEventListener("click", function () {
    // ��ȡģ̬������ʾ��ͼƬ��Դ��ַ
    const imgSrc = imgModal.src;

    // ����һ����ʱ����Ԫ��
    const link = document.createElement("a");

    // �������ӵ���������ΪͼƬ�ļ���
    link.download = "downloaded_image"; // ����Ը�����Ҫ�����ļ���

    // �������ӵ� href ΪͼƬ��Դ��ַ
    link.href = imgSrc;

    // ������Ԫ����ӵ��ĵ��У����ɼ���
    document.body.appendChild(link);

    // �������ӵĵ���¼�����ʼ����
    link.click();

    // ������ɺ��Ƴ�����Ԫ��
    document.body.removeChild(link);
});

// ���μ���ʱ��ʾ������Ƭ
window.addEventListener('load', () => {
    loadPhotos('asc');
});
