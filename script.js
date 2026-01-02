// ================= CẤU HÌNH (THAY CỦA BẠN VÀO) =================
const CLOUD_NAME = "dfhzav3gf";
const UPLOAD_PRESET = "pictures_storage_akinaaoi"; 
// ===============================================================

// Danh sách Tags cố định của bạn
const MY_TAGS = [
    "My confessions",
    "University projects",
    "Personal projects",
    "IT events",
    "Life and activity",
    "Language Certifications",
    "Technical Certifications"
];

// --- KHỞI TẠO BIẾN ---
const fileInput = document.getElementById('fileInput');
const previewList = document.getElementById('preview-list');
const uploadBtn = document.getElementById('uploadBtn');
const statusText = document.getElementById('status-text');
const galleryGrid = document.getElementById('gallery-list');
const filterTag = document.getElementById('filterTag');
const sortTime = document.getElementById('sortTime');
const totalImg = document.getElementById('total-img');
const clearLocalBtn = document.getElementById('clearLocalBtn');

// Biến lưu trữ file đang chờ upload
let filesQueue = []; 

// Biến lưu dữ liệu ảnh đã upload (Lấy từ LocalStorage nếu có)
let savedImages = JSON.parse(localStorage.getItem('my_anime_gallery')) || [];

// --- KHỞI TẠO GIAO DIỆN ---
init();

function init() {
    // 1. Đổ danh sách Tag vào Select Box lọc
    MY_TAGS.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.innerText = `🏷️ ${tag}`;
        filterTag.appendChild(option);
    });

    // 2. Render ảnh cũ nếu có
    renderGallery();
}

// --- XỬ LÝ CHỌN FILE ---
fileInput.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Giới hạn 10 ảnh
    if (filesQueue.length + newFiles.length > 10) {
        alert("Chỉ được up tối đa 10 ảnh một lúc thôi nha!");
        return;
    }

    newFiles.forEach(file => {
        filesQueue.push({ file: file, selectedTag: MY_TAGS[0] }); // Mặc định tag đầu tiên
    });

    renderPreviewList();
    updateUploadButton();
});

// Render danh sách chờ upload (Bên phải)
function renderPreviewList() {
    previewList.innerHTML = "";
    filesQueue.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        
        // Tạo dropdown chọn Tag cho từng ảnh
        let tagOptions = MY_TAGS.map(t => `<option value="${t}" ${t === item.selectedTag ? 'selected' : ''}>${t}</option>`).join('');

        div.innerHTML = `
            <img src="${URL.createObjectURL(item.file)}" class="preview-thumb">
            <div class="preview-info">
                <div class="preview-name">${item.file.name}</div>
                <select class="tag-select" onchange="updateTag(${index}, this.value)">
                    ${tagOptions}
                </select>
            </div>
            <button onclick="removeFile(${index})" style="border:none;background:none;cursor:pointer">❌</button>
        `;
        previewList.appendChild(div);
    });
}

// Cập nhật tag khi user chọn trong list chờ
window.updateTag = (index, value) => {
    filesQueue[index].selectedTag = value;
};

// Xóa file khỏi list chờ
window.removeFile = (index) => {
    filesQueue.splice(index, 1);
    renderPreviewList();
    updateUploadButton();
};

function updateUploadButton() {
    uploadBtn.disabled = filesQueue.length === 0;
    uploadBtn.innerText = filesQueue.length > 0 ? `Upload ${filesQueue.length} ảnh` : "✨ Upload Ngay ✨";
}

