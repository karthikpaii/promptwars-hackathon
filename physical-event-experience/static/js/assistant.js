document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('ai-assistant-toggle');
    const windowEl = document.getElementById('ai-assistant-window');
    const closeBtn = document.getElementById('close-assistant');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Toggle assistant window
    toggle.addEventListener('click', () => {
        windowEl.classList.toggle('hidden');
        if (!windowEl.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('hidden');
    });

    // Handle chat submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message to UI
        addMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        const typingId = showTyping();

        try {
            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();

            // Remove typing indicator and add assistant response
            hideTyping(typingId);
            addMessage(data.message, 'assistant', true);
        } catch (error) {
            hideTyping(typingId);
            addMessage("I'm sorry, I'm having trouble connecting to the Gemini engine right now. Please try again later.", 'assistant');
        }
    });

    function addMessage(text, type, markdown = false) {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        
        let processedText = text;
        if (markdown) {
            // Simple markdown-to-html conversion for bold and highlights
            processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

        div.innerHTML = `<p>${processedText}</p>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        if (window.lucide) window.lucide.createIcons({root: div});
    }

    function showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-message assistant typing';
        div.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function hideTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
