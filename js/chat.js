// ============================================
// اوای یقین - منطق چت (نسخه چند API + Proxy)
// ============================================

(function() {
    'use strict';

    // State
    var messages = [];
    var currentChatId = null;
    var isTyping = false;
    var chatHistory = [];
    var userInfo = { name: '', phone: '' };

    // DOM Elements
    var chatContainer, chatInput, sendBtn, newChatBtn, sidebar, menuToggle, chatHistoryEl, welcomeScreen;

    // Settings cache
    var botSettings = {};

    function loadSettings() {
        try {
            var saved = localStorage.getItem('oay_settings');
            if (saved) {
                botSettings = JSON.parse(saved);
            }
        } catch(e) {
            botSettings = {};
        }

        // Fallback to defaults
        if (!botSettings.provider) botSettings.provider = CONFIG.DEFAULT_PROVIDER;
        if (!botSettings.apiKey) botSettings.apiKey = CONFIG.DEFAULT_API_KEY;
        if (!botSettings.model) botSettings.model = CONFIG.DEFAULT_MODEL;
        if (!botSettings.apiUrl) botSettings.apiUrl = CONFIG.DEFAULT_URL;
        if (botSettings.temperature === undefined) botSettings.temperature = CONFIG.DEFAULT_TEMPERATURE;
        if (!botSettings.maxTokens) botSettings.maxTokens = CONFIG.DEFAULT_MAX_TOKENS;
        if (botSettings.topP === undefined) botSettings.topP = CONFIG.DEFAULT_TOP_P;
        if (botSettings.frequencyPenalty === undefined) botSettings.frequencyPenalty = CONFIG.DEFAULT_FREQUENCY_PENALTY;
        if (botSettings.presencePenalty === undefined) botSettings.presencePenalty = CONFIG.DEFAULT_PRESENCE_PENALTY;
    }

    // Initialize when DOM is ready
    function init() {
        loadSettings();

        // Check if user is registered
        try {
            var savedUser = localStorage.getItem('oay_user_info');
            if (savedUser) {
                userInfo = JSON.parse(savedUser);
            }
        } catch(e) {
            userInfo = { name: '', phone: '' };
        }

        // Show registration if not registered
        if (!userInfo.name || !userInfo.phone) {
            showRegistration();
            return;
        }

        hideRegistration();

        // Get DOM elements
        chatContainer = document.getElementById('chat-container');
        chatInput = document.getElementById('chat-input');
        sendBtn = document.getElementById('send-btn');
        newChatBtn = document.getElementById('new-chat-btn');
        sidebar = document.getElementById('sidebar');
        menuToggle = document.getElementById('menu-toggle');
        chatHistoryEl = document.getElementById('chat-history');
        welcomeScreen = document.getElementById('welcome-screen');

        // Load history from localStorage
        try {
            var saved = localStorage.getItem('oay_chats');
            if (saved) chatHistory = JSON.parse(saved);
        } catch(e) {
            chatHistory = [];
        }

        // Bind events
        bindEvents();

        // Render history
        renderChatHistory();
    }

    function showRegistration() {
        var overlay = document.getElementById('registration-overlay');
        if (overlay) overlay.classList.remove('hidden');

        var regBtn = document.getElementById('reg-btn');
        var regName = document.getElementById('reg-name');
        var regPhone = document.getElementById('reg-phone');
        var regError = document.getElementById('reg-error');

        if (regBtn) {
            // Remove old listeners by cloning
            var newBtn = regBtn.cloneNode(true);
            regBtn.parentNode.replaceChild(newBtn, regBtn);
            regBtn = newBtn;

            regBtn.addEventListener('click', function() {
                var name = regName.value.trim();
                var phone = regPhone.value.trim();

                if (!name) {
                    regError.textContent = 'لطفا نام و نام خانوادگی خود را وارد کنید';
                    return;
                }
                if (!phone) {
                    regError.textContent = 'لطفا شماره تماس خود را وارد کنید';
                    return;
                }
                if (phone.length < 10) {
                    regError.textContent = 'شماره تماس معتبر نیست';
                    return;
                }

                userInfo = { name: name, phone: phone };
                localStorage.setItem('oay_user_info', JSON.stringify(userInfo));

                hideRegistration();
                init();
            });
        }

        if (regPhone) {
            regPhone.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    if (regBtn) regBtn.click();
                }
            });
        }
    }

    function hideRegistration() {
        var overlay = document.getElementById('registration-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    function bindEvents() {
        // Send button click
        if (sendBtn) {
            sendBtn.addEventListener('click', function(e) {
                e.preventDefault();
                sendMessage();
            });
        }

        // Enter key in textarea
        if (chatInput) {
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            chatInput.addEventListener('input', autoResize);
        }

        // New chat button
        if (newChatBtn) {
            newChatBtn.addEventListener('click', function(e) {
                e.preventDefault();
                startNewChat();
            });
        }

        // Menu toggle
        if (menuToggle) {
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                toggleSidebar();
            });
        }

        // Suggestion cards
        var suggestionCards = document.querySelectorAll('.suggestion-card');
        for (var i = 0; i < suggestionCards.length; i++) {
            suggestionCards[i].addEventListener('click', function(e) {
                e.preventDefault();
                var titleEl = this.querySelector('.suggestion-card-title');
                if (titleEl && chatInput) {
                    chatInput.value = titleEl.textContent.trim();
                    sendMessage();
                }
            });
        }
    }

    function autoResize() {
        if (!chatInput) return;
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
    }

    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    function startNewChat() {
        currentChatId = Date.now().toString();
        messages = [];
        showWelcomeScreen();
        if (chatInput) {
            chatInput.value = '';
            chatInput.style.height = 'auto';
        }
    }

    function showWelcomeScreen() {
        if (!chatContainer || !welcomeScreen) return;
        chatContainer.innerHTML = '';
        welcomeScreen.style.display = 'flex';
        chatContainer.appendChild(welcomeScreen);
    }

    function hideWelcomeScreen() {
        if (welcomeScreen) welcomeScreen.style.display = 'none';
    }

    function sendMessage() {
        if (!chatInput) return;
        var text = chatInput.value.trim();
        if (!text || isTyping) return;

        // Check admin password
        if (text === CONFIG.ADMIN_PASSWORD) {
            openAdminPanel();
            chatInput.value = '';
            chatInput.style.height = 'auto';
            return;
        }

        hideWelcomeScreen();

        // Add user message
        addMessage('user', text);
        messages.push({ role: 'user', content: text });

        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Show typing
        showTyping();

        // Get response
        getBotResponse().then(function(response) {
            hideTyping();
            addMessage('bot', response);
            messages.push({ role: 'assistant', content: response });
            saveChat();
        }).catch(function(error) {
            hideTyping();
            var errorMsg = 'با عرض پوزش، مشکلی در ارتباط با سرور پیش آمد.';
            if (error.message && error.message.indexOf('401') !== -1) {
                errorMsg += ' لطفا API Key را در پنل مدیریت بررسی کنید.';
            } else if (error.message && error.message.indexOf('429') !== -1) {
                errorMsg += ' محدودیت درخواست exceeded. لطفا چند لحظه صبر کنید.';
            } else if (error.message && error.message.indexOf('500') !== -1) {
                errorMsg += ' خطای سرور. لطفا مدل دیگری انتخاب کنید.';
            }
            addMessage('bot', errorMsg);
            console.error('Error:', error);
        });
    }

    function addMessage(role, text) {
        if (!chatContainer) return;

        var messageEl = document.createElement('div');
        messageEl.className = 'message ' + role;

        var avatar = role === 'bot'
            ? '<div class="message-avatar bot">&#128330;</div>'
            : '<div class="message-avatar user">&#128100;</div>';

        var author = role === 'bot' ? 'اوای یقین' : 'شما';
        var formattedText = formatMessage(text);

        messageEl.innerHTML = avatar +
            '<div class="message-content">' +
            '<div class="message-author">' + author + '</div>' +
            '<div class="message-text">' + formattedText + '</div>' +
            (role === 'bot' ? getMessageActions(text) : '') +
            '</div>';

        chatContainer.appendChild(messageEl);
        scrollToBottom();
    }

    function formatMessage(text) {
        var formatted = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Code blocks
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Headers
        formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    function getMessageActions(text) {
        return '<div class="message-actions">' +
            '<button class="message-action-btn" onclick="window.copyMessageText(this)" title="کپی">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
            '</button>' +
            '</div>';
    }

    function showTyping() {
        isTyping = true;
        if (sendBtn) sendBtn.disabled = true;

        var typingEl = document.createElement('div');
        typingEl.className = 'message bot';
        typingEl.id = 'typing-indicator';
        typingEl.innerHTML = '<div class="message-avatar bot">&#128330;</div>' +
            '<div class="message-content">' +
            '<div class="message-author">اوای یقین</div>' +
            '<div class="typing-indicator"><span></span><span></span><span></span></div>' +
            '</div>';

        chatContainer.appendChild(typingEl);
        scrollToBottom();
    }

    function hideTyping() {
        isTyping = false;
        if (sendBtn) sendBtn.disabled = false;
        var typingEl = document.getElementById('typing-indicator');
        if (typingEl) typingEl.remove();
    }

    // ============================================
    // MAIN API CALL - With Proxy + Direct Fallback
    // ============================================
    function getBotResponse() {
        // Reload settings
        loadSettings();

        // Load personality
        var personality = BOT_PERSONALITY;
        try {
            var savedPersonality = localStorage.getItem('oay_personality');
            if (savedPersonality && savedPersonality.trim().length > 0) {
                personality = savedPersonality;
            }
        } catch(e) {}

        // Load training data
        var trainingText = '';
        try {
            var savedTraining = localStorage.getItem('oay_training');
            if (savedTraining) {
                var training = JSON.parse(savedTraining);
                if (training && training.length > 0) {
                    trainingText = '\n\n## دانش اضافی:\n';
                    for (var i = 0; i < training.length; i++) {
                        trainingText += 'سوال: ' + training[i].question + '\n';
                        trainingText += 'پاسخ: ' + training[i].answer + '\n\n';
                    }
                }
            }
        } catch(e) {}

        var fullPersonality = personality + trainingText;

        var provider = botSettings.provider || CONFIG.DEFAULT_PROVIDER;
        var apiKey = botSettings.apiKey || CONFIG.DEFAULT_API_KEY;
        var model = botSettings.model || CONFIG.DEFAULT_MODEL;
        var apiUrl = botSettings.apiUrl || CONFIG.DEFAULT_URL;
        var temperature = botSettings.temperature !== undefined ? botSettings.temperature : CONFIG.DEFAULT_TEMPERATURE;
        var maxTokens = botSettings.maxTokens || CONFIG.DEFAULT_MAX_TOKENS;
        var topP = botSettings.topP !== undefined ? botSettings.topP : CONFIG.DEFAULT_TOP_P;
        var frequencyPenalty = botSettings.frequencyPenalty !== undefined ? botSettings.frequencyPenalty : CONFIG.DEFAULT_FREQUENCY_PENALTY;
        var presencePenalty = botSettings.presencePenalty !== undefined ? botSettings.presencePenalty : CONFIG.DEFAULT_PRESENCE_PENALTY;

        var providerConfig = CONFIG.PROVIDERS[provider] || CONFIG.PROVIDERS.groq;

        // Build request body and headers
        var requestBody;
        var targetHeaders = {};

        if (provider === 'anthropic') {
            targetHeaders['x-api-key'] = apiKey;
            targetHeaders['anthropic-version'] = '2023-06-01';

            var anthropicMessages = [];
            for (var j = 0; j < messages.length; j++) {
                anthropicMessages.push({
                    role: messages[j].role === 'assistant' ? 'assistant' : 'user',
                    content: messages[j].content
                });
            }

            requestBody = {
                model: model,
                max_tokens: maxTokens,
                temperature: temperature,
                top_p: topP,
                system: fullPersonality,
                messages: anthropicMessages
            };
        } else if (provider === 'google') {
            var geminiUrl = apiUrl + model + ':generateContent';

            var geminiContents = [];
            for (var k = 0; k < messages.length; k++) {
                geminiContents.push({
                    role: messages[k].role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: messages[k].content }]
                });
            }

            requestBody = {
                contents: geminiContents,
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxTokens,
                    topP: topP
                }
            };

            // For Google, we need to handle differently
            // Try proxy first, then direct
            return callApiWithFallback(geminiUrl, requestBody, { 'Content-Type': 'application/json' }, provider, apiKey, true);
        } else {
            // OpenAI-compatible format (Groq, OpenAI, Custom)
            targetHeaders['Authorization'] = 'Bearer ' + apiKey;

            var openaiMessages = [{ role: 'system', content: fullPersonality }];
            for (var m = 0; m < messages.length; m++) {
                openaiMessages.push({
                    role: messages[m].role,
                    content: messages[m].content
                });
            }

            requestBody = {
                model: model,
                messages: openaiMessages,
                temperature: temperature,
                max_tokens: maxTokens,
                top_p: topP,
                frequency_penalty: frequencyPenalty,
                presence_penalty: presencePenalty
            };
        }

        // Try proxy first, then direct fallback
        return callApiWithFallback(apiUrl, requestBody, targetHeaders, provider, apiKey, false);
    }

    // ============================================
    // PROXY + DIRECT FALLBACK
    // ============================================
    function callApiWithFallback(apiUrl, requestBody, targetHeaders, provider, apiKey, isGoogle) {
        // First, try Proxy (if enabled and not on local file)
        var useProxy = CONFIG.USE_PROXY && window.location.protocol !== 'file:';

        if (useProxy) {
            return callViaProxy(apiUrl, requestBody, targetHeaders, provider, apiKey, isGoogle)
                .catch(function(err) {
                    console.log('Proxy failed, trying direct...');
                    return callDirect(apiUrl, requestBody, targetHeaders, provider, apiKey, isGoogle);
                });
        } else {
            // Direct call (needs VPN for filtered APIs)
            return callDirect(apiUrl, requestBody, targetHeaders, provider, apiKey, isGoogle);
        }
    }

    function callViaProxy(apiUrl, requestBody, targetHeaders, provider, apiKey, isGoogle) {
        var proxyBody = {
            provider: provider,
            apiUrl: apiUrl,
            apiKey: apiKey,
            requestBody: requestBody,
            headers: targetHeaders
        };

        return fetch(CONFIG.PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(proxyBody)
        }).then(function(response) {
            if (!response.ok) {
                return response.json().then(function(data) {
                    throw new Error('Proxy error: ' + (data.error || response.status));
                });
            }
            return response.json();
        }).then(function(data) {
            return extractResponse(data, provider);
        });
    }

    function callDirect(apiUrl, requestBody, targetHeaders, provider, apiKey, isGoogle) {
        var headers = {
            'Content-Type': 'application/json'
        };

        if (isGoogle) {
            // Google uses query param
            apiUrl = apiUrl + '?key=' + apiKey;
        } else if (provider === 'anthropic') {
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
        } else {
            headers['Authorization'] = 'Bearer ' + apiKey;
        }

        // Merge target headers
        for (var key in targetHeaders) {
            headers[key] = targetHeaders[key];
        }

        return fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        }).then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function(data) {
            return extractResponse(data, provider);
        });
    }

    function extractResponse(data, provider) {
        if (provider === 'anthropic') {
            return data.content && data.content[0] ? data.content[0].text : '';
        } else if (provider === 'google') {
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                return data.candidates[0].content.parts[0].text;
            }
            throw new Error('Invalid Google response format');
        } else {
            // OpenAI format
            return data.choices[0].message.content;
        }
    }

    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    function saveChat() {
        if (!currentChatId) currentChatId = Date.now().toString();

        var chatData = {
            id: currentChatId,
            title: getChatTitle(),
            messages: messages,
            timestamp: Date.now(),
            userName: userInfo.name,
            userPhone: userInfo.phone
        };

        var existingIndex = -1;
        for (var i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].id === currentChatId) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex >= 0) {
            chatHistory[existingIndex] = chatData;
        } else {
            var newHistory = [chatData];
            for (var h = 0; h < chatHistory.length; h++) {
                newHistory.push(chatHistory[h]);
            }
            chatHistory = newHistory;
        }

        var maxHistory = 50;
        try {
            var s = localStorage.getItem('oay_settings');
            if (s) {
                var parsed = JSON.parse(s);
                if (parsed.maxHistoryChats) maxHistory = parsed.maxHistoryChats;
            }
        } catch(e) {}

        if (chatHistory.length > maxHistory) {
            chatHistory = chatHistory.slice(0, maxHistory);
        }

        localStorage.setItem('oay_chats', JSON.stringify(chatHistory));
        renderChatHistory();
    }

    function getChatTitle() {
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].role === 'user') {
                var content = messages[i].content;
                return content.substring(0, 30) + (content.length > 30 ? '...' : '');
            }
        }
        return 'گفتگوی جدید';
    }

    function renderChatHistory() {
        if (!chatHistoryEl) return;

        if (chatHistory.length === 0) {
            chatHistoryEl.innerHTML = '<div class="history-title">تاریخچه گفتگوها</div>';
            return;
        }

        var html = '<div class="history-title">تاریخچه گفتگوها</div>';
        for (var i = 0; i < chatHistory.length; i++) {
            var chat = chatHistory[i];
            var isActive = chat.id === currentChatId;
            html += '<div class="history-item ' + (isActive ? 'active' : '') + '" data-chat-id="' + chat.id + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
                '<span>' + escapeHtml(chat.title || 'گفتگوی بدون عنوان') + '</span>' +
                '</div>';
        }
        chatHistoryEl.innerHTML = html;

        var historyItems = chatHistoryEl.querySelectorAll('.history-item');
        for (var idx = 0; idx < historyItems.length; idx++) {
            historyItems[idx].addEventListener('click', function() {
                var chatId = this.getAttribute('data-chat-id');
                loadChat(chatId);
            });
        }
    }

    function loadChat(chatId) {
        var chat = null;
        for (var i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].id === chatId) {
                chat = chatHistory[i];
                break;
            }
        }
        if (!chat) return;

        currentChatId = chatId;
        messages = chat.messages ? chat.messages.slice() : [];

        hideWelcomeScreen();
        chatContainer.innerHTML = '';

        for (var i = 0; i < messages.length; i++) {
            addMessage(messages[i].role, messages[i].content);
        }

        renderChatHistory();
    }

    function openAdminPanel() {
        localStorage.setItem('oay_admin_authenticated', JSON.stringify({
            authenticated: true,
            timestamp: Date.now()
        }));

        var toast = document.createElement('div');
        toast.className = 'admin-access-toast show';
        toast.innerHTML = '<span style="font-size:20px">&#128274;</span> در حال باز کردن پنل مدیریت...';
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.remove();
            window.open('admin.html', '_blank');
        }, 1500);
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Global functions for inline onclick
    window.copyMessageText = function(btn) {
        var messageEl = btn.closest('.message');
        if (!messageEl) return;
        var textEl = messageEl.querySelector('.message-text');
        if (!textEl) return;
        var text = textEl.innerText;
        navigator.clipboard.writeText(text).then(function() {
            btn.style.color = '#c9a84c';
            setTimeout(function() { btn.style.color = ''; }, 1000);
        });
    };

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
