document.addEventListener('DOMContentLoaded', () => {
    // --- 1. تعريف العناصر الأساسية من الصفحة ---
    const mindMapContainer = document.getElementById('mind-map-container');
    const nodeInput = document.getElementById('node-input');
    const addNodeBtn = document.getElementById('add-node-btn');
    const saveMapBtn = document.getElementById('save-map-btn');
    const clearMapBtn = document.getElementById('clear-map-btn');
    const errorMessage = document.getElementById('error-message');
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomResetBtn = document.getElementById('zoom-reset-btn');


    // --- 2. متغيرات لتخزين حالة الخريطة ---
    let nodes = [];
    let lines = [];
    let selectedNode = null;
    let nodeIdCounter = 0;

    // --- 3. الوظائف المساعدة ---

    // وظيفة لعرض رسالة خطأ مؤقتة
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000); // إخفاء الرسالة بعد 3 ثوانٍ
    };

    // تحديث الخطوط الرابطة عند تحريك العقد
    const updateLines = () => {
        lines.forEach(l => l.line.position());
    };

    // إنشاء خط رابط بين عقدتين
    const createLine = (startNode, endNode) => {
        // منع ربط العقدة بنفسها أو إنشاء خط موجود بالفعل
        const lineExists = lines.some(l => 
            (l.start === startNode.id && l.end === endNode.id) || 
            (l.start === endNode.id && l.end === startNode.id)
        );

        if (startNode.id === endNode.id || lineExists) {
            return;
        }

        const line = new LeaderLine(startNode, endNode, {
            color: document.body.classList.contains('dark-mode') ? '#a0a0b0' : '#7f8c8d',
            size: 3,
            path: 'fluid'
        });
        lines.push({ line, start: startNode.id, end: endNode.id });
    };

    // إزالة عقدة وجميع الخطوط المتصلة بها
    const removeNode = (nodeToRemove) => {
        // إزالة الخطوط المتصلة بالعقدة
        lines = lines.filter(l => {
            if (l.start === nodeToRemove.id || l.end === nodeToRemove.id) {
                l.line.remove();
                return false;
            }
            return true;
        });

        // إزالة العقدة من مصفوفة التتبع ومن الصفحة
        nodes = nodes.filter(n => n.id !== nodeToRemove.id);
        nodeToRemove.remove();
        updateLines();
    };
    
    // وظيفة لجعل العقد قابلة للسحب والإفلات (هذه هي النسخة الصحيحة والكاملة)
