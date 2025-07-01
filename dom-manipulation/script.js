const SERVER_URL = 'https://mocki.io/v1/YOUR-API-ENDPOINT';

let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is really simple, but we insist on making it complicated.", category: "Life" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function populateCategories() {
  const filter = document.getElementById('categoryFilter');
  const selected = localStorage.getItem('lastCategory') || 'all';
  const categories = [...new Set(quotes.map(q => q.category))];

  filter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filter.appendChild(option);
  });

  filter.value = selected;
}

function filterQuotes() {
  const category = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastCategory', category);

  const filtered = category === 'all'
    ? quotes
    : quotes.filter(q => q.category === category);

  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = '';

  if (filtered.length === 0) {
    quoteDisplay.textContent = 'No quotes in this category.';
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];

  sessionStorage.setItem('lastQuote', JSON.stringify(quote));

  const quoteEl = document.createElement('p');
  quoteEl.textContent = `"${quote.text}" - [${quote.category}]`;
  quoteDisplay.appendChild(quoteEl);
}

function showRandomQuote() {
  filterQuotes();
}

function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert('Both quote and category are required.');
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  alert('Quote added successfully!');

  textInput.value = '';
  categoryInput.value = '';
}

// ✅ Dynamically creates the quote form
function createAddQuoteForm() {
  const formContainer = document.createElement('div');
  formContainer.style.marginTop = '30px';

  const quoteInput = document.createElement('input');
  quoteInput.id = 'newQuoteText';
  quoteInput.type = 'text';
  quoteInput.placeholder = 'Enter a new quote';

  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category';

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Quote';
  addBtn.onclick = addQuote;

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addBtn);

  document.body.appendChild(formContainer);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      const valid = importedQuotes.filter(q => q.text && q.category);
      quotes.push(...valid);
      saveQuotes();
      populateCategories();
      alert('Quotes imported successfully!');
    } catch {
      alert('Invalid JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'quotes.json';
  link.click();
  URL.revokeObjectURL(url);
}

function syncWithServer() {
  fetch(SERVER_URL)
    .then(response => response.json())
    .then(serverQuotes => {
      let added = 0, replaced = 0;

      serverQuotes.forEach(serverQuote => {
        const match = quotes.find(local => local.text === serverQuote.text);
        if (!match) {
          quotes.push(serverQuote);
          added++;
        } else if (JSON.stringify(match) !== JSON.stringify(serverQuote)) {
          Object.assign(match, serverQuote);
          replaced++;
        }
      });

      if (added || replaced) {
        saveQuotes();
        populateCategories();
      }

      const syncMsg = `Sync complete: ${added} added, ${replaced} replaced.`;
      notifySyncStatus(syncMsg);
    })
    .catch(() => notifySyncStatus('Failed to sync with server.', true));
}

function notifySyncStatus(message, isError = false) {
  const status = document.getElementById('syncStatus');
  status.textContent = message;
  status.style.color = isError ? 'red' : 'green';
  setTimeout(() => (status.textContent = ''), 5000);
}

document.getElementById('newQuote').addEventListener('click', showRandomQuote);

window.onload = () => {
  populateCategories();
  filterQuotes();
  createAddQuoteForm(); // 👈 builds the form on page load
  setInterval(syncWithServer, 30000);
};
