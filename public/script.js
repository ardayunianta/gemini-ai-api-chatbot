const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Store conversation history for API calls
let conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to UI
  appendMessage('user', userMessage);
  
  // Add user message to conversation history
  conversationHistory.push({
    role: 'user',
    text: userMessage
  });

  // Clear input field
  input.value = '';
  
  // Disable submit button during API call
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  // Show thinking message with a unique ID for replacement
  const thinkingId = 'thinking-' + Date.now();
  const thinkingElement = appendMessage('bot', 'Thinking...', thinkingId);

  try {
    // Call backend API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation: conversationHistory
      })
    });

    // Check if response is OK
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check if result exists in response
    if (!data.result) {
      throw new Error('No response received from server');
    }

    // Format and replace thinking message with actual response
    const botMessage = formatResponse(data.result);
    replaceMessage(thinkingElement, botMessage);

    // Add bot message to conversation history
    conversationHistory.push({
      role: 'model',
      text: data.result
    });

  } catch (error) {
    console.error('Error:', error);

    // Determine error message
    let errorMessage = 'Failed to get response from server.';
    if (error instanceof TypeError) {
      // Network error
      errorMessage = 'Network error: Unable to connect to server.';
    } else if (error.message === 'No response received from server') {
      errorMessage = 'Sorry, no response received.';
    }

    // Replace thinking message with error message
    replaceMessage(thinkingElement, errorMessage);
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    input.focus();
  }
});

/**
 * Format AI response into structured, easy-to-read paragraphs
 * @param {string} text - Raw AI response text
 * @returns {string} Formatted response with proper line breaks
 */
function formatResponse(text) {
  // Split text by double newlines or multiple spaces followed by newlines
  const paragraphs = text.split(/\n\s*\n+|\n{2,}/);

  // Filter out empty paragraphs and trim whitespace
  const cleanParagraphs = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Join paragraphs with proper spacing
  return cleanParagraphs.join('\n\n');
}

/**
 * Append a new message to the chat box
 * @param {string} sender - 'user' or 'bot'
 * @param {string} text - Message text
 * @param {string} id - Optional unique ID for the message element
 * @returns {HTMLElement} The created message element
 */
function appendMessage(sender, text, id = null) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  // Use white-space: pre-wrap to preserve formatting
  msg.style.whiteSpace = 'pre-wrap';
  msg.style.wordWrap = 'break-word';

  msg.textContent = text;

  if (id) {
    msg.id = id;
  }

  chatBox.appendChild(msg);

  // Auto-scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;

  return msg;
}

/**
 * Replace the content of an existing message element
 * @param {HTMLElement} element - The message element to replace
 * @param {string} newText - The new message text
 */
function replaceMessage(element, newText) {
  element.textContent = newText;
  element.style.whiteSpace = 'pre-wrap';
  element.style.wordWrap = 'break-word';

  // Auto-scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}