// =================================================================
// ▼▼▼   النسخة النهائية التي تصلح السحب والربط معًا   ▼▼▼
// =================================================================
const makeDraggable = (element) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    const dragThreshold = 5; // مسافة 5 بكسل للتمييز بين النقرة والسحب

    const dragStart = (e) => {
        // إعادة تعيين حالة السحب
        isDragging = false;

        // تسجيل إحداثيات البداية
        pos3 = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
        pos4 = (e.type === 'touchstart') ? e.touches[0].clientY : e.clientY;

        // تفعيل تتبع الحركة والإيقاف
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('touchmove', dragMove, { passive: false });
    };

    const dragMove = (e) => {
        const currentX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
        const currentY = (e.type === 'touchmove') ? e.touches[0].clientY : e.clientY;

        // إذا لم نكن في وضع السحب، تحقق مما إذا كانت الحركة قد تجاوزت العتبة
        if (!isDragging) {
            const dx = Math.abs(currentX - pos3);
            const dy = Math.abs(currentY - pos4);
            if (dx > dragThreshold || dy > dragThreshold) {
                isDragging = true; // لقد بدأ السحب الفعلي
            }
        }

        // تحريك العنصر فقط إذا كنا في وضع السحب
        if (isDragging) {
            // منع سلوك المتصفح (مثل تحريك الصفحة) فقط عند السحب الفعلي
            if (e.type === 'touchmove') e.preventDefault();

            // حساب الموضع الجديد للمؤشر:
            pos1 = pos3 - currentX;
            pos2 = pos4 - currentY;
            pos3 = currentX;
            pos4 = currentY;

            // تحديد الموضع الجديد للعنصر:
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            updateLines();
        }
    };

    const dragEnd = () => {
        // إلغاء ربط المستمعين
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('touchmove', dragMove);

        // إذا لم نقم بالسحب أبدًا، فهذا يعني أنها كانت نقرة!
        if (!isDragging) {
            // نقوم بتشغيل حدث النقر يدويًا على العنصر
            element.click();
        }
    };

    // ربط حدث البداية بالوظيفة
    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart);
};
    // --- 4. الوظائف الأساسية لإنشاء العقد والتفاعل معها ---

    const createNode = (text, x, y, isCentral = false) => {
        // التحقق من التكرار
        if (nodes.some(node => node.textContent.trim().toLowerCase() === text.trim().toLowerCase())) {
            showError('هذه الفكرة موجودة بالفعل!');
            return null;
        }

        const node = document.createElement('div');
        node.id = `node-${nodeIdCounter++}`;
        node.className = 'node';
        if (isCentral) node.classList.add('central');

        const nodeText = document.createElement('span');
        nodeText.textContent = text;
        node.appendChild(nodeText);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            removeNode(node);
        };
        // العقدة المركزية لا يمكن حذفها
        if (!isCentral) node.appendChild(deleteBtn);

        node.style.left = `${x}px`;
        node.style.top = `${y}px`;

        mindMapContainer.appendChild(node);
        nodes.push({ id: node.id, element: node, textContent: text, isCentral });

        makeDraggable(node); // تفعيل خاصية السحب لكل عقدة جديدة
        handleNodeSelection(node);
        return node;
    };

    // التعامل مع تحديد العقد وربطها
    const handleNodeSelection = (node) => {
        node.addEventListener('click', () => {
            if (!selectedNode) {
                // التحديد الأول
                selectedNode = node;
                node.classList.add('selected');
            } else if (selectedNode === node) {
                // إلغاء التحديد عند الضغط على نفس العقدة
                selectedNode.classList.remove('selected');
                selectedNode = null;
            } else {
                // الربط بين العقدة المحددة والعقدة الجديدة
                createLine(selectedNode, node);
                selectedNode.classList.remove('selected');
                selectedNode = null;
            }
        });
    };

    // --- 5. ربط الأزرار بوظائفها (Event Listeners) ---

    // إضافة عقدة جديدة عند الضغط على الزر
    addNodeBtn.addEventListener('click', () => {
        const text = nodeInput.value.trim();
        if (text === '') {
            showError('الرجاء إدخال نص للفكرة.');
            return;
        }

        if (nodes.length === 0) { // أول عقدة تكون هي العقدة المركزية
            const x = mindMapContainer.offsetWidth / 2 - 100;
            const y = mindMapContainer.offsetHeight / 2 - 30;
            createNode(text, x, y, true);
        } else {
            const x = Math.random() * (mindMapContainer.offsetWidth - 200);
            const y = Math.random() * (mindMapContainer.offsetHeight - 100);
            createNode(text, x, y);
        }
        nodeInput.value = ''; // تفريغ حقل الإدخال
    });
    
    // حفظ الخريطة في الذاكرة المحلية للمتصفح
    saveMapBtn.addEventListener('click', () => {
        const mapData = {
            nodes: nodes.map(n => ({
                id: n.id,
                text: n.textContent,
                isCentral: n.isCentral,
                x: n.element.style.left,
                y: n.element.style.top
            })),
            lines: lines.map(l => ({ start: l.start, end: l.end }))
        };
        localStorage.setItem('mindMapData', JSON.stringify(mapData));
        alert('تم حفظ الخريطة بنجاح!');
    });

    // مسح الخريطة بالكامل
    clearMapBtn.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من أنك تريد مسح الخريطة بالكامل؟')) {
            mindMapContainer.innerHTML = '';
            nodes = [];
            lines.forEach(l => l.line.remove());
            lines = [];
            selectedNode = null;
            nodeIdCounter = 0;
            localStorage.removeItem('mindMapData');
        }
    });

    // --- 6. وظائف تحميل الخريطة المحفوظة ---

    const loadMap = () => {
        const savedData = localStorage.getItem('mindMapData');
        if (!savedData) return;

        const mapData = JSON.parse(savedData);
        const nodeElements = {};

        // إعادة رسم العقد
        mapData.nodes.forEach(nodeData => {
            const node = createNode(nodeData.text, parseInt(nodeData.x), parseInt(nodeData.y), nodeData.isCentral);
            if (node) {
                node.id = nodeData.id;
                nodeElements[nodeData.id] = node;
            }
        });
        
        // إعادة رسم الخطوط الرابطة
        mapData.lines.forEach(lineData => {
            const startNode = nodeElements[lineData.start];
            const endNode = nodeElements[lineData.end];
            if (startNode && endNode) {
                createLine(startNode, endNode);
            }
        });
    };

    // --- 7. الكود الخاص بالنافذة المنبثقة لسياسة الخصوصية ---
    const privacyModal = document.getElementById('privacy-modal');
    const privacyLink = document.getElementById('privacy-policy-link');
    const closeModalBtn = document.querySelector('.modal .close-btn');

    // عند الضغط على رابط "سياسة الخصوصية" لإظهار النافذة
    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.style.display = 'block';
    });

    // عند الضغط على زر الإغلاق (X) لإخفاء النافذة
    closeModalBtn.addEventListener('click', () => {
        privacyModal.style.display = 'none';
    });

    // عند الضغط في أي مكان خارج النافذة، يتم إغلاقها
    window.addEventListener('click', (e) => {
        if (e.target == privacyModal) {
            privacyModal.style.display = 'none';
        }
    });
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    };

    // عند تحميل الصفحة، تحقق من وجود ثيم محفوظ
    if (savedTheme) {
        applyTheme(savedTheme);
    }

    // عند الضغط على زر التبديل
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        }
    });

    let currentScale = 1.0;

const updateZoom = () => {
    mindMapContainer.style.transform = `scale(${currentScale})`;
    // تحديث الخطوط بعد كل تغيير في الحجم هو أمر ضروري
    updateLines();
};

zoomInBtn.addEventListener('click', () => {
    currentScale += 0.1;
    updateZoom();
});

zoomOutBtn.addEventListener('click', () => {
    // منع التصغير المفرط
    if (currentScale > 0.3) {
        currentScale -= 0.1;
        updateZoom();
    }
});

zoomResetBtn.addEventListener('click', () => {
    currentScale = 1.0;
    updateZoom();
});
    loadMap();

});