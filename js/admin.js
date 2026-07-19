// ============================================
// اوای یقین - پنل مدیریت
// ============================================

(function() {
    'use strict';

    var currentTab = 'dashboard';
    var allChats = [];
    var botPersonality = '';
    var botTraining = [];
    var settings = {};

    function init() {
        // Load data
        try {
            var savedChats = localStorage.getItem('oay_chats');
            if (savedChats) allChats = JSON.parse(savedChats);
        } catch(e) { allChats = []; }

        try {
            var savedPersonality = localStorage.getItem('oay_personality');
            botPersonality = savedPersonality || BOT_PERSONALITY;
        } catch(e) { botPersonality = BOT_PERSONALITY; }

        try {
            var savedTraining = localStorage.getItem('oay_training');
            if (savedTraining) botTraining = JSON.parse(savedTraining);
        } catch(e) { botTraining = []; }

        try {
            var savedSettings = localStorage.getItem('oay_settings');
            if (savedSettings) settings = JSON.parse(savedSettings);
        } catch(e) { settings = {}; }

        bindEvents();
        renderDashboard();
        loadSettings();
    }

    function bindEvents() {
        // Tab buttons
        document.querySelectorAll('.admin-tab').forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchTab(btn.dataset.tab);
            });
        });

        // Search
        var searchInput = document.getElementById('search-chats');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                renderChats(this.value);
            });
        }

        // Personality
        var savePersonalityBtn = document.getElementById('save-personality');
        if (savePersonalityBtn) {
            savePersonalityBtn.addEventListener('click', savePersonality);
        }

        var resetPersonalityBtn = document.getElementById('reset-personality');
        if (resetPersonalityBtn) {
            resetPersonalityBtn.addEventListener('click', resetPersonality);
        }

        // Training
        var addTrainingBtn = document.getElementById('add-training');
        if (addTrainingBtn) {
            addTrainingBtn.addEventListener('click', addTrainingItem);
        }

        // Settings
        var saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', saveSettings);
        }

        var resetSettingsBtn = document.getElementById('reset-settings');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', resetSettings);
        }

        // Data management
        var exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }

        var importBtn = document.getElementById('import-data');
        if (importBtn) {
            importBtn.addEventListener('click', importData);
        }

        var clearBtn = document.getElementById('clear-all');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllData);
        }

        // Temperature slider
        var tempSlider = document.getElementById('setting-temperature');
        if (tempSlider) {
            tempSlider.addEventListener('input', function() {
                var valEl = document.getElementById('setting-temp-value');
                if (valEl) valEl.textContent = this.value;
            });
        }
    }

    function switchTab(tabName) {
        currentTab = tabName;

        document.querySelectorAll('.admin-tab').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.admin-tab-content').forEach(function(content) {
            content.classList.toggle('active', content.id === 'tab-' + tabName);
        });

        if (tabName === 'chats') renderChats();
        if (tabName === 'personality') loadPersonality();
        if (tabName === 'training') renderTraining();
        if (tabName === 'settings') loadSettings();
    }

    // ============================================
    // DASHBOARD
    // ============================================
    function renderDashboard() {
        var totalChats = allChats.length;
        var totalMessages = 0;
        for (var i = 0; i < allChats.length; i++) {
            totalMessages += (allChats[i].messages && allChats[i].messages.length) || 0;
        }

        var today = new Date().toDateString();
        var todayChats = 0;
        for (var i = 0; i < allChats.length; i++) {
            var chatDate = new Date(allChats[i].timestamp).toDateString();
            if (chatDate === today) todayChats++;
        }

        var statTotalChats = document.getElementById('stat-total-chats');
        var statTotalMessages = document.getElementById('stat-total-messages');
        var statTodayChats = document.getElementById('stat-today-chats');
        var statTraining = document.getElementById('stat-training-items');

        if (statTotalChats) statTotalChats.textContent = totalChats;
        if (statTotalMessages) statTotalMessages.textContent = totalMessages;
        if (statTodayChats) statTodayChats.textContent = todayChats;
        if (statTraining) statTraining.textContent = botTraining.length;
    }

    // ============================================
    // CHATS
    // ============================================
    function renderChats(searchTerm) {
        var chatsList = document.getElementById('chats-list');
        if (!chatsList) return;

        var chats = allChats.slice();

        if (searchTerm) {
            var term = searchTerm.toLowerCase();
            chats = chats.filter(function(chat) {
                var text = '';
                if (chat.messages) {
                    for (var i = 0; i < chat.messages.length; i++) {
                        text += chat.messages[i].content + ' ';
                    }
                }
                return text.toLowerCase().indexOf(term) !== -1;
            });
        }

        if (chats.length === 0) {
            chatsList.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128172;</div><div class="empty-title">هیچ گفتگویی یافت نشد</div><div class="empty-desc">' + (searchTerm ? 'جستجوی دیگری امتحان کنید' : 'هنوز گفتگویی ثبت نشده است') + '</div></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < chats.length; i++) {
            var chat = chats[i];
            var date = new Date(chat.timestamp).toLocaleString('fa-IR');
            var messageCount = (chat.messages && chat.messages.length) || 0;
            var preview = '';
            if (chat.messages) {
                for (var j = 0; j < chat.messages.length; j++) {
                    if (chat.messages[j].role === 'user') {
                        preview = chat.messages[j].content.substring(0, 60) + '...';
                        break;
                    }
                }
            }
            if (!preview) preview = 'بدون عنوان';

            var userName = chat.userName || 'ناشناس';
            var userPhone = chat.userPhone || 'شماره ثبت نشده';

            html += '<div class="chat-card">' +
                '<div class="chat-card-header"><div class="chat-card-title">' + escapeHtml(chat.title || 'گفتگوی بدون عنوان') + '</div><div class="chat-card-date">' + date + '</div></div>' +
                '<div class="chat-card-user-info">' +
                '<span class="user-badge user-name">&#128100; ' + escapeHtml(userName) + '</span>' +
                '<span class="user-badge user-phone">&#128222; ' + escapeHtml(userPhone) + '</span>' +
                '</div>' +
                '<div class="chat-card-preview">' + escapeHtml(preview) + '</div>' +
                '<div class="chat-card-footer"><span class="chat-card-count">' + messageCount + ' پیام</span>' +
                '<div class="chat-card-actions">' +
                '<button class="chat-card-btn view-btn" data-chat-id="' + chat.id + '">مشاهده</button>' +
                '<button class="chat-card-btn delete-btn" data-chat-id="' + chat.id + '">حذف</button>' +
                '</div></div></div>';
        }

        chatsList.innerHTML = html;

        // Bind view buttons
        chatsList.querySelectorAll('.view-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                viewChat(btn.dataset.chatId);
            });
        });

        // Bind delete buttons
        chatsList.querySelectorAll('.delete-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                deleteChat(btn.dataset.chatId);
            });
        });
    }

    function viewChat(chatId) {
        var chat = null;
        for (var i = 0; i < allChats.length; i++) {
            if (allChats[i].id === chatId) {
                chat = allChats[i];
                break;
            }
        }
        if (!chat) return;

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';

        var messagesHtml = '';
        if (chat.messages) {
            for (var i = 0; i < chat.messages.length; i++) {
                var msg = chat.messages[i];
                var isUser = msg.role === 'user';
                messagesHtml += '<div class="modal-message ' + (isUser ? 'user' : 'bot') + '">' +
                    '<div class="modal-message-avatar">' + (isUser ? '&#128100;' : '&#128330;') + '</div>' +
                    '<div class="modal-message-content"><div class="modal-message-author">' + (isUser ? 'کاربر' : 'اوای یقین') + '</div>' +
                    '<div class="modal-message-text">' + escapeHtml(msg.content) + '</div></div></div>';
            }
        }

        modal.innerHTML = '<div class="modal"><div class="modal-header"><h3>' + escapeHtml(chat.title || 'گفتگوی بدون عنوان') + '</h3>' +
            '<button class="modal-close">&times;</button></div>' +
            '<div class="modal-body chat-view">' + messagesHtml + '</div></div>';

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.remove();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
    }

    function deleteChat(chatId) {
        if (!confirm('آیا از حذف این گفتگو اطمینان دارید؟')) return;

        var newChats = [];
        for (var i = 0; i < allChats.length; i++) {
            if (allChats[i].id !== chatId) {
                newChats.push(allChats[i]);
            }
        }
        allChats = newChats;
        localStorage.setItem('oay_chats', JSON.stringify(allChats));
        renderChats();
        renderDashboard();
    }

    // ============================================
    // PERSONALITY
    // ============================================
    function loadPersonality() {
        var editor = document.getElementById('personality-editor');
        if (editor) editor.value = botPersonality;
    }

    function savePersonality() {
        var editor = document.getElementById('personality-editor');
        if (!editor) return;
        botPersonality = editor.value;
        localStorage.setItem('oay_personality', botPersonality);
        showToast('شخصیت ربات با موفقیت ذخیره شد');
    }

    function resetPersonality() {
        if (!confirm('آیا از بازگرداندن شخصیت پیش فرض اطمینان دارید؟')) return;
        botPersonality = BOT_PERSONALITY;
        var editor = document.getElementById('personality-editor');
        if (editor) editor.value = botPersonality;
        localStorage.setItem('oay_personality', botPersonality);
        showToast('شخصیت ربات به حالت پیش فرض بازگردانده شد');
    }

    // ============================================
    // TRAINING
    // ============================================
    function renderTraining() {
        var trainingList = document.getElementById('training-list');
        if (!trainingList) return;

        if (botTraining.length === 0) {
            trainingList.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128218;</div><div class="empty-title">هیچ آموزشی ثبت نشده</div><div class="empty-desc">با دکمه بالا دانش جدید به ربات اضافه کنید</div></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < botTraining.length; i++) {
            var item = botTraining[i];
            html += '<div class="training-item">' +
                '<div class="training-item-header"><span class="training-item-number">#' + (i + 1) + '</span>' +
                '<button class="training-item-delete" data-index="' + i + '">&times;</button></div>' +
                '<div class="training-item-question"><strong>سوال:</strong> ' + escapeHtml(item.question) + '</div>' +
                '<div class="training-item-answer"><strong>پاسخ:</strong> ' + escapeHtml(item.answer) + '</div></div>';
        }

        trainingList.innerHTML = html;

        trainingList.querySelectorAll('.training-item-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                deleteTraining(parseInt(btn.dataset.index));
            });
        });
    }

    function addTrainingItem() {
        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = '<div class="modal"><div class="modal-header"><h3>افزودن دانش جدید</h3>' +
            '<button class="modal-close">&times;</button></div>' +
            '<div class="modal-body"><div class="form-group"><label>سوال / موضوع</label>' +
            '<input type="text" class="form-input" id="training-question" placeholder="سوال یا موضوع را وارد کنید..."></div>' +
            '<div class="form-group"><label>پاسخ / محتوا</label>' +
            '<textarea class="form-textarea" id="training-answer" rows="6" placeholder="پاسخ کامل را وارد کنید..."></textarea></div>' +
            '<button class="btn btn-primary" id="save-training-item">ذخیره</button></div></div>';

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.remove();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });

        modal.querySelector('#save-training-item').addEventListener('click', function() {
            var question = document.getElementById('training-question').value.trim();
            var answer = document.getElementById('training-answer').value.trim();

            if (!question || !answer) {
                showToast('لطفا هر دو فیلد را پر کنید');
                return;
            }

            botTraining.push({ question: question, answer: answer, timestamp: Date.now() });
            localStorage.setItem('oay_training', JSON.stringify(botTraining));
            modal.remove();
            renderTraining();
            renderDashboard();
            showToast('دانش جدید با موفقیت اضافه شد');
        });
    }

    function deleteTraining(index) {
        if (!confirm('آیا از حذف این مورد اطمینان دارید؟')) return;
        botTraining.splice(index, 1);
        localStorage.setItem('oay_training', JSON.stringify(botTraining));
        renderTraining();
        renderDashboard();
    }

    // ============================================
    // SETTINGS
    // ============================================
    function loadSettings() {
        var defaults = {
            apiKey: CONFIG.API_KEY,
            model: CONFIG.MODEL,
            temperature: 0.7,
            maxTokens: 2048,
            welcomeMessage: 'بسم الله الرحمن الرحیم\nسلام و رحمت خدا بر شما. من اوای یقین هستم، دستیار هوشمند مسجد حضرت ابوالفضل (ع). چطور می توانم به شما کمک کنم؟',
            enableHistory: true,
            maxHistoryChats: 50
        };

        var s = {};
        for (var key in defaults) {
            s[key] = settings[key] !== undefined ? settings[key] : defaults[key];
        }

        var el;
        el = document.getElementById('setting-api-key');
        if (el) el.value = s.apiKey;

        el = document.getElementById('setting-model');
        if (el) el.value = s.model;

        el = document.getElementById('setting-temperature');
        if (el) el.value = s.temperature;

        el = document.getElementById('setting-temp-value');
        if (el) el.textContent = s.temperature;

        el = document.getElementById('setting-max-tokens');
        if (el) el.value = s.maxTokens;

        el = document.getElementById('setting-welcome');
        if (el) el.value = s.welcomeMessage;

        el = document.getElementById('setting-enable-history');
        if (el) el.checked = s.enableHistory;

        el = document.getElementById('setting-max-history');
        if (el) el.value = s.maxHistoryChats;
    }

    function saveSettings() {
        var el;
        settings = {};

        el = document.getElementById('setting-api-key');
        if (el) settings.apiKey = el.value;

        el = document.getElementById('setting-model');
        if (el) settings.model = el.value;

        el = document.getElementById('setting-temperature');
        if (el) settings.temperature = parseFloat(el.value);

        el = document.getElementById('setting-max-tokens');
        if (el) settings.maxTokens = parseInt(el.value);

        el = document.getElementById('setting-welcome');
        if (el) settings.welcomeMessage = el.value;

        el = document.getElementById('setting-enable-history');
        if (el) settings.enableHistory = el.checked;

        el = document.getElementById('setting-max-history');
        if (el) settings.maxHistoryChats = parseInt(el.value);

        localStorage.setItem('oay_settings', JSON.stringify(settings));
        showToast('تنظیمات با موفقیت ذخیره شد');
    }

    function resetSettings() {
        if (!confirm('آیا از بازگرداندن تنظیمات پیش فرض اطمینان دارید؟')) return;
        settings = {};
        localStorage.removeItem('oay_settings');
        loadSettings();
        showToast('تنظیمات به حالت پیش فرض بازگردانده شد');
    }

    // ============================================
    // DATA MANAGEMENT
    // ============================================
    function exportData() {
        var data = {
            chats: allChats,
            personality: botPersonality,
            training: botTraining,
            settings: settings,
            exportDate: new Date().toISOString()
        };

        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'oay-yaqin-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('پشتیبان گیری با موفقیت انجام شد');
    }

    function importData() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var data = JSON.parse(event.target.result);

                    if (data.chats) {
                        allChats = data.chats;
                        localStorage.setItem('oay_chats', JSON.stringify(allChats));
                    }
                    if (data.personality) {
                        botPersonality = data.personality;
                        localStorage.setItem('oay_personality', botPersonality);
                    }
                    if (data.training) {
                        botTraining = data.training;
                        localStorage.setItem('oay_training', JSON.stringify(botTraining));
                    }
                    if (data.settings) {
                        settings = data.settings;
                        localStorage.setItem('oay_settings', JSON.stringify(settings));
                    }

                    renderDashboard();
                    renderChats();
                    showToast('داده ها با موفقیت بازیابی شد');
                } catch (err) {
                    showToast('خطا در خواندن فایل');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function clearAllData() {
        if (!confirm('هشدار: این عملیات تمام داده ها را حذف می کند. آیا اطمینان دارید؟')) return;
        if (!confirm('آیا واقعا مطمئن هستید؟ این عملیات غیرقابل بازگشت است!')) return;

        localStorage.removeItem('oay_chats');
        localStorage.removeItem('oay_personality');
        localStorage.removeItem('oay_training');
        localStorage.removeItem('oay_settings');

        allChats = [];
        botPersonality = BOT_PERSONALITY;
        botTraining = [];
        settings = {};

        renderDashboard();
        renderChats();
        loadPersonality();
        renderTraining();
        loadSettings();
        showToast('تمام داده ها حذف شد');
    }

    // ============================================
    // UTILITIES
    // ============================================
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message) {
        var existing = document.querySelector('.admin-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'admin-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('show');
        });

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // Expose init function so it can be called after login
    window.initAdminPanel = init;

    // Auto-init if already authenticated (admin-content is visible)
    function tryInit() {
        var adminContent = document.getElementById('admin-content');
        if (adminContent && adminContent.classList.contains('active')) {
            init();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
})();
