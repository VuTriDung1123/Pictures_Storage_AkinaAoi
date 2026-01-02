// ================= CẤU HÌNH (Thay của bạn vào đây) =================
const CLOUD_NAME = "dfhzav3gf";      // Ví dụ: dxyz123
const UPLOAD_PRESET = "pictures_storage_akinaaoi";  // Ví dụ: kho_anh_cua_dung
// ===================================================================

// Lấy các phần tử từ HTML
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const previewContainer = document.getElementById('preview-container');
const previewImg = document.getElementById('preview-img');
const statusText = document.getElementById('status-text');
const galleryList = document.getElementById('gallery-list');

let fileToUpload = null;

// 1. Sự kiện khi chọn file
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileToUpload = file;
        
        // Hiện ảnh xem trước
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        // Bật nút upload
        uploadBtn.disabled = false;
        uploadBtn.innerText = "✨ Bắt đầu Upload ✨";
        statusText.innerText = "";
    }
});

// 2. Sự kiện khi bấm nút Upload
uploadBtn.addEventListener('click', async () => {
    if (!fileToUpload) return;

    // Chuyển trạng thái đang xử lý
    uploadBtn.disabled = true;
    uploadBtn.innerText = "Đang gửi lên mây... ☁️";
    statusText.innerText = "Vui lòng chờ xíu nhé...";

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.secure_url) {
            statusText.innerText = "Thành công rồi! 🎉";
            addResultToGallery(data.secure_url); // Thêm vào danh sách bên phải
            
            // Reset lại form upload
            uploadBtn.innerText = "✨ Upload tiếp ảnh khác ✨";
            fileInput.value = ""; // Xóa file trong input
        } else {
            throw new Error(data.error ? data.error.message : "Lỗi lạ lắm!");
        }

    } catch (error) {
        console.error(error);
        statusText.innerText = "Có lỗi xảy ra: " + error.message;
        uploadBtn.disabled = false;
        uploadBtn.innerText = "Thử lại";
    }
});

// 3. Hàm tạo ô kết quả bên cột Gallery
function addResultToGallery(url) {
    // Xóa dòng thông báo trống nếu có
    const emptyMsg = document.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    // Tạo HTML cho item mới
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gallery-item';

    itemDiv.innerHTML = `
        <img src="${url}" class="gallery-thumb" alt="thumb">
        <div class="gallery-info">
            <input type="text" value="${url}" readonly class="gallery-link">
            <button class="copy-mini-btn" onclick="copyToClipboard('${url}')">Copy Link</button>
        </div>
    `;

    // Thêm vào đầu danh sách
    galleryList.prepend(itemDiv);
}

// 4. Hàm hỗ trợ copy nhanh
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Đã copy link ảnh: " + text);
    });
}