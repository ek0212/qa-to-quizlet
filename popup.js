document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const inputText = document.getElementById('inputText');
  const formatBtn = document.getElementById('formatBtn');
  const copyBtn = document.getElementById('copyBtn');
  const previewDiv = document.getElementById('preview');
  const previewSection = document.querySelector('.preview-section');
  const statusDiv = document.getElementById('status');

  // Event listeners
  formatBtn.addEventListener('click', handleFormat);
  copyBtn.addEventListener('click', handleCopy);
  inputText.addEventListener('input', () => {
    // Hide preview and copy button when input changes
    previewSection.style.display = 'none';
    copyBtn.style.display = 'none';
    showStatus('', '');
  });

  // Format the input text for Quizlet
  function handleFormat() {
    const text = inputText.value;
    
    if (!text) {
      showStatus('Please paste your spreadsheet data first', 'error');
      return;
    }

    try {
      // First, normalize line endings and remove any zero-width spaces
      const normalizedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\u200B/g, ''); // Remove zero-width spaces
      
      // Split into rows and clean up
      const rows = normalizedText
        .split('\n')
        .map(row => row.trim())
        .filter(row => row.length > 0);

      console.log(`Total rows found: ${rows.length}`);
      
      // Remove header row if it exists (case insensitive check for "Question" and "Answer")
      let startIndex = 0;
      if (rows.length > 0 && rows[0].toLowerCase().includes('question') && rows[0].toLowerCase().includes('answer')) {
        startIndex = 1;
        console.log('Header row found, removing:', rows[0]);
      }

      // Format each row for Quizlet
      let currentQuestion = '';
      let currentAnswer = '';
      let formattedPairs = [];

      rows.slice(startIndex).forEach((row, index) => {
        // Log row details for debugging
        console.log(`Processing row ${index + 1}:`, JSON.stringify(row));
        
        if (row.startsWith('\t')) {
          // This is a continuation of the previous answer
          if (currentAnswer) {
            currentAnswer += ' ' + row.trim();
          }
          console.log(`Row ${index + 1} is continuation of previous answer`);
          return;
        }

        const parts = row.split('\t');
        
        if (parts.length < 2) {
          // If we have a current Q&A pair, save it before reporting the error
          if (currentQuestion && currentAnswer) {
            const cleanText = text => text
              .trim()
              .replace(/\s+/g, ' ')
              .replace(/[""]/g, '"')
              .replace(/['']/g, "'")
              .replace(/[–—]/g, '-')
              .replace(/\t/g, ' ')
              .replace(/\r?\n/g, ' ')
              .replace(/,/g, '. ')  // Replace commas with period+space
              .replace(/\s+/g, ' ')
              .trim();

            formattedPairs.push(`${cleanText(currentQuestion)},${cleanText(currentAnswer)}`);
            currentQuestion = '';
            currentAnswer = '';
          }
          
          console.log(`Row ${index + 1} content dump:`, {
            raw: row,
            charCodes: [...row].map(c => c.charCodeAt(0)),
            containsTab: row.includes('\t'),
            parts: parts
          });
          
          // Skip this row and continue processing
          console.log(`Skipping invalid row ${index + 1}`);
          return;
        }

        // If we have a previous Q&A pair, save it
        if (currentQuestion && currentAnswer) {
          const cleanText = text => text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/[–—]/g, '-')
            .replace(/\t/g, ' ')
            .replace(/\r?\n/g, ' ')
            .replace(/,/g, '. ')  // Replace commas with period+space
            .replace(/\s+/g, ' ')
            .trim();

          formattedPairs.push(`${cleanText(currentQuestion)},${cleanText(currentAnswer)}`);
        }

        // Start a new Q&A pair
        currentQuestion = parts[0];
        currentAnswer = parts.slice(1).join(' ');
      });

      // Don't forget to add the last pair if it exists
      if (currentQuestion && currentAnswer) {
        const cleanText = text => text
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[""]/g, '"')
          .replace(/['']/g, "'")
          .replace(/[–—]/g, '-')
          .replace(/\t/g, ' ')
          .replace(/\r?\n/g, ' ')
          .replace(/,/g, '. ')  // Replace commas with period+space
          .replace(/\s+/g, ' ')
          .trim();

        formattedPairs.push(`${cleanText(currentQuestion)},${cleanText(currentAnswer)}`);
      }

      console.log('Final formatted pairs:', formattedPairs.length);

      if (formattedPairs.length === 0) {
        throw new Error('No valid data found. Make sure your data has questions and answers separated by tabs.');
      }

      const finalText = formattedPairs.join(';');
      
      // Show preview
      previewDiv.textContent = finalText;
      previewSection.style.display = 'block';
      copyBtn.style.display = 'inline-flex';
      
      // Store formatted text for copying
      copyBtn.dataset.text = finalText;
      
      showStatus(`Successfully formatted ${formattedPairs.length} questions! Click "Copy to Clipboard" to use in Quizlet.`, 'success');
    } catch (error) {
      console.error('Error processing data:', error);
      showStatus(error.message, 'error');
    }
  }

  // Copy formatted text to clipboard
  async function handleCopy() {
    const text = copyBtn.dataset.text;
    
    try {
      await navigator.clipboard.writeText(text);
      showStatus('Copied to clipboard!', 'success');
    } catch (error) {
      showStatus('Failed to copy to clipboard', 'error');
    }
  }

  // Helper function
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }
}); 