// --- XỬ LÝ UPLOAD (QUAN TRỌNG) ---
uploadBtn.addEventListener('click', async () => {
    uploadBtn.disabled = true;
    statusText.innerText = "Đang xử lý...";
    
    let successCount = 0;

    // Duyệt qua từng file trong hàng chờ
    for (const item of filesQueue) {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('tags', item.selectedTag); // Gắn tag vào Cloudinary
        

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.secure_url) {
                // Lưu vào danh sách cục bộ
                const newImage = {
                    id: data.public_id,
                    url: data.secure_url,
                    tag: item.selectedTag,
                    date: new Date().toISOString(),
                    delete_token: data.delete_token || null // Lưu token xóa
                };
                
                savedImages.unshift(newImage); // Thêm vào đầu list
                successCount++;
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Xử lý sau khi chạy xong vòng lặp
    statusText.innerText = `Hoàn tất! Đã up ${successCount}/${filesQueue.length} ảnh.`;
    filesQueue = []; // Reset hàng chờ
    renderPreviewList();
    saveToLocal(); // Lưu vào bộ nhớ trình duyệt
    renderGallery(); // Vẽ lại danh sách
    uploadBtn.disabled = true;
    fileInput.value = ""; // Reset input
    setTimeout(() => statusText.innerText = "", 3000);
});

// --- RENDER GALLERY (BÊN TRÁI) ---
function renderGallery() {
    const filterValue = filterTag.value;
    const sortValue = sortTime.value;

    // 1. Lọc dữ liệu
    let displayData = savedImages.filter(img => {
        return filterValue === 'all' || img.tag === filterValue;
    });

    // 2. Sắp xếp
    displayData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortValue === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // 3. Hiển thị
    totalImg.innerText = displayData.length;
    galleryGrid.innerHTML = "";

    if (displayData.length === 0) {
        galleryGrid.innerHTML = `<div class="empty-state">Không tìm thấy ảnh nào...</div>`;
        return;
    }

    displayData.forEach(img => {
        // Tạo link tối ưu (f_auto, q_auto)
        // Chèn /q_auto,f_auto/ ngay sau /upload/
        const optimizedUrl = img.url.replace('/upload/', '/upload/q_auto,f_auto/');
        const timeString = new Date(img.date).toLocaleString('vi-VN');

        const card = document.createElement('div');
        card.className = 'img-card';
        card.innerHTML = `
            <img src="${optimizedUrl}" class="img-display" loading="lazy">
            <div class="card-body">
                <span class="tag-badge">${img.tag}</span>
                <span class="date-text">${timeString}</span>
                <div class="action-row">
                    <button class="btn-copy" onclick="copyLink('${optimizedUrl}')">Copy Link</button>
                    <button class="btn-del" onclick="deleteImage('${img.id}', '${img.delete_token}')" title="Xóa">🗑️</button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// --- CÁC HÀM TIỆN ÍCH ---

// 1. Copy Link
window.copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("Đã copy link ảnh đã nén (Nhẹ hơn): \n" + url);
};

// 2. Xóa ảnh
window.deleteImage = async (public_id, delete_token) => {
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    // Xóa trong danh sách local trước
    savedImages = savedImages.filter(img => img.id !== public_id);
    saveToLocal();
    renderGallery();

    // Nếu có token (vừa mới up xong), thử xóa trên Cloud
    if (delete_token) {
        try {
            const formData = new FormData();
            formData.append('token', delete_token);
            await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`, {
                method: 'POST',
                body: formData
            });
            console.log("Đã xóa trên Cloudinary");
        } catch (e) {
            console.log("Lỗi xóa cloud: " + e);
        }
    } else {
        alert("Ảnh đã được xóa khỏi danh sách!\nLưu ý: Vì lý do bảo mật, ảnh cũ (up quá 10 phút) cần vào trang chủ Cloudinary để xóa vĩnh viễn.");
    }
};

// 3. Reset toàn bộ
clearLocalBtn.addEventListener('click', () => {
    if(confirm("Xóa sạch lịch sử trên web này? (Ảnh trên Cloud vẫn còn)")) {
        localStorage.removeItem('my_anime_gallery');
        savedImages = [];
        renderGallery();
    }
});

// 4. Lưu LocalStorage
function saveToLocal() {
    localStorage.setItem('my_anime_gallery', JSON.stringify(savedImages));
}

// Lắng nghe sự kiện lọc/sắp xếp
filterTag.addEventListener('change', renderGallery);
sortTime.addEventListener('change', renderGallery);