document.addEventListener('DOMContentLoaded', () => {
    // --- 1. تعريف العناصر الأساسية من الصفحة ---
    const mindMapContainer = document.getElementById('mind-map-container');
    const nodeInput = document.getElementById('node-input');
    const addNodeBtn = document.getElementById('add-node-btn');
    const saveMapBtn = document.getElementById('save-map-btn');
    const clearMapBtn = document.getElementById('clear-map-btn');
    const errorMessage = document.getElementById('error-message');

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
            color: '#7f8c8d',
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
    
    // --- 4. الوظائف الأساسية لإنشاء العقد والتفاعل معها ---

    // وظيفة إنشاء عقدة جديدة
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

        makeDraggable(node);
        handleNodeSelection(node);
        return node;
    };

    // جعل العقد قابلة للسحب
    const makeDraggable = (element) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        element.onmousedown = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = `${element.offsetTop - pos2}px`;
            element.style.left = `${element.offsetLeft - pos1}px`;
            updateLines();
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
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

    // --- 8. تشغيل وظيفة تحميل الخريطة عند فتح الصفحة ---
    loadMap();
});