const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // required for check

let selectedCategory = localStorage.getItem('lastCategory') || 'all';

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
  const categories = [...new Set(quotes.map(q => q.category))];

  filter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filter.appendChild(option);
  });

  filter.value = selectedCategory;
}

function filterQuotes() {
  selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastCategory', selectedCategory);

  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = '';

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = 'No quotes in this category.';
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

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

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  alert('Quote added successfully!');

  postQuoteToServer(newQuote);

  textInput.value = '';
  categoryInput.value = '';
}

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

async function fetchQuotesFromServer() {
  const response = await fetch(SERVER_URL);
  const data = await response.json();
  return data.map(post => ({
    text: post.title,
    category: 'Imported'
  }));
}

async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: quote.text, body: quote.category })
    });
  } catch (error) {
    console.log('Failed to post to server');
  }
}

async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let added = 0;

    serverQuotes.forEach(serverQuote => {
      const exists = quotes.find(local => local.text === serverQuote.text);
      if (!exists) {
        quotes.push(serverQuote);
        added++;
      }
    });

    if (added > 0) {
  saveQuotes();
  populateCategories();
}
  notifySyncStatus("Quotes synced with server!");
  } catch (err) {
    notifySyncStatus('Failed to sync with server.', true);
  }
}

function notifySyncStatus(message, isError = false) {
  let status = document.getElementById('syncStatus');
  if (!status) {
    status = document.createElement('div');
    status.id = 'syncStatus';
    status.style.marginTop = '15px';
    document.body.appendChild(status);
  }

  status.textContent = message;
  status.style.color = isError ? 'red' : 'green';
  setTimeout(() => (status.textContent = ''), 4000);
}

document.getElementById('newQuote').addEventListener('click', showRandomQuote);

window.onload = () => {
  populateCategories();
  filterQuotes();
  createAddQuoteForm();
  setInterval(syncQuotes, 30000);
